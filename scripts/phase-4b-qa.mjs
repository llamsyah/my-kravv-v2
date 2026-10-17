import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
assert.equal(process.env.MY_KRAVV_LIVE_TESTS, "development");
const stage = process.argv[2];
assert.ok(
  [
    "before",
    "after",
    "fault",
    "interactions",
    "conflict",
    "accessibility",
  ].includes(stage),
);
const { chromium } = createRequire(import.meta.url)(
  process.env.MY_KRAVV_PLAYWRIGHT_PATH,
);
const f = JSON.parse(
  await readFile(".env.phase-1-visual-fixture.json", "utf8"),
);
assert.ok(f.phase4b);
const base =
  process.env.MY_KRAVV_QA_BASE_URL ??
  (stage === "fault" ? "http://localhost:3001" : "http://localhost:3000");
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const output = path.resolve(".qa/milestone-5.5-phase-4b");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (["error", "warning"].includes(m.type())) errors.push(m.text());
});
const cases =
  stage === "fault"
    ? [["uncertain", f.refineStates.pending]]
    : [
        ["original", f.displayStates.original],
        ["pending", f.refineStates.pending],
        ["suggested", f.refinePath],
        ["editing", f.refinePath],
        ["long", f.refineStates.long],
        ["accepted-original", f.displayStates.available],
        ["accepted-selected", f.displayStates.selected],
        ["selected-superseded", f.displayStates.multiple],
        ["rejected", f.refineStates.rejected],
        ["multiple", f.refineStates.multiple],
        ["archived", f.displayStates.archived],
        ["hub", `/companies/${f.company}/refinements`],
      ];
const measures = [];
try {
  await page.goto(base + "/auth");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(f.email);
  await page
    .getByRole("textbox", { name: "Kata sandi", exact: true })
    .fill(f.password);
  await page
    .getByRole("button", { name: "Masuk ke ruang pribadi", exact: true })
    .click();
  await page.waitForURL(base + "/");
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [name, route] of [
      "interactions",
      "conflict",
      "accessibility",
    ].includes(stage)
      ? []
      : cases) {
      await page.goto(base + route);
      await page
        .getByRole("navigation", {
          name: "Bagian ruang perusahaan",
          exact: true,
        })
        .waitFor();
      await page.evaluate(() => document.fonts.ready);
      if (name === "editing") {
        await page.locator(".refine-edit > summary").click();
        await page
          .locator(".refine-edit textarea")
          .fill(
            "aku belum memeriksa laporan arus kasnya.\n\nAku masih tertarik, tapi belum punya kesimpulan.",
          );
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      const m = await page.evaluate(() => {
        const box = (e) => {
          if (!e) return null;
          const r = e.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        };
        return {
          width: innerWidth,
          overflow:
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
          rootZoom: getComputedStyle(document.documentElement).zoom,
          bodyZoom: getComputedStyle(document.body).zoom,
          dpr: devicePixelRatio,
          scale: visualViewport.scale,
          fonts: document.fonts.status,
          state: document
            .querySelector("[data-refine-state]")
            ?.getAttribute("data-refine-state"),
          comparison: [
            ...document.querySelectorAll('[class*="__comparison"] > section'),
          ]
            .filter((e) => getComputedStyle(e).display !== "none")
            .map(box),
          review: !!document.querySelector(".refine-review-form"),
          generation: !!document.querySelector(".refine-generate"),
          history: !!document.getElementById("refine-history-title"),
          historyOpen: document
            .getElementById("refine-history-title")
            ?.closest("details")?.open,
          targets: [
            ...document.querySelectorAll(
              '.refine-review-form button, [class*="__switcher"] button, #thought-display select',
            ),
          ].map((e) => ({
            text: e.textContent.slice(0, 30),
            box: box(e),
            visible: getComputedStyle(e).display !== "none",
          })),
        };
      });
      assert.equal(m.width, width);
      assert.equal(m.overflow, 0, `${name} at ${width}`);
      if (stage === "after") {
        const reviewing = ["suggested", "editing", "long", "multiple"].includes(
          name,
        );
        if (name !== "hub") {
          assert.equal(m.review, reviewing);
          assert.equal(m.generation, !reviewing && name !== "pending");
        }
        if (reviewing && width > 700) {
          assert.ok(m.comparison[0].width > 250);
          assert.ok(
            Math.abs(m.comparison[0].width - m.comparison[1].width) < 1,
          );
        }
        if (name === "original") assert.equal(m.history, false);
        if (name === "pending") {
          assert.equal(m.generation, false);
          assert.equal(m.review, false);
        }
        if (m.history) assert.equal(m.historyOpen, false);
      }
      if (stage === "fault") {
        assert.equal(m.state, "WAITING");
        assert.equal(m.review, false);
        assert.equal(m.generation, false);
        await page
          .getByText("Status versi belum dapat dipastikan.", { exact: false })
          .waitFor();
      }
      measures.push({ name, ...m });
      await page.screenshot({
        path: path.join(output, `${stage}-${name}-${width}.png`),
        fullPage: true,
      });
      if (name === "suggested")
        await page.screenshot({
          path: path.join(output, `${stage}-suggested-${width}-viewport.png`),
        });
    }
    if (!["interactions", "conflict", "accessibility"].includes(stage))
      console.log(`${stage}: ${width}px actual Refine states verified.`);
  }
  await writeFile(
    path.join(output, `${stage}-measurements.json`),
    JSON.stringify(measures, null, 2),
  );
  if (stage === "interactions") {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(base + f.refinePath);
    await page.locator('[data-enhanced="true"]').waitFor();
    const switcher = page.getByRole("group", { name: "Tampilan perbandingan" });
    await switcher
      .getByRole("button", { name: "Asli", exact: true })
      .press("Enter");
    const raw = f.refineCheckpoint.originals.find(
      (t) => t.id === f.refinePath.split("/").at(-2),
    ).raw_content;
    assert.equal(
      await page
        .locator('section:has(>h3#original-title) [class*="__reading"]')
        .textContent(),
      raw,
    );
    await switcher
      .getByRole("button", { name: "Lihat keduanya", exact: true })
      .click();
    assert.equal(
      await page.locator('[class*="__comparison"] > section:visible').count(),
      2,
    );
    const edit = page.locator(".refine-edit");
    const ai = await edit.locator("textarea").inputValue();
    const draft =
      "  aku belum memeriksa laporannya.\n\nAku masih tertarik, tapi belum punya kesimpulan.  ";
    const posts = [];
    page.on("request", (r) => {
      if (r.method() === "POST") posts.push(r.url());
    });
    await edit.locator("summary").click();
    await edit.locator("textarea").fill(draft);
    await edit
      .getByRole("button", { name: "Batal sunting", exact: true })
      .click();
    assert.equal(await edit.getAttribute("open"), null);
    assert.equal(await edit.locator("textarea").inputValue(), ai);
    await edit.locator("summary").click();
    await page.waitForFunction(
      (text) => document.querySelector(".refine-edit textarea")?.value === text,
      draft,
    );
    assert.equal(await edit.locator("textarea").inputValue(), draft);
    assert.equal(posts.length, 0, "Editing/cancel never makes a decision");
    const accept = page.getByRole("button", {
      name: "Terima suntingan",
      exact: true,
    });
    await accept.evaluate((e) => e.scrollIntoView({ block: "center" }));
    const control = await accept.boundingBox();
    assert.ok(control.height >= 44);
    const rail = await page.evaluate(() => {
      const e = [...document.querySelectorAll("nav,div")].find((e) => {
        const s = getComputedStyle(e),
          r = e.getBoundingClientRect();
        return (
          s.position === "fixed" &&
          r.width > innerWidth * 0.75 &&
          r.y > innerHeight * 0.5
        );
      });
      return e ? e.getBoundingClientRect().y : innerHeight;
    });
    assert.ok(control.y + control.height <= rail);
    await page.screenshot({
      path: path.join(output, "editing-retained-mobile.png"),
    });
    await page.goto(base + f.displayStates.multiple);
    await page.locator("#thought-display").waitFor();
    const select = page.locator("#thought-display-form select");
    assert.equal(await select.inputValue(), f.displayVersions.multiple);
    await page.getByText("Ubah versi bacaan", { exact: true }).click();
    await select.selectOption("ORIGINAL");
    await page.getByText("Pratinjau · Asli", { exact: true }).waitFor();
    await page.screenshot({
      path: path.join(output, "preview-not-saved-mobile.png"),
    });
    await page.reload();
    await page.locator("#thought-display").waitFor();
    assert.equal(
      await page.locator("#thought-display-form select").inputValue(),
      f.displayVersions.multiple,
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator("#refine-history-title").click();
    await page.getByText("Lihat selengkapnya", { exact: true }).first().click();
    await page.screenshot({
      path: path.join(output, "version-trail-expanded-desktop.png"),
      fullPage: true,
    });
    await page
      .getByRole("link", { name: "Versi lebih lama →", exact: true })
      .click();
    await page.waitForURL(/before=/);
    await page.locator("#refine-history-title").waitFor();
    assert.equal(
      await page
        .locator("#refine-history-title")
        .evaluate((e) => e.closest("details").open),
      true,
    );
    const historyIds = await page
      .locator('[id^="refinement-"]')
      .evaluateAll((es) => es.map((e) => e.id));
    assert.equal(new Set(historyIds).size, historyIds.length);
    await page.screenshot({
      path: path.join(output, "older-versions-desktop.png"),
      fullPage: true,
    });
    await page.goto(base + f.refineStates.multiple);
    assert.equal(
      await page.locator("#thought-display-form select").inputValue(),
      f.phase4b.selectedRefinement,
    );
    if (await page.locator(".refine-review-form").count()) {
      assert.equal(
        await page
          .locator('.refine-review-form input[name="refinement_id"]')
          .inputValue(),
        f.phase4b.reviewProposal,
      );
      await page.getByRole("button", { name: "Terima", exact: true }).click();
      await page.waitForURL(/resolved=/);
    } else {
      await page.goto(
        base +
          f.refineStates.multiple +
          "?resolved=" +
          f.phase4b.reviewProposal +
          "#refinement-" +
          f.phase4b.reviewProposal,
      );
    }
    await page.locator('[data-refine-state="RESOLVED"]').waitFor();
    await page.locator("#thought-display").waitFor();
    assert.equal(
      await page.locator("#thought-display-form select").inputValue(),
      f.phase4b.selectedRefinement,
    );
    assert.equal(
      await page
        .locator("[data-refine-state]")
        .getAttribute("data-refine-state"),
      "RESOLVED",
    );
    assert.equal(await page.locator(".refine-review-form").count(), 0);
    assert.equal(
      new URL(page.url()).hash,
      "#refinement-" + f.phase4b.reviewProposal,
    );
    await page.screenshot({
      path: path.join(output, "accepted-display-unchanged-desktop.png"),
      fullPage: true,
    });
    const noJS = await browser.newContext({
      storageState: await context.storageState(),
      viewport: { width: 390, height: 900 },
    });
    await noJS.route("**/_next/static/**", (route) =>
      route.request().resourceType() === "script"
        ? route.abort()
        : route.continue(),
    );
    const fallback = await noJS.newPage();
    await fallback.goto(base + f.refinePath);
    await fallback.locator("#original-title").waitFor();
    assert.equal(
      await fallback
        .locator('[class*="__comparison"] > section:visible')
        .count(),
      2,
    );
    assert.equal(
      await fallback
        .locator("#original-title")
        .evaluate((e) => e.nextElementSibling.textContent),
      raw,
    );
    await fallback.screenshot({
      path: path.join(output, "no-client-enhancement-mobile.png"),
      fullPage: true,
    });
    await noJS.close();
    await page.goto(base + f.displayStates.archived);
    await page.locator("#thought-display").waitFor();
    await page.locator(".refine-new-proposal > summary").click();
    assert.equal(
      await page
        .getByRole("button", { name: "Rapikan dengan AI", exact: true })
        .isDisabled(),
      true,
    );
    await page.getByText("Ubah versi bacaan", { exact: true }).click();
    await page
      .getByRole("button", { name: "Gunakan versi ini", exact: true })
      .click();
    await page.waitForURL(/displaySaved=/);
    await writeFile(
      path.join(output, "interaction-checks.json"),
      JSON.stringify(
        {
          editCancelPreservesDraft: true,
          cancelMakesNoDecision: true,
          mobileControlHeight: control.height,
          mobileControlBottom: control.y + control.height,
          railTop: rail,
          previewNeverSaves: true,
          acceptPreservesDisplay: true,
          resolvedAnchor: true,
          noDuplicateVersionAnchors: true,
          withoutClientEnhancementOriginal: true,
          archivedGenerationDisabled: true,
          archivedDisplaySave: true,
        },
        null,
        2,
      ),
    );
  }
  if (stage === "conflict") {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(base + f.displayStates.multiple);
    await page.locator("#thought-display").waitFor();
    const other = await context.newPage();
    await other.goto(base + f.displayStates.multiple);
    await other.locator("#thought-display").waitFor();
    await page.getByText("Ubah versi bacaan", { exact: true }).click();
    await other.getByText("Ubah versi bacaan", { exact: true }).click();
    const select = page.locator("#thought-display-form select"),
      otherSelect = other.locator("#thought-display-form select");
    const current = await select.inputValue();
    const candidates = await select
      .locator("option")
      .evaluateAll(
        (es, current) =>
          es
            .map((e) => e.value)
            .filter((v) => v !== "ORIGINAL" && v !== current),
        current,
      );
    assert.ok(candidates.length >= 2);
    await select.selectOption(candidates[0]);
    await otherSelect.selectOption(candidates[1]);
    await page
      .getByRole("button", { name: "Gunakan versi ini", exact: true })
      .click();
    await page.waitForURL(/displaySaved=/);
    await other
      .getByRole("button", { name: "Gunakan versi ini", exact: true })
      .click();
    await other.getByText("Ubah versi bacaan", { exact: true }).click();
    const error = other.locator("#thought-display > .form-feedback");
    await error
      .filter({
        hasText: "Pilihan sudah berubah. Muat ulang sebelum menyimpan.",
      })
      .waitFor();
    assert.equal(await error.isVisible(), true);
    assert.equal(await otherSelect.inputValue(), candidates[1]);
    await other.screenshot({
      path: path.join(output, "display-conflict-visible-desktop.png"),
      fullPage: true,
    });
    await other.reload();
    await other.locator("#thought-display").waitFor();
    assert.equal(
      await other.locator("#thought-display-form select").inputValue(),
      candidates[0],
    );
    await writeFile(
      path.join(output, "conflict-checks.json"),
      JSON.stringify(
        {
          staleSaveRejected: true,
          errorVisibleOutsideDisclosure: true,
          previewValueRetained: true,
          reloadShowsWinner: true,
        },
        null,
        2,
      ),
    );
    await other.close();
  }
  if (stage === "accessibility") {
    const checks = [];
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + f.refinePath);
      await page.locator('[data-enhanced="true"]').waitFor();
      await page.evaluate(() => document.fonts.ready);
      if (width <= 700) {
        await page
          .getByRole("group", { name: "Tampilan perbandingan" })
          .getByRole("button", { name: "Asli", exact: true })
          .press("Enter");
      }
      const result = await page.evaluate(() => {
        function rgb(s) {
          return s
            .match(/[\d.]+/g)
            .slice(0, 3)
            .map(Number);
        }
        function luminance(s) {
          const c = rgb(s).map((v) => {
            v /= 255;
            return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          });
          return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
        }
        function background(e) {
          while (e) {
            const c = getComputedStyle(e).backgroundColor;
            if (c !== "rgba(0, 0, 0, 0)" && c !== "transparent") return c;
            e = e.parentElement;
          }
          return "rgb(11, 20, 28)";
        }
        function ratio(e) {
          const style = getComputedStyle(e),
            foreground = style.color,
            bg = background(e),
            a = luminance(foreground),
            b = luminance(bg);
          return {
            foreground,
            background: bg,
            ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
            opacity: style.opacity,
          };
        }
        const root = document.querySelector("[data-refine-state]");
        const reading =
            document.getElementById("original-title")?.nextElementSibling,
          button = root.querySelector(
            'button[name="status"][value="ACCEPTED"]',
          );
        const group = root.querySelector(
          '[aria-label="Tampilan perbandingan"]',
        );
        return {
          width: innerWidth,
          fonts: document.fonts.status,
          overflow:
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
          reading: ratio(reading),
          status: ratio(root.querySelector("header span")),
          accept: ratio(button),
          reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
          transitions: getComputedStyle(button).transitionDuration,
          switchButtons: [...group.querySelectorAll("button")].map((e) => ({
            height: e.getBoundingClientRect().height,
            pressed: e.getAttribute("aria-pressed"),
          })),
          focus: getComputedStyle(document.activeElement).outline,
        };
      });
      assert.equal(result.overflow, 0);
      assert.equal(result.fonts, "loaded");
      assert.ok(result.reduced);
      assert.ok(
        result.transitions.split(",").every((s) => parseFloat(s) === 0),
      );
      for (const v of [result.reading, result.status, result.accept])
        assert.ok(v.ratio >= 4.5 && v.opacity === "1");
      if (width <= 700) {
        assert.ok(result.switchButtons.every((b) => b.height >= 44));
        assert.equal(result.switchButtons[0].pressed, "true");
        assert.ok(!result.focus.includes("none"));
      }
      checks.push(result);
    }
    await writeFile(
      path.join(output, "accessibility-checks.json"),
      JSON.stringify(checks, null, 2),
    );
  }
  await writeFile(
    path.join(output, `${stage}-browser-log.json`),
    JSON.stringify(errors, null, 2),
  );
  assert.deepEqual(errors, []);
  await page.getByText("Akun", { exact: true }).click();
  await page.getByRole("button", { name: "Keluar", exact: true }).click();
  await page.waitForURL(/\/auth/);
} finally {
  await browser.close();
}
