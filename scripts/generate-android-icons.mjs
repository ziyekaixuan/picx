// Generates the Android launcher icons and splash screens from the PicX
// logo (public/logo@512x512.png). Run after `npx cap add android` or
// whenever the logo changes:
//
//   node scripts/generate-android-icons.mjs
//
// The generated PNGs are build artifacts (gitignored); this script is the
// source of truth for them.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const logoPath = path.join(root, 'public', 'logo@512x512.png')
const resDir = path.join(root, 'android', 'app', 'src', 'main', 'res')

const densities = [
  { name: 'mdpi', scale: 1 },
  { name: 'hdpi', scale: 1.5 },
  { name: 'xhdpi', scale: 2 },
  { name: 'xxhdpi', scale: 3 },
  { name: 'xxxhdpi', scale: 4 },
]

async function logoBuffer(size) {
  return sharp(logoPath).resize(size, size).png().toBuffer()
}

// Legacy launcher icon: logo on transparent background, ~85% of canvas.
async function launcherIcon(size, out) {
  const logoSize = Math.round(size * 0.85)
  const logo = await logoBuffer(logoSize)
  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite([{ input: logo, gravity: 'center' }]).png().toFile(out)
}

// Round launcher icon: logo centered on a white circle.
async function roundIcon(size, out) {
  const logoSize = Math.round(size * 0.7)
  const logo = await logoBuffer(logoSize)
  const circle = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#FFFFFF"/></svg>`,
  )
  await sharp(circle).composite([{ input: logo, gravity: 'center' }]).png().toFile(out)
}

// Adaptive-icon foreground: 108dp canvas, logo in the center 66dp safe zone.
async function foregroundIcon(size, out) {
  const logoSize = Math.round(size * (66 / 108))
  const logo = await logoBuffer(logoSize)
  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite([{ input: logo, gravity: 'center' }]).png().toFile(out)
}

// Splash screen: white background, logo centered (~40% of the short side).
async function splash(width, height, out) {
  const logoSize = Math.round(Math.min(width, height) * 0.4)
  const logo = await logoBuffer(logoSize)
  await sharp({
    create: { width, height, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  }).composite([{ input: logo, gravity: 'center' }]).png().toFile(out)
}

for (const { name, scale } of densities) {
  const mipmap = path.join(resDir, `mipmap-${name}`)
  await launcherIcon(48 * scale, path.join(mipmap, 'ic_launcher.png'))
  await roundIcon(48 * scale, path.join(mipmap, 'ic_launcher_round.png'))
  await foregroundIcon(108 * scale, path.join(mipmap, 'ic_launcher_foreground.png'))

  const port = path.join(resDir, `drawable-port-${name}`)
  const land = path.join(resDir, `drawable-land-${name}`)
  await splash(320 * scale, 480 * scale, path.join(port, 'splash.png'))
  await splash(480 * scale, 320 * scale, path.join(land, 'splash.png'))
}

// Default splash (same size as port-mdpi landscape)
await splash(480, 320, path.join(resDir, 'drawable', 'splash.png'))

console.log('Android icons and splash screens generated.')
