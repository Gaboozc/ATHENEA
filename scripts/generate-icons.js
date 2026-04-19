import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT = path.join(__dirname, '..', 'src', 'assets', 'img', 'Athena-logo.png');
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'assets', 'img');

async function generateIcons() {
  const sizes = [16, 24, 32, 48, 64, 128, 256];

  console.log('Generando iconos para ATHENEA...');

  for (const size of sizes) {
    const output = path.join(OUTPUT_DIR, `icon-${size}.png`);
    await sharp(INPUT)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(output);
    console.log(`OK icon-${size}.png generado`);
  }

  await sharp(INPUT)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(path.join(OUTPUT_DIR, 'icon-512.png'));
  console.log('OK icon-512.png generado');

  console.log('');
  console.log('Iconos generados correctamente.');
  console.log('Ahora instala png-to-ico para crear el .ico:');
  console.log('  npm install --save-dev png-to-ico');
  console.log('  node scripts/create-ico.js');
}

generateIcons().catch(console.error);
