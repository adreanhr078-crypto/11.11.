const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const base = process.cwd();
const excludeDirs = new Set(['node_modules', '.git', 'target', 'dist', '.vite', '.cache', 'coverage']);

const fileData = [];
const sizeByExt = {};
const allHashes = {};
const cats = {};

function walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch(e) { return; }
  for (const entry of entries) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!excludeDirs.has(entry.name) && !entry.name.startsWith('.')) {
        walk(fp);
      }
    } else {
      try {
        const stat = fs.statSync(fp);
        const rel = path.relative(base, fp);
        const ext = path.extname(entry.name).toLowerCase() || '(no ext)';
        
        if (!sizeByExt[ext]) sizeByExt[ext] = { count: 0, size: 0 };
        sizeByExt[ext].count++;
        sizeByExt[ext].size += stat.size;
        
        // Hash for duplicates
        let hash = 'large_skipped';
        if (stat.size < 1048576) {
          const content = fs.readFileSync(fp);
          hash = crypto.createHash('md5').update(content).digest('hex');
        }
        if (!allHashes[hash]) allHashes[hash] = [];
        allHashes[hash].push(rel);
        
        // Category
        let category = 'unknown';
        const relLower = rel.toLowerCase().replace(/\\/g, '/');
        if (['.ts','.tsx','.js','.jsx'].includes(ext)) {
          if (relLower.includes('/components/')) category = 'component';
          else if (relLower.includes('/core/')) category = 'core';
          else if (relLower.includes('/stores/')) category = 'store';
          else if (relLower.includes('/hooks/')) category = 'hook';
          else if (relLower.includes('/services/')) category = 'service';
          else if (relLower.includes('/styles/')) category = 'style';
          else category = 'source';
        } else if (['.css','.scss','.less'].includes(ext)) category = 'style';
        else if (ext === '.json') category = (relLower.includes('tsconfig') || entry.name.startsWith('package')) ? 'config' : 'data';
        else if (ext === '.md') category = 'documentation';
        else if (['.html','.htm'].includes(ext)) category = 'html';
        else if (ext === '.gradle') category = 'android_build';
        else if (ext === '.xml') category = 'android_config';
        else if (ext === '.kt') category = 'kotlin';
        else if (ext === '.java') category = 'java';
        else if (ext === '.png') category = 'image';
        else if (ext === '.ico') category = 'icon';
        else if (['.sh','.bat','.cmd','.ps1'].includes(ext)) category = 'script';
        else if (ext === '.yaml') category = 'yaml';
        else if (ext === '.toml') category = 'toml';
        else if (ext === '.properties') category = 'properties';
        else if (ext === '.svg') category = 'vector';
        else if (ext === '.mp4') category = 'video';
        else if (ext === '.cpuprofile') category = 'debug_profile';
        else if (ext === '.zip') category = 'archive';
        else if (ext === '.lock') category = 'lockfile';
        else if (ext === '.woff2') category = 'font';
        else if (ext === '.example') category = 'example';
        
        if (!cats[category]) cats[category] = { count: 0, size: 0 };
        cats[category].count++;
        cats[category].size += stat.size;
        
        let suggested = 'keep';
        let risk = 'safe';
        let reason = '';
        
        // Flag reports, temp, verify, etc.
        const rl = relLower;
        if (rl.includes('report') || rl.includes('verify') || rl.startsWith('test_') || rl.startsWith('final_')) {
          reason += 'REPORT/TEST ';
          suggested = 'review';
          risk = 'medium';
        }
        if (rl.includes('debug') || rl.includes('tmp') || rl.includes('temp') || rl.includes('backup') || rl.includes('cpuprofile') || rl.includes('pnpm-lock')) {
          reason += 'TEMP/DEBUG ';
          suggested = 'delete later';
          risk = 'safe';
        }
        if (ext === '.zip' || ext === '.lock' || entry.name === 'project.zip') {
          reason += 'ARCHIVE ';
          suggested = 'delete later';
          risk = 'safe';
        }
        
        fileData.push({
          path: rel,
          size: stat.size,
          size_kb: (stat.size / 1024).toFixed(1),
          ext,
          category,
          used: 'unknown',
          reason: reason.trim(),
          suggested,
          risk
        });
      } catch(e) {}
    }
  }
}

walk(base);

// Mark duplicates
const dupHashes = {};
for (const [h, paths] of Object.entries(allHashes)) {
  if (paths.length > 1 && h !== 'large_skipped') {
    dupHashes[h] = paths;
  }
}

let dupCount = 0;
let dupSize = 0;
for (const [h, paths] of Object.entries(dupHashes)) {
  dupCount += paths.length;
  for (const p of paths) {
    const f = fileData.find(d => d.path === p);
    if (f) {
      f.reason = 'DUPLICATE ' + f.reason;
      f.suggested = 'review';
      f.risk = 'medium';
      dupSize += f.size;
    }
  }
}

// SUMMARY
console.log('='.repeat(80));
console.log('CLEANUP ANALYSIS REPORT - Futuristic Eleven Eleven');
console.log('='.repeat(80));
const totalSize = fileData.reduce((s, f) => s + f.size, 0);
console.log('Total files scanned:', fileData.length);
console.log('Total size:', (totalSize / 1024).toFixed(1), 'KB (' + (totalSize / 1024 / 1024).toFixed(2) + ' MB)');
console.log();

console.log('--- Size by Extension ---');
const sortedExt = Object.entries(sizeByExt).sort((a, b) => b[1].size - a[1].size);
for (const [ext, info] of sortedExt) {
  console.log('  ' + ext.padEnd(12) + String(info.count).padStart(4) + ' files  ' + (info.size / 1024).toFixed(1).padStart(8) + ' KB');
}
console.log();

console.log('--- Categories ---');
const sortedCats = Object.entries(cats).sort((a, b) => b[1].size - a[1].size);
for (const [c, info] of sortedCats) {
  console.log('  ' + c.padEnd(25) + String(info.count).padStart(4) + ' files  ' + (info.size / 1024).toFixed(1).padStart(8) + ' KB');
}
console.log();

console.log('--- Duplicates ---');
console.log('  Files with duplicate content:', dupCount);
console.log('  Duplicate size:', (dupSize / 1024).toFixed(1), 'KB');
for (const [h, paths] of Object.entries(dupHashes)) {
  console.log('  MD5:' + h.substring(0, 12) + '... (x' + paths.length + ')');
  for (const p of paths) {
    console.log('    - ' + p);
  }
}
console.log();

console.log('--- Flagged Files (Temp/Debug/Report/Backup/Duplicate) ---');
const flagged = fileData.filter(d => d.suggested !== 'keep').sort((a, b) => b.size - a.size);
for (const d of flagged) {
  const flag = '[' + d.suggested + '][' + d.risk + ']';
  console.log('  ' + String(d.size_kb).padStart(8) + ' KB  ' + flag + ' ' + d.reason.padEnd(20) + d.path);
}
console.log();

console.log('--- Large Files (>500 KB) ---');
const large = fileData.filter(d => d.size > 500 * 1024).sort((a, b) => b.size - a.size);
for (const d of large) {
  console.log('  ' + String(d.size_kb).padStart(8) + ' KB  ' + d.path);
}
console.log();

console.log('--- Root Level Files ---');
const rootFiles = fileData.filter(d => !d.path.includes('/') && !d.path.includes('\\'));
for (const d of rootFiles.sort((a, b) => b.size - a.size)) {
  console.log('  ' + String(d.size_kb).padStart(8) + ' KB  ' + d.path);
}
console.log();

// Write JSON report
const report = {
  summary: {
    total_files: fileData.length,
    total_size_kb: +(totalSize / 1024).toFixed(1),
    total_size_mb: +(totalSize / 1024 / 1024).toFixed(2),
    duplicate_count: dupCount,
    duplicate_size_kb: +(dupSize / 1024).toFixed(1)
  },
  categories: Object.fromEntries(
    Object.entries(cats).map(([k, v]) => [k, { count: v.count, size_kb: +(v.size / 1024).toFixed(1) }])
  ),
  root_files: rootFiles.map(d => ({ path: d.path, size_kb: d.size_kb, category: d.category, suggested: d.suggested, risk: d.risk, reason: d.reason })),
  flagged_files: flagged.map(d => ({
    path: d.path,
    size_kb: d.size_kb,
    category: d.category,
    suggested: d.suggested,
    risk: d.risk,
    reason: d.reason
  }))
};

fs.writeFileSync('cleanup_report.json', JSON.stringify(report, null, 2));
console.log('\ncleanup_report.json written successfully');