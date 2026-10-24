// Shared owner-private file checks; no environment or file I/O at import time.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { z } from "zod";
const fail = () => Error("Private V3 evidence refused.");
/** Pure Windows ACL policy, also exercised without inspecting real secrets. */
export function assertCloudPrivateAcl(value: unknown) {
  const result = z
    .object({
      owner: z.string().min(1),
      current: z.string().min(1),
      allowed: z.array(z.string()).min(1),
      nonNullDacl: z.literal(true),
    })
    .strict()
    .safeParse(value);
  if (!result.success) throw fail();
  const r = result.data;
  if (
    r.owner !== r.current ||
    r.allowed.some((s) => ![r.current, "S-1-5-18", "S-1-5-32-544"].includes(s))
  )
    throw fail();
}

// Owner, SYSTEM and local Administrators only. No ACL repair or chmod is done.
function windowsPrivate(file: string) {
  const script =
    "$ErrorActionPreference='Stop'; $a=Get-Acl -LiteralPath $env:KRAVV_ACL_PATH; $sid=[System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value; $owner=$a.GetOwner([System.Security.Principal.SecurityIdentifier]).Value; $rules=@($a.GetAccessRules($true,$true,[System.Security.Principal.SecurityIdentifier]) | Where-Object {$_.AccessControlType -eq 'Allow'} | ForEach-Object {$_.IdentityReference.Value}); $raw=[System.Security.AccessControl.RawSecurityDescriptor]::new($a.Sddl); @{owner=$owner; current=$sid; allowed=$rules; nonNullDacl=($null -ne $raw.DiscretionaryAcl)} | ConvertTo-Json -Compress";
  const result = JSON.parse(
    execFileSync(
      path.join(
        process.env.SystemRoot ?? "C:\\Windows",
        "System32/WindowsPowerShell/v1.0/powershell.exe",
      ),
      ["-NoProfile", "-NonInteractive", "-Command", script],
      {
        env: {
          NODE_ENV: "production",
          SystemRoot: process.env.SystemRoot,
          KRAVV_ACL_PATH: file,
        },
        encoding: "utf8",
        timeout: 5000,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      },
    ),
  );
  assertCloudPrivateAcl(result);
}

export function privatePath(
  file: string,
  directory: boolean,
  simulation: boolean,
) {
  const st = fs.lstatSync(file);
  if (
    st.isSymbolicLink() ||
    (directory ? !st.isDirectory() : !st.isFile() || st.nlink !== 1)
  )
    throw fail();
  if (process.platform === "win32") {
    if (!simulation) windowsPrivate(file);
  } else if (st.uid !== process.getuid?.() || (st.mode & 0o077) !== 0)
    throw fail();
}

export function readPrivateBytes(
  root: string,
  name: string,
  simulation: boolean,
) {
  const file = path.join(root, name);
  privatePath(file, false, simulation);
  const fd = fs.openSync(
    file,
    fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0),
  );
  try {
    const before = fs.lstatSync(file),
      opened = fs.fstatSync(fd);
    if (
      before.ino !== opened.ino ||
      before.dev !== opened.dev ||
      opened.nlink !== 1 ||
      opened.size > 32768
    )
      throw fail();
    return fs.readFileSync(fd);
  } finally {
    fs.closeSync(fd);
  }
}
