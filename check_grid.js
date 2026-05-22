const fs = require('fs');
const path = require('path');

// A simple PNG parser to read pixel transparency
function analyzePng(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.readUInt32BE(0) !== 0x89504E47) {
    console.log(`${filePath} is not a valid PNG`);
    return;
  }

  // Find IHDR chunk
  let pos = 8;
  let width = 0, height = 0;
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IHDR') {
      width = buf.readUInt32BE(pos + 8);
      height = buf.readUInt32BE(pos + 12);
      break;
    }
    pos += 12 + len;
  }

  console.log(`Analyzing ${path.basename(filePath)}: ${width}x${height}`);

  // Let's divide it into a grid and check non-transparent pixel count in each cell
  // For 12 columns and 6 rows:
  const cols = 12;
  const rows = 8; // let's check both 6 and 8
  
  console.log(`Grid analysis for 12 columns x 6 rows:`);
  const cellW6 = width / 12;
  const cellH6 = height / 6;
  console.log(`Cell size (12x6): ${cellW6} x ${cellH6}`);

  console.log(`Grid analysis for 12 columns x 8 rows:`);
  const cellW8 = width / 12;
  const cellH8 = height / 8;
  console.log(`Cell size (12x8): ${cellW8} x ${cellH8}`);
}

analyzePng('sprite/plato_sprite_sheet_clean.png');
analyzePng('sprite/aristotle_clean.png');
