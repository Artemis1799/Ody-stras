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
    // PNG signature
    if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4E && head[3] === 0x47) return 'png';
    // JPEG signature
    if (head[0] === 0xFF && head[1] === 0xD8) return 'jpg';
    // WEBP (needs more bytes)
    if (buffer.length >= 12) {
      const riff = buffer.slice(0, 4).toString();
      const webp = buffer.slice(8, 12).toString();
      if (riff === 'RIFF' && webp === 'WEBP') return 'webp';
    }
  }
  return 'png';
}

function tmsToXYZ(z, x, tmsY) {
  // MBTiles uses TMS (Tile Map Service) coordinate system
  // where Y=0 is at the bottom
  // We need to convert to XYZ (Slippy Map) where Y=0 is at the top
  const maxY = Math.pow(2, z) - 1;
  return {
    z: z,
    x: x,
    y: maxY - tmsY
  };
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

  // Get metadata
  try {
    const metaRows = db.prepare("SELECT name, value FROM metadata").all();
    console.log('\nMetadata:');
    metaRows.forEach(row => {
      console.log(`  ${row.name}: ${row.value}`);
    });
  } catch (e) {
    console.log('Could not read metadata');
  }

  // Get tile statistics
  try {
    const stats = db.prepare(`
      SELECT 
        MIN(zoom_level) as min_zoom,
        MAX(zoom_level) as max_zoom,
        COUNT(*) as total_tiles
      FROM tiles
    `).get();
    console.log('\nTile Statistics:');
    console.log(`  Zoom levels: ${stats.min_zoom} - ${stats.max_zoom}`);
    console.log(`  Total tiles: ${stats.total_tiles}`);
  } catch (e) {
    console.log('Could not read tile statistics');
  }

  // Extract tiles
  const stmt = db.prepare('SELECT zoom_level AS z, tile_column AS x, tile_row AS tms_y, tile_data AS data FROM tiles');
  const rows = stmt.all();
  
  console.log('\nExtracting tiles...');
  let count = 0;
  let errorCount = 0;
  const formatCounts = { png: 0, jpg: 0, webp: 0 };

  for (const row of rows) {
    const { z, x, y } = tmsToXYZ(row.z, row.x, row.tms_y);
    
    // Ensure data is a Buffer
    let buf;
    if (Buffer.isBuffer(row.data)) {
      buf = row.data;
    } else {
      buf = Buffer.from(row.data);
    }

    // Verify buffer is valid
    if (buf.length === 0) {
      console.error(`Empty tile data at z=${z}, x=${x}, y=${y}`);
      errorCount++;
      continue;
    }

    const ext = detectExt(buf);
    formatCounts[ext] = (formatCounts[ext] || 0) + 1;

    const dir = path.join(outRoot, String(z), String(x));
    ensureDirSync(dir);
    const outFile = path.join(dir, `${y}.${ext}`);
    
    try {
      fs.writeFileSync(outFile, buf);
      count++;
      if (count % 100 === 0) {
        process.stdout.write(`\rExtracted ${count}/${rows.length} tiles...`);
      }
    } catch (e) {
      console.error(`\nFailed writing ${outFile}:`, e.message);
      errorCount++;
    }
  }

  console.log(`\n\nExtraction complete!`);
  console.log(`  Successfully written: ${count} tiles`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`  Output directory: ${outRoot}`);
  console.log(`\nFormat breakdown:`);
  Object.entries(formatCounts).forEach(([format, cnt]) => {
    console.log(`  ${format}: ${cnt} tiles`);
  });

  // Show sample tile locations for testing
  if (count > 0) {
    console.log('\nSample tile locations (for testing):');
    const samples = rows.slice(0, 3);
    samples.forEach(row => {
      const { z, x, y } = tmsToXYZ(row.z, row.x, row.tms_y);
      console.log(`  /${z}/${x}/${y}.${detectExt(Buffer.from(row.data))}`);
    });
  }

  db.close();
}

main();