/**
 * Builds the store listing artwork from the real app.
 *
 * The screenshots are taken in a real Chromium browser at each store's exact
 * device resolution, driving the same UI a customer sees — no mock-ups, no
 * composited frames. That keeps the listing honest: every pixel is the app.
 *
 *   npm run build:app        # produce dist/
 *   npm run screenshots      # capture every size + build the Play graphics
 *
 * Chrome for Testing is reused from the Playwright cache when present; set
 * CHROME_PATH to override. In CI, run `npx playwright install chromium` first.
 */
import { createServer } from "node:http";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { extname, join, resolve, normalize } from "node:path";
import { homedir } from "node:os";
import { chromium } from "playwright-core";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const DIST = join(root, "dist");
const FASTLANE = join(root, "fastlane");
const APPLE_SHOTS = join(FASTLANE, "screenshots", "en-US");
const PLAY = join(FASTLANE, "metadata", "android", "en-US");
const PLAY_SHOTS = join(PLAY, "images", "phoneScreenshots");

/* --------------------------------------------------------------- devices -- */

/**
 * Fastlane maps an Apple screenshot to a display type by pixel size, and
 * 1320x2868 and 1290x2796 are the same 6.9"/6.7" slot — capture only one or
 * the upload collides. 6.5" is the legacy size App Store Connect still takes.
 *
 * `file` turns a scene name into the name it ships under: deliver sorts the
 * screenshots by filename, so the numeric prefix is the display order.
 */
const DEVICES = {
  "ios-6.9": {
    width: 440,
    height: 956,
    dpr: 3, // 1320 x 2868
    file: (scene) => join(APPLE_SHOTS, `${scene}.png`),
  },
  "ios-6.5": {
    width: 414,
    height: 896,
    dpr: 3, // 1242 x 2688
    file: (scene) => join(APPLE_SHOTS, `${scene}-65.png`),
  },
  "android-phone": {
    width: 360,
    height: 640,
    dpr: 3, // 1080 x 1920
    file: (scene) => join(PLAY_SHOTS, `${scene}.png`),
  },
};

/* ---------------------------------------------------------------- server -- */

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

/** Maps a URL path onto dist/, including the prerendered /auth and /chat pages. */
function resolveFile(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  const candidates = [
    join(DIST, clean),
    join(DIST, clean, "index.html"),
    join(DIST, `${clean}.html`),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function serve() {
  const server = createServer((req, res) => {
    const file = resolveFile(req.url ?? "/");
    if (!file) {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
      return;
    }
    res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(res);
  });
  return new Promise((done) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      done({ server, origin: `http://127.0.0.1:${port}` });
    });
  });
}

/* ---------------------------------------------------------------- chrome -- */

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const cache = join(homedir(), "Library", "Caches", "ms-playwright");
  if (existsSync(cache)) {
    for (const dir of readdirSync(cache).filter((d) => d.startsWith("chromium-"))) {
      const mac = join(
        cache,
        dir,
        "chrome-mac-arm64",
        "Google Chrome for Testing.app",
        "Contents",
        "MacOS",
        "Google Chrome for Testing",
      );
      if (existsSync(mac)) return mac;
      const linux = join(cache, dir, "chrome-linux", "chrome");
      if (existsSync(linux)) return linux;
    }
  }
  return undefined; // let Playwright find a managed browser
}

/* ---------------------------------------------------------------- scenes -- */

/**
 * A signed-in account, exactly as the app stores it after login. The session is
 * a real shape but its tokens never leave this browser: every API call below is
 * answered by the fixtures in `stubApi`, so the screenshots are the real UI with
 * believable data and no request ever reaches production.
 */
const ACCOUNT = {
  phone: "2348012345678",
  fullName: "Ada Obi",
  tier: 2,
  status: "ACTIVE",
  accountNumber: "1001701935",
  bankName: "VFD Microfinance Bank",
  onboardingComplete: true,
  kycStep: 2,
};

const SEED = `
  localStorage.setItem("nella.auth.v1", JSON.stringify({
    accessToken: "screenshot-token",
    refreshToken: "screenshot-refresh-token-000000000000",
    expiresAt: Date.now() + 1800000,
    user: ${JSON.stringify(ACCOUNT)}
  }));
  localStorage.setItem("nella.device.v1", "screenshot-device-0001");
  // The swipe-to-reply tip is a first-run coach mark; a store shot should not
  // carry it, so mark it as already dismissed.
  localStorage.setItem("nella.tip.swipe", "1");
`;

const API = "https://usenella.com/api/mobile/v1";

/** Answers the app's API calls so a shot never depends on the live service. */
async function stubApi(context) {
  const fixtures = [
    [
      /\/balance$/,
      {
        ok: true,
        balanceMinor: 1990000,
        currency: "NGN",
        accountNumber: ACCOUNT.accountNumber,
        bankName: ACCOUNT.bankName,
        asOf: "2026-11-19T09:00:00.000Z",
      },
    ],
    [
      /\/history\?/,
      {
        ok: true,
        transactions: [
          {
            id: "1",
            reference: "NLMWMTSG8AEB17",
            type: "debit",
            amountMinor: 2500000,
            currency: "NGN",
            description: "Transfer to Chidi Okonkwo",
            createdAt: "2026-11-18T10:12:00.000Z",
          },
          {
            id: "2",
            reference: "NLMWMTSG8AEB11",
            type: "credit",
            amountMinor: 15000000,
            currency: "NGN",
            description: "Transfer from Ada Obi",
            createdAt: "2026-11-17T15:40:00.000Z",
          },
        ],
        total: 2,
        page: 1,
        pageSize: 30,
        totalPages: 1,
      },
    ],
    [
      /\/receipt\?/,
      {
        ok: true,
        receipt: {
          title: "Transfer to Chidi Okonkwo",
          amount: 25000,
          amountMinor: 2500000,
          rows: [
            ["Status", "Successful"],
            ["Recipient account", "0123456789"],
            ["Bank", "GTBank"],
            ["Narration", "Rent"],
            ["Fee", "₦0.00"],
            ["Reference", "NLMWMTSG8AEB17"],
            ["Date", "18 Nov 2026, 11:12"],
          ],
        },
      },
    ],
    [/\/me$/, { ok: true, user: ACCOUNT }],
  ];
  await context.route(`${API}/**`, async (route) => {
    const url = route.request().url();
    const hit = fixtures.find(([pattern]) => pattern.test(url));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(hit ? hit[1] : { ok: false, message: "Not part of this screenshot." }),
    });
  });
}

const SCENES = [
  {
    name: "01-welcome",
    path: "/auth",
    signedOut: true,
    async play(page) {
      await page.getByRole("heading", { name: /welcome back/i }).waitFor();
    },
  },
  {
    name: "02-chat",
    path: "/chat",
    async play(page) {
      await page.getByLabel("Message Nella").waitFor();
      await page
        .getByText(/Good (morning|afternoon|evening)/)
        .first()
        .waitFor();
      await page
        .getByText(/I'm Nella/)
        .first()
        .waitFor();
    },
  },
  {
    name: "03-transfer",
    path: "/chat",
    async play(page) {
      await page.getByLabel("Message Nella").waitFor();
      await send(page, "Send ₦25,000 to 0123456789 GTBank");
      await page.getByText(/this transfer for/i).waitFor();
    },
  },
  {
    name: "04-review",
    path: "/chat",
    async play(page) {
      await page.getByLabel("Message Nella").waitFor();
      await send(page, "Send ₦25,000 to 0123456789 GTBank");
      await page.getByText(/this transfer for/i).waitFor();
      await page.getByRole("button", { name: "Rent", exact: true }).click();
      await page
        .getByText(/Not sent/i)
        .first()
        .waitFor();
    },
  },
  {
    name: "05-receipt",
    path: "/chat",
    async play(page) {
      await page.getByLabel("Message Nella").waitFor();
      await send(page, "receipt NLMWMTSG8AEB17");
      await page.getByText(/Here's your receipt/i).waitFor();
      await page
        .getByText(/NLMWMTSG8AEB17/)
        .first()
        .waitFor();
    },
  },
  {
    name: "06-balance",
    path: "/chat",
    async play(page) {
      await page.getByLabel("Message Nella").waitFor();
      await send(page, "Check my balance");
      await page.getByText(/₦19,900\.00/).waitFor();
      await send(page, "activity");
      await page.getByText(/Your last \d+ transactions?/i).waitFor();
    },
  },
];

/** Types a message and taps send — the same path a thumb takes on a phone. */
async function send(page, text) {
  const input = page.getByLabel("Message Nella");
  await input.fill(text);
  await page.getByLabel("Send message").click();
  await input.waitFor();
}

/* --------------------------------------------------------------- graphics -- */

/**
 * Google Play requires a 1024x500 feature graphic and a 512x512 icon. Both are
 * built from the same artwork and colour tokens as the app icon so the listing
 * does not drift from the product.
 */
async function writePlayGraphics(browser) {
  const mascot = readFileSync(join(root, "src", "assets", "nella-wave.png")).toString("base64");
  const wordmark = readFileSync(join(root, "src", "assets", "nella-nav-logo.png")).toString(
    "base64",
  );

  const page = await browser.newPage({
    viewport: { width: 1024, height: 500 },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1024px; height: 500px; overflow: hidden;
    background: radial-gradient(130% 90% at 50% 26%, #162b5a 0%, #061033 52%, #010316 100%);
    font-family: 'Plus Jakarta Sans', -apple-system, 'Helvetica Neue', sans-serif;
    display: flex; align-items: center; gap: 56px; padding: 0 72px;
    color: #f8fafc;
  }
  .mascot { width: 300px; height: 300px; object-fit: contain; flex: none; }
  .copy { display: flex; flex-direction: column; gap: 22px; }
  .wordmark { height: 58px; width: auto; align-self: flex-start; filter: brightness(0) invert(1); }
  h1 { font-size: 54px; font-weight: 800; letter-spacing: -1.5px; line-height: 1.08; }
  p { font-size: 24px; font-weight: 600; color: #9db4dd; letter-spacing: -0.2px; }
  .pill {
    align-self: flex-start; padding: 10px 20px; border-radius: 999px;
    background: rgba(33, 104, 242, 0.16); border: 1px solid rgba(33, 104, 242, 0.4);
    color: #7fb0ff; font-size: 17px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase;
  }
</style></head>
<body>
  <img class="mascot" src="data:image/png;base64,${mascot}" alt="">
  <div class="copy">
    <img class="wordmark" src="data:image/png;base64,${wordmark}" alt="Nella">
    <h1>Your money,<br>in a chat.</h1>
    <p>Send, top up and pay bills by messaging Nella.</p>
    <span class="pill">Preview build</span>
  </div>
</body></html>`,
    { waitUntil: "networkidle" },
  );
  await page.evaluate(() => document.fonts.ready);
  mkdirSync(join(PLAY, "images"), { recursive: true });
  await page.screenshot({ path: join(PLAY, "images", "featureGraphic.png") });
  await page.close();

  // Play wants the app icon at 512x512 without transparency.
  await sharp(join(root, "assets", "icon-only.png"))
    .resize(512, 512, { fit: "cover" })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toFile(join(PLAY, "images", "icon.png"));

  console.log("[screenshots] Play feature graphic 1024x500 and icon 512x512");
}

/* ------------------------------------------------------------------- run -- */

if (!existsSync(DIST)) {
  console.error("dist/ is missing — run `npm run build:app` first.");
  process.exit(1);
}

const { server, origin } = await serve();
const browser = await chromium.launch({ executablePath: chromePath() });

try {
  for (const [deviceName, device] of Object.entries(DEVICES)) {
    for (const scene of SCENES) {
      // A context per shot: no storage or scroll state carries over.
      const context = await browser.newContext({
        viewport: { width: device.width, height: device.height },
        deviceScaleFactor: device.dpr,
        isMobile: true,
        hasTouch: true,
        locale: "en-NG",
        timezoneId: "Africa/Lagos",
        colorScheme: "dark",
      });
      if (!scene.signedOut) await context.addInitScript(SEED);

      await stubApi(context);
      const page = await context.newPage();
      await page.goto(`${origin}${scene.path}`, { waitUntil: "networkidle" });
      await scene.play(page);
      // Messages animate in. Waiting for the finite animations (never an infinite
      // one, like the typing dots) keeps a half-faded bubble out of the listing.
      await page.evaluate(async () => {
        await document.fonts.ready;
        const finite = document.getAnimations().filter((a) => {
          const timing = a.effect?.getComputedTiming?.();
          return timing && timing.iterations !== Infinity && a.playState !== "finished";
        });
        await Promise.all(finite.map((a) => a.finished.catch(() => {})));
      });
      // Drop the caret/focus ring the scripted typing left on the composer.
      await page.evaluate(() =>
        document.activeElement instanceof HTMLElement ? document.activeElement.blur() : undefined,
      );
      await page.waitForTimeout(150);

      const file = device.file(scene.name);
      mkdirSync(join(file, ".."), { recursive: true });
      await page.screenshot({ path: file });

      console.log(
        `[screenshots] ${deviceName.padEnd(14)} ${scene.name.padEnd(12)} ${device.width * device.dpr}x${device.height * device.dpr}`,
      );
      await context.close();
    }
  }

  await writePlayGraphics(browser);
} finally {
  await browser.close();
  server.close();
}

console.log("[screenshots] Listing artwork is in fastlane/");
