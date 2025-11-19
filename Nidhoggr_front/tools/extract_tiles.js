#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function detectExt(buffer) {
  if (buffer.length >= 4) {
    const head = buffer.slice(0, 4);
    // PNG
    if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4E && head[3] === 0x47) return 'png';
    // JPEG
    if (head[0] === 0xFF && head[1] === 0xD8) return 'jpg';
    // WEBP (RIFF....WEBP)
    if (head.toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP') return 'webp';
  }
  return 'png';
}

function tmsToY(z, tmsY) {
  const max = Math.pow(2, z);
  return (max - 1) - tmsY;
}

function main() {
  const mbtilesPath = path.join(__dirname, '..', 'src', 'assets', 'tiles', 'tiles.mbtiles');
  if (!fs.existsSync(mbtilesPath)) {
    console.error('MBTiles file not found at', mbtilesPath);
    process.exit(1);
  }
  const outRoot = path.join(__dirname, '..', 'src', 'assets', 'tiles', 'export');
  ensureDirSync(outRoot);

  console.log('Opening MBTiles:', mbtilesPath);
  const db = new Database(mbtilesPath, { readonly: true });

  // Try to detect format from metadata
  let format = null;
  try {
    const meta = db.prepare("SELECT value FROM metadata WHERE name = 'format'").get();
    if (meta && meta.value) format = meta.value;
  } catch (e) {
    // ignore
  }
  console.log('Detected metadata format:', format || '(unknown)');

  const stmt = db.prepare('SELECT zoom_level AS z, tile_column AS x, tile_row AS tms_y, tile_data AS data FROM tiles');
  const rows = stmt.iterate();
  let count = 0;
  for (const row of rows) {
    const z = row.z;
    const x = row.x;
    const tmsY = row.tms_y;
    const data = row.data;
    const y = tmsToY(z, tmsY);
    const buf = Buffer.from(data);
    const ext = detectExt(buf);
    const dir = path.join(outRoot, String(z), String(x));
    ensureDirSync(dir);
    const outFile = path.join(dir, `${y}.${ext}`);
    try {
      fs.writeFileSync(outFile, buf);
      count += 1;
      if (count % 1000 === 0) process.stdout.write(`Extracted ${count} tiles...\r`);
    } catch (e) {
      console.error('Failed writing file', outFile, e);
    }
  }
  console.log(`\nExtraction complete. ${count} tiles written to ${outRoot}`);
  db.close();
}

main();
