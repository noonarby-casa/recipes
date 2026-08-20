import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const cleanTargets = [
  'public',
  'resources/_gen',
  'themes/cookpot/assets/dist',
  'playwright-report',
  'test-results',
  '.hugo_build.lock',
  'hugo_stats.json',
  'firebase-debug.log',
  'assets/jsconfig.json',
];

const cleanAllTargets = [...cleanTargets, 'node_modules'];

const args = process.argv.slice(2);
const shouldCleanAll = args.includes('--all') || args.includes('-a');
const targets = shouldCleanAll ? cleanAllTargets : cleanTargets;

console.log(
  `Cleaning temporary files and directories${shouldCleanAll ? ' (including node_modules)' : ''}...`,
);

for (const target of targets) {
  const targetPath = path.join(rootDir, target);
  if (fs.existsSync(targetPath)) {
    try {
      const stats = fs.statSync(targetPath);
      if (stats.isDirectory()) {
        fs.rmSync(targetPath, { recursive: true, force: true });
        console.log(`✓ Deleted directory: ${target}`);
      } else {
        fs.rmSync(targetPath, { force: true });
        console.log(`✓ Deleted file: ${target}`);
      }
    } catch (err) {
      console.error(`✗ Failed to delete ${target}:`, err.message);
    }
  }
}

// Also delete *.log files in rootDir
try {
  const files = fs.readdirSync(rootDir);
  for (const file of files) {
    if (file.endsWith('.log') && file !== 'firebase-debug.log') {
      const filePath = path.join(rootDir, file);
      fs.rmSync(filePath, { force: true });
      console.log(`✓ Deleted log file: ${file}`);
    }
  }
} catch (err) {
  console.error('✗ Failed to scan or delete log files in root:', err.message);
}

console.log('Clean completed.');
