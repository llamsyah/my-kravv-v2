/** Development-only browser regression checks against disposable mock fixtures. */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

assert.equal(process.env.MY_KRAVV_LIVE_TESTS, "development");
const stage = process.argv[2];
assert.ok(["before", "after", "preview"].includes(stage));
assert.ok(
  process.env.MY_KRAVV_PLAYWRIGHT_PATH,
  "Use the installed browser-test library; no dependency installation required.",
);
const { chromium } = createRequire(import.meta.url)(
  process.env.MY_KRAVV_PLAYWRIGHT_PATH,
);
const f = JSON.parse(
  await readFile(".env.phase-1-visual-fixture.json", "utf8"),
);
assert.ok(f.readingOrder && f.company && f.manyCompany);
const base = "http://localhost:3000";
const output = path.resolve(".qa/milestone-5.5-phase-4a-final-polish");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) =>
  errors.push({ message: e.message, url: "runtime" }),
);
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning")
    errors.push({ message: m.text(), url: m.location().url });
});
// This harness only navigates/reads and exercises local drafts. Never press AI controls.
const longId = f.displayStates.long.split("/").at(-2);
const selectedCompany = f.displayStates.archived.split("/")[2];
const draft = Array.from(
  { length: 9 },
  (_, i) =>
    `${i + 1}. aku belum membaca laporan arus kasnya. Aku ingin menyimpan pertanyaan ini dulu, bukan mengubahnya menjadi kesimpulan.`,
).join("\n\n");
const cases = [
  ["overview", `/companies/${f.company}`],
  ["thoughts", `/companies/${f.company}/thoughts`],
  ["empty-overview", `/companies/${f.emptyCompany}`],
  ["empty-thoughts", `/companies/${f.emptyCompany}/thoughts`],
  ["many-overview", `/companies/${f.manyCompany}`],
  ["many-thoughts", `/companies/${f.manyCompany}/thoughts`],
  ["archived-overview", `/companies/${selectedCompany}`],
  ["archived-thoughts", `/companies/${selectedCompany}/thoughts`],
  [
    "expanded-reading",
    `/companies/${f.company}/thoughts?focus=${longId}#thought-${longId}`,
  ],
  ["long-writing", `/companies/${f.company}/thoughts`],
];
const measurements = [];
try {
  await page.goto(`${base}/auth`);
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
    for (const [name, route] of stage === "preview"
      ? cases.slice(0, 2)
      : cases) {
      await page.goto(base + route);
      await page
        .getByRole("navigation", {
          name: "Bagian ruang perusahaan",
          exact: true,
        })
        .waitFor();
      await page.evaluate(() => document.fonts.ready);
      if (name === "long-writing") {
        await page.locator("#raw-content").fill(draft);
        await page.locator("#raw-content").blur();
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      const geometry = await page.evaluate(() => {
        const box = (e) => {
          if (!e) return null;
          const r = e.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        };
        const q = (s) => document.querySelector(s);
        const header = q(
          '[class*="company-workspace-module"][class*="__header"]',
        );
        const capture = q('section[aria-labelledby="thought-capture-title"]');
        const stream = q('section[aria-labelledby="thought-history-title"]');
        return {
          viewport: innerWidth,
          clientWidth: document.documentElement.clientWidth,
          scrollY,
          overflow:
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
          rootZoom: getComputedStyle(document.documentElement).zoom,
          bodyZoom: getComputedStyle(document.body).zoom,
          visualScale: visualViewport.scale,
          dpr: devicePixelRatio,
          fonts: document.fonts.status,
          header: box(header),
          identity: box(q('[class*="__identity"]')),
          navigation: box(q('nav[aria-label="Bagian ruang perusahaan"]')),
          breadcrumb: box(q('nav[aria-label="Jejak ruang perusahaan"]')),
          capture: box(capture),
          textarea: box(q("#raw-content")),
          textareaFont: q("#raw-content")
            ? getComputedStyle(q("#raw-content")).fontSize
            : null,
          save: box(q("#thought-form .primary-button")),
          discard: box(q("#thought-form .quiet-button")),
          context: box(q('aside[aria-label="Konteks perusahaan"]')),
          rows: [
            ...document.querySelectorAll(
              'section[aria-labelledby="earlier-title"] li a',
            ),
          ].map((e) => ({
            row: box(e),
            excerpt: box(e.querySelector('[class*="__recentExcerpt"]')),
            arrow: box(e.querySelector("svg")),
            metadata: box(e.querySelector('[class*="__recentMetadata"]')),
          })),
          entries: stream
            ? [...stream.querySelectorAll('li[id^="thought-"]')].map((e) => ({
                id: e.id,
                row: box(e),
                body: box(e.querySelector('[class*="__body"]')),
                number: e.querySelector('span[aria-hidden="true"]')
                  ?.textContent,
                hiddenNumber: e
                  .querySelector('span[aria-hidden="true"]')
                  ?.getAttribute("aria-hidden"),
                text: e.querySelector(".thought-original")?.textContent,
              }))
            : [],
        };
      });
      assert.equal(geometry.viewport, width);
      assert.equal(geometry.overflow, 0, `${name} overflow at ${width}`);
      for (const row of geometry.rows) {
        assert.ok(row.excerpt.width > row.row.width * 0.6);
        assert.ok(row.arrow.x >= row.excerpt.x + row.excerpt.width);
        assert.ok(
          row.arrow.y >= row.row.y &&
            row.arrow.y + row.arrow.height <= row.row.y + row.row.height,
        );
      }
      if (stage === "after" && geometry.capture) {
        assert.ok(
          Math.abs(geometry.capture.x - geometry.header.x) < 1,
          "Composer stays on shared Company grid",
        );
        assert.ok(
          geometry.textarea.width / geometry.capture.width > 0.8,
          "Writing surface is intentionally filled",
        );
        assert.ok(geometry.save.height >= 44 && geometry.discard.height >= 44);
        assert.ok(parseFloat(geometry.textareaFont) >= 16);
      }
      if (name === "many-overview" && stage === "after")
        assert.equal(geometry.context, null, "No count-only sidebar");
      for (let i = 0; i < geometry.entries.length; i++) {
        assert.equal(
          geometry.entries[i].number,
          String(i + 1).padStart(2, "0"),
        );
        assert.equal(geometry.entries[i].hiddenNumber, "true");
        assert.ok(geometry.entries[i].body.width >= 180);
      }
      measurements.push({ stage, name, ...geometry });
      await page.screenshot({
        path: path.join(output, `${stage}-${name}-${width}.png`),
        fullPage: stage !== "preview",
      });
      if (name === "long-writing") {
        await page.reload();
        await assert.doesNotReject(() =>
          page.locator("#raw-content").waitFor(),
        );
        // Hydration restores the local draft; wait for that value rather than a fixed delay.
        await page.waitForFunction(
          (text) => document.querySelector("#raw-content")?.value === text,
          draft,
        );
        await page
          .getByRole("button", { name: "Buang draf", exact: true })
          .click();
        assert.equal(await page.locator("#raw-content").inputValue(), "");
      }
    }
    console.log(
      `${stage}: ${width}px completed with individual layout checks.`,
    );
  }
  await writeFile(
    path.join(output, `${stage}-measurements.json`),
    JSON.stringify(measurements, null, 2),
  );
  if (stage === "after") {
    const shellMeasurements = [];
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + f.displayStates.selected);
      await page
        .getByRole("navigation", {
          name: "Bagian ruang perusahaan",
          exact: true,
        })
        .waitFor();
      await page.evaluate(() => document.fonts.ready);
      const shell = await page.evaluate(() => {
        const box = (e) => {
          const r = e.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        };
        return {
          viewport: innerWidth,
          identity: box(document.querySelector('[class*="__identity"]')),
          navigation: box(
            document.querySelector('nav[aria-label="Bagian ruang perusahaan"]'),
          ),
          overflow:
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        };
      });
      const overview = measurements.find(
        (m) => m.name === "overview" && m.viewport === width,
      );
      const thoughts = measurements.find(
        (m) => m.name === "thoughts" && m.viewport === width,
      );
      assert.equal(shell.overflow, 0);
      assert.deepEqual(shell.identity, overview.identity);
      assert.deepEqual(shell.identity, thoughts.identity);
      assert.deepEqual(shell.navigation, overview.navigation);
      assert.deepEqual(shell.navigation, thoughts.navigation);
      shellMeasurements.push(shell);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: path.join(output, `after-refine-shell-${width}.png`),
      });
    }
    await writeFile(
      path.join(output, "shared-shell-measurements.json"),
      JSON.stringify(shellMeasurements, null, 2),
    );
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(
      `${base}/companies/${f.company}/thoughts?focus=${longId}#thought-${longId}`,
    );
    const entry = page.locator(`#thought-${longId}`);
    await entry
      .locator('summary[aria-label="Baca pemikiran lengkap"]')
      .waitFor();
    assert.equal(
      await entry.locator("details").first().getAttribute("open"),
      "",
    );
    await entry.getByText("Lihat asli", { exact: true }).press("Enter");
    const raw = f.refineCheckpoint.originals.find(
      (t) => t.id === longId,
    ).raw_content;
    assert.equal(
      await entry
        .locator("details")
        .nth(1)
        .locator(".thought-original")
        .textContent(),
      raw,
    );
    await page.screenshot({
      path: path.join(output, "original-disclosure-390.png"),
    });
    await page.goto(`${base}/companies/${f.company}`);
    const crumb = page
      .getByRole("navigation", { name: "Jejak ruang perusahaan" })
      .getByRole("link", { name: "Perusahaan", exact: true });
    await crumb.focus();
    await crumb.press("Tab");
    const focus = await page.evaluate(() => ({
      visible: document.activeElement.matches(":focus-visible"),
      outline: getComputedStyle(document.activeElement).outline,
    }));
    assert.ok(focus.visible && !focus.outline.includes("none"));
    await page.screenshot({
      path: path.join(output, "breadcrumb-keyboard-focus-390.png"),
    });
    const row = page
      .locator('section[aria-labelledby="earlier-title"] li a')
      .first();
    await row.hover();
    const hover = await row.evaluate((e) => ({
      matches: e.matches(":hover"),
      background: getComputedStyle(e).backgroundColor,
    }));
    assert.ok(hover.matches);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const motion = await page
      .locator("a.secondary-button")
      .first()
      .evaluate((e) => ({
        preference: matchMedia("(prefers-reduced-motion: reduce)").matches,
        duration: getComputedStyle(e).transitionDuration,
      }));
    assert.ok(
      motion.preference &&
        motion.duration.split(",").every((v) => parseFloat(v) === 0),
    );
    await page.goto(`${base}/companies/${f.company}/thoughts`);
    await page.locator("#raw-content").waitFor();
    const contrast = await page.evaluate(() => {
      function channels(s) {
        return s
          .match(/[\d.]+/g)
          .slice(0, 3)
          .map(Number);
      }
      function luminance(s) {
        const c = channels(s).map((v) => {
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
      function result(e, pseudo) {
        const foreground = getComputedStyle(e, pseudo).color;
        const bg = background(e);
        const a = luminance(foreground),
          b = luminance(bg);
        return {
          foreground,
          background: bg,
          ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
          opacity: getComputedStyle(e).opacity,
          font: getComputedStyle(e).fontFamily,
        };
      }
      return {
        reading: result(document.querySelector("li .thought-original")),
        metadata: result(document.querySelector('[class*="__metadata"] time')),
        selectedSection: result(
          document.querySelector(
            'nav[aria-label="Bagian ruang perusahaan"] [aria-current="page"]',
          ),
        ),
        save: result(document.querySelector("#thought-form .primary-button")),
        input: result(document.querySelector("#raw-content")),
        placeholder: result(
          document.querySelector("#raw-content"),
          "::placeholder",
        ),
        breadcrumb: result(
          document.querySelector('nav[aria-label="Jejak ruang perusahaan"] a'),
        ),
      };
    });
    for (const item of Object.values(contrast)) {
      assert.ok(item.ratio >= 4.5);
      assert.equal(item.opacity, "1");
    }
    await writeFile(
      path.join(output, "contrast-checks.json"),
      JSON.stringify(contrast, null, 2),
    );
    await page.goto(`${base}/companies/${f.manyCompany}/thoughts`);
    await page
      .getByRole("link", { name: "Pemikiran lebih lama", exact: true })
      .click();
    await page.waitForURL(/before=/);
    await page.locator('li[id^="thought-"]').first().waitFor();
    assert.equal(await page.locator('li[id^="thought-"]').count(), 5);
    assert.equal(
      await page
        .locator('li[id^="thought-"] > span[aria-hidden="true"]')
        .first()
        .textContent(),
      "01",
    );
    await writeFile(
      path.join(output, "interaction-checks.json"),
      JSON.stringify(
        {
          focus,
          hover,
          motion,
          originalExact: true,
          draftRecovery: true,
          draftDiscard: true,
          olderPageCount: 5,
          olderPageFirstPosition: "01",
        },
        null,
        2,
      ),
    );
  }
  await writeFile(
    path.join(output, `${stage}-browser-log.json`),
    JSON.stringify(errors),
  );
  assert.deepEqual(errors, [], "No browser console or runtime errors");
  await page.getByText("Akun", { exact: true }).click();
  await page.getByRole("button", { name: "Keluar", exact: true }).click();
  await page.waitForURL(/\/auth/);
} finally {
  await browser.close();
}
