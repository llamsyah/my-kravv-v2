import assert from "node:assert/strict";
export function createLocalHttpSession() {
  const base = process.env.MY_KRAVV_TEST_APP_URL ?? "http://127.0.0.1:3000";
  const origin = new URL(base).origin;
  assert.ok(
    ["localhost", "127.0.0.1", "[::1]"].includes(new URL(base).hostname),
    "Live app verification is limited to localhost.",
  );
  const cookies = new Map<string, string>();
  return {
    async request(path: string, form?: FormData) {
      const headers = new Headers({
        cookie: [...cookies]
          .map(([key, value]) => `${key}=${value}`)
          .join("; "),
      });
      if (form) headers.set("origin", origin);
      const label = `${form ? "POST" : "GET"} ${path.replace(/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/gi, "[companyId]")}`;
      let response: Response;
      try {
        response = await fetch(new URL(path, base), {
          method: form ? "POST" : "GET",
          body: form,
          headers,
          redirect: "manual",
          signal: AbortSignal.timeout(15000),
        });
      } catch {
        throw new Error(`Local HTTP response failed: ${label}`);
      }
      const readText = response.text.bind(response);
      response.text = async () => {
        try {
          return await readText();
        } catch {
          throw new Error(`Local HTTP body failed: ${label}`);
        }
      };
      for (const value of response.headers.getSetCookie()) {
        const [pair] = value.split(";");
        const separator = pair.indexOf("=");
        const name = pair.slice(0, separator);
        if (/max-age=0/i.test(value)) cookies.delete(name);
        else cookies.set(name, pair.slice(separator + 1));
      }
      return response;
    },
    redirectPath(response: Response) {
      return new URL(response.headers.get("location")!, base).pathname;
    },
  };
}
export function serverActionForm(html: string, id?: string) {
  const formHtml = [...html.matchAll(/<form\b[\s\S]*?<\/form>/g)]
    .map((match) => match[0])
    .find((form) => !id || form.includes(`id="${id}"`));
  assert.ok(formHtml, "Expected server-rendered form was absent.");
  const form = new FormData();
  for (const input of formHtml.matchAll(/<input\b[^>]*>/g)) {
    const name = input[0].match(/name="([^"]*)"/)?.[1];
    if (!name || (!name.startsWith("$ACTION_") && name !== "company_id"))
      continue;
    const value = input[0].match(/value="([^"]*)"/)?.[1] ?? "";
    form.set(
      name,
      value
        .replaceAll("&quot;", '"')
        .replaceAll("&amp;", "&")
        .replaceAll("&#x27;", "'"),
    );
  }
  assert.ok(
    [...form.keys()].some((key) => key.startsWith("$ACTION_")),
    "Server Action fields were absent.",
  );
  return form;
}
