const pngToIco = require('png-to-ico').default;
const fs = require('fs');
const path = require('path');

pngToIco([
  path.join(__dirname, 'src/assets/img/logo256.png')
])
.then(buf => {
  fs.writeFileSync(path.join(__dirname, 'src/assets/img/logo.ico'), buf);
  console.log('logo.ico created successfully!');
})
.catch(console.error);
