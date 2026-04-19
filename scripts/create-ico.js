import pngToIco from 'png-to-ico';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMG_DIR = path.join(__dirname, '..', 'src', 'assets', 'img');

const files = [16, 24, 32, 48, 256].map((size) =>
  path.join(IMG_DIR, `icon-${size}.png`),
);

pngToIco(files)
  .then((buf) => {
    const output = path.join(IMG_DIR, 'athenea.ico');
    fs.writeFileSync(output, buf);
    console.log('OK athenea.ico creado en', output);
  })
  .catch(console.error);
