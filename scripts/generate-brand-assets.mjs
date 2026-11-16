/**
 * Builds every native + PWA brand asset for the store apps.
 *
 * The Expo project shipped the stock React Native template icon, so the store
 * icons are generated here from the real brand artwork instead:
 *
 *   src/assets/nella-wave.png  the Nella mascot (1024x1024, transparent)
 *
 * Pipeline:
 *   1. Compose the source artwork (icon / adaptive layers / splash).
 *   2. Run @capacitor/assets to cut every iOS + Android + PWA size.
 *   3. Fix the Android adaptive icon, which the generator sizes at 48dp — an
 *      adaptive layer must be 108dp, otherwise the icon renders tiny.
 *   4. Drop the Capacitor template drawables and move the PWA icons into
 *      public/ so the web manifest can actually reach them.
 *
 * Run with: npm run assets:brand
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MASCOT = join(root, "src", "assets", "nella-wave.png");
const OUT = join(root, "assets");
const ANDROID_RES = join(root, "android", "app", "src", "main", "res");
const IOS_ASSETS = join(root, "ios", "App", "App", "Assets.xcassets");

/* ---------------------------------------------------------------- colours -- */

/** OKLCH -> linear sRGB -> sRGB. Returns 0-255 channels. */
function oklchToRgb(L, C, H) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];

  return linear.map((channel) => {
    const v = channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, v)) * 255);
  });
}

function oklchToHex(L, C, H) {
  const [r, g, b] = oklchToRgb(L, C, H);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

// The app's own tokens (src/styles.css) — the icons must match the product.
const TOKEN = {
  // The app's --gradient-splash: radial-gradient(130% 90% at 50% 26%, ...)
  splashTop: oklchToHex(0.3, 0.09, 264),
  splashMid: oklchToHex(0.19, 0.07, 266),
  splashEnd: oklchToHex(0.11, 0.05, 268),
  splashDark: oklchToHex(0.16, 0.025, 264),
};

/* --------------------------------------------------------------- gradient -- */

/**
 * Renders a radial gradient as raw RGB pixels.
 * `stops` are [{ at, hex }] from the centre (0) outwards (1).
 */
function renderRadialGradient(size, stops, centre = [0.5, 0.26], spread = [1.3, 0.9]) {
  const parsed = stops.map(({ at, hex }) => ({
    at,
    rgb: hex.match(/[0-9a-f]{2}/gi).map((h) => parseInt(h, 16)),
  }));

  const cx = centre[0] * size;
  const cy = centre[1] * size;
  const radius = Math.hypot(
    Math.max(cx, (size - cx) / spread[0]),
    Math.max(cy, (size - cy) / spread[1]),
  );

  const data = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = Math.min(1, Math.hypot(x - cx, y - cy) / radius);

      let lower = parsed[0];
      let upper = parsed[parsed.length - 1];
      for (let i = 0; i < parsed.length - 1; i++) {
        if (t >= parsed[i].at && t <= parsed[i + 1].at) {
          lower = parsed[i];
          upper = parsed[i + 1];
          break;
        }
      }
      const span = upper.at - lower.at || 1;
      const k = (t - lower.at) / span;

      const i = (y * size + x) * 3;
      for (let c = 0; c < 3; c++) {
        data[i + c] = Math.round(lower.rgb[c] + (upper.rgb[c] - lower.rgb[c]) * k);
      }
    }
  }
  return data;
}

/**
 * The icon backdrop is the app's dark splash gradient, not the light orb: the
 * mascot is white and blue, so it only reads cleanly against the dark navy.
 */
function renderIconGradient(size) {
  return renderRadialGradient(
    size,
    [
      { at: 0, hex: TOKEN.splashTop },
      { at: 0.52, hex: TOKEN.splashMid },
      { at: 1, hex: TOKEN.splashEnd },
    ],
    [0.5, 0.26],
    [1.3, 0.9],
  );
}

/* ------------------------------------------------------------------ build -- */

async function mascotLayer(size, scale) {
  const inner = Math.round(size * scale);
  return sharp(MASCOT)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

/**
 * The mascot artwork is cropped at the hip, so it is presented as a circular
 * avatar — the same framing the app's own splash screen uses. The circle makes
 * the crop deliberate and keeps the face legible at home-screen sizes.
 */
async function circularMascot(size, scale) {
  const diameter = Math.round(size * scale);
  const mascot = await mascotLayer(size, scale);
  const offset = Math.round((size - diameter) / 2);

  const masked = await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: mascot, top: offset, left: offset }])
    .png()
    .toBuffer();

  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${diameter / 2}" fill="#fff"/></svg>`,
  );

  return sharp(masked)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function writeIconOnly() {
  const size = 1024;
  const orb = await sharp(renderIconGradient(size), {
    raw: { width: size, height: size, channels: 3 },
  })
    .png()
    .toBuffer();
  const mascot = await circularMascot(size, 0.76);

  // Flatten onto the gradient: the App Store rejects icons with an alpha channel.
  await sharp(orb)
    .composite([{ input: mascot, top: 0, left: 0 }])
    .flatten({ background: TOKEN.splashEnd })
    .removeAlpha()
    .toColorspace("srgb")
    .png({ compressionLevel: 9 })
    .toFile(join(OUT, "icon-only.png"));
}

async function writeIconForeground() {
  const size = 1024;
  // Android masks adaptive icons and crops aggressively — keep the mascot
  // inside the 66dp safe zone of the 108dp adaptive canvas.
  const mascot = await circularMascot(size, 0.58);
  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: mascot, top: 0, left: 0 }])
    .png()
    .toFile(join(OUT, "icon-foreground.png"));
}

async function writeIconBackground() {
  const size = 1024;
  await sharp(renderIconGradient(size), { raw: { width: size, height: size, channels: 3 } })
    .png()
    .toFile(join(OUT, "icon-background.png"));
}

async function writeIconMonochrome() {
  // Android 13+ themed icons want a flat silhouette.
  const size = 1024;
  const mascot = await circularMascot(size, 0.58);
  const { data, info } = await sharp(mascot)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const white = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < data.length; i += 4) {
    white[i] = 255;
    white[i + 1] = 255;
    white[i + 2] = 255;
    white[i + 3] = data[i + 3];
  }

  await sharp(white, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(join(OUT, "icon-monochrome.png"));
}

async function writeSplash(file, backgroundHex) {
  const size = 2732;
  const mascot = await mascotLayer(size, 0.22);
  const offset = Math.round((size - Math.round(size * 0.22)) / 2);

  await sharp({
    create: { width: size, height: size, channels: 4, background: backgroundHex },
  })
    .composite([{ input: mascot, top: offset, left: offset }])
    .flatten({ background: backgroundHex })
    .removeAlpha()
    .toColorspace("srgb")
    .png()
    .toFile(join(OUT, file));
}

/* ------------------------------------------- @capacitor/assets + fix-ups -- */

function runCapacitorAssets() {
  const result = spawnSync(
    process.execPath,
    [
      join(root, "node_modules", "@capacitor", "assets", "bin", "capacitor-assets"),
      "generate",
      "--assetPath",
      "assets",
    ],
    { cwd: root, stdio: "inherit" },
  );
  if (result.status !== 0) {
    throw new Error(`@capacitor/assets failed with status ${result.status}`);
  }
}

/**
 * An Android adaptive icon layer must be 108dp. @capacitor/assets writes the
 * foreground/background mipmaps at the legacy 48dp icon size, which renders the
 * icon tiny on the launcher — so they are re-cut here at 108dp.
 */
async function fixAndroidAdaptiveIcon() {
  const densities = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };

  for (const [density, dp] of Object.entries(densities)) {
    const dir = join(ANDROID_RES, `mipmap-${density}`);

    await sharp(join(OUT, "icon-foreground.png"))
      .resize(dp, dp)
      .png()
      .toFile(join(dir, "ic_launcher_foreground.png"));

    await sharp(join(OUT, "icon-background.png"))
      .resize(dp, dp)
      .png()
      .toFile(join(dir, "ic_launcher_background.png"));

    await sharp(join(OUT, "icon-monochrome.png"))
      .resize(dp, dp)
      .png()
      .toFile(join(dir, "ic_launcher_monochrome.png"));
  }

  const adaptiveIcon = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome" />
</adaptive-icon>
`;
  for (const name of ["ic_launcher.xml", "ic_launcher_round.xml"]) {
    writeFileSync(join(ANDROID_RES, "mipmap-anydpi-v26", name), adaptiveIcon);
  }
}

/** The Capacitor template ships a teal grid vector and logo that must not ship. */
function removeTemplateDrawables() {
  for (const path of [
    join(ANDROID_RES, "drawable", "ic_launcher_background.xml"),
    join(ANDROID_RES, "drawable-v24", "ic_launcher_foreground.xml"),
  ]) {
    if (existsSync(path)) rmSync(path);
  }
  writeFileSync(
    join(ANDROID_RES, "values", "ic_launcher_background.xml"),
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${TOKEN.splashEnd}</color>
</resources>
`,
  );
}

/** iOS keeps the old splash PNGs around after a regeneration; drop the orphans. */
function removeStaleIosSplash() {
  const dir = join(IOS_ASSETS, "Splash.imageset");
  if (!existsSync(dir)) return;
  const keep = new Set([
    "Contents.json",
    "Default@1x~universal~anyany.png",
    "Default@2x~universal~anyany.png",
    "Default@3x~universal~anyany.png",
    "Default@1x~universal~anyany-dark.png",
    "Default@2x~universal~anyany-dark.png",
    "Default@3x~universal~anyany-dark.png",
  ]);
  for (const file of readdirSync(dir)) {
    if (!keep.has(file)) rmSync(join(dir, file));
  }
}

/** The PWA icons belong in public/ so the web manifest can reach them. */
async function movePwaIcons() {
  const source = join(root, "icons");
  if (!existsSync(source)) return;
  const target = join(root, "public", "icons");
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  for (const file of readdirSync(source)) {
    const from = join(source, file);
    const to = join(target, file);
    await sharp(from).toFile(to);
    rmSync(from);
  }
}

/* ------------------------------------------------------------------- run -- */

mkdirSync(OUT, { recursive: true });

await writeIconOnly();
await writeIconForeground();
await writeIconBackground();
await writeIconMonochrome();
await writeSplash("splash.png", TOKEN.splashDark);
await writeSplash("splash-dark.png", TOKEN.splashDark);

runCapacitorAssets();

await fixAndroidAdaptiveIcon();
removeTemplateDrawables();
removeStaleIosSplash();
await movePwaIcons();

writeFileSync(
  join(OUT, "BRAND.md"),
  [
    "# Brand assets",
    "",
    "Generated by `npm run assets:brand` from `src/assets/nella-wave.png` and the",
    "colour tokens in `src/styles.css`. Do not hand-edit the PNGs — regenerate them.",
    "",
    `- Icon background: the app's \`--gradient-splash\` (${TOKEN.splashTop} → ${TOKEN.splashEnd})`,
    `- Splash background: \`${TOKEN.splashDark}\``,
    "- The Android adaptive layers are re-cut at 108dp after @capacitor/assets runs.",
    "",
  ].join("\n"),
);

console.log("[assets:brand] Generated the iOS, Android and PWA brand assets.");
