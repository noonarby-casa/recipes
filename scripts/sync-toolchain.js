import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function getHostNodeVersion() {
  return process.version.replace(/^v/, '').trim();
}

function getHostPnpmVersion() {
  try {
    return execSync('pnpm -v', { encoding: 'utf8' }).trim();
  } catch (err) {
    console.error('Failed to detect pnpm version:', err.message);
    process.exit(1);
  }
}

function getHostHugoVersion() {
  try {
    const output = execSync('hugo version', { encoding: 'utf8' });
    const match = output.match(/v?(\d+\.\d+\.\d+)/);
    if (!match) {
      throw new Error(
        `Unable to parse Hugo version from output: "${output.trim()}"`,
      );
    }
    return match[1];
  } catch (err) {
    console.error('Failed to detect Hugo version:', err.message);
    process.exit(1);
  }
}

console.log('Inspecting active local host toolchains...');

const nodeVersion = getHostNodeVersion();
const pnpmVersion = getHostPnpmVersion();
const hugoVersion = getHostHugoVersion();

// 1. Sync .nvmrc
const nvmrcPath = path.join(rootDir, '.nvmrc');
fs.writeFileSync(nvmrcPath, `${nodeVersion}\n`, 'utf8');
console.log(`✓ Synced Node.js: ${nodeVersion} -> .nvmrc`);

// 2. Sync package.json#packageManager
const pkgPath = path.join(rootDir, 'package.json');
const pkgContent = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const newPackageManager = `pnpm@${pnpmVersion}`;
pkgContent.packageManager = newPackageManager;
fs.writeFileSync(pkgPath, `${JSON.stringify(pkgContent, null, 2)}\n`, 'utf8');
console.log(`✓ Synced pnpm: ${pnpmVersion} -> package.json#packageManager`);

// 3. Sync .hugo-version
const hugoVersionPath = path.join(rootDir, '.hugo-version');
fs.writeFileSync(hugoVersionPath, `${hugoVersion}\n`, 'utf8');
console.log(`✓ Synced Hugo: ${hugoVersion} -> .hugo-version`);

console.log('\nToolchain configuration synchronized successfully!');
