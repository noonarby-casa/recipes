import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isQuiet = process.argv.includes('--quiet') || process.argv.includes('-q');
const mismatches = [];

// 1. Check Node.js against .nvmrc
const nvmrcPath = path.join(rootDir, '.nvmrc');
let expectedNode = null;
const actualNode = process.version.replace(/^v/, '').trim();

if (fs.existsSync(nvmrcPath)) {
  expectedNode = fs.readFileSync(nvmrcPath, 'utf8').replace(/^v/, '').trim();
  if (actualNode !== expectedNode) {
    mismatches.push({
      tool: 'Node.js',
      active: `v${actualNode}`,
      expected: `v${expectedNode} (from .nvmrc)`,
      fix: 'Run "nvm use" or "pnpm run sync:toolchain"',
    });
  }
}

// 2. Check pnpm against package.json#packageManager
const pkgPath = path.join(rootDir, 'package.json');
let expectedPnpm = null;
let actualPnpm = null;

try {
  actualPnpm = execSync('pnpm -v', { encoding: 'utf8' }).trim();
} catch (err) {
  mismatches.push({
    tool: 'pnpm',
    active: 'Not installed or not in PATH',
    expected: 'pnpm executable',
    fix: 'Install pnpm: https://pnpm.io/installation',
  });
}

if (fs.existsSync(pkgPath) && actualPnpm) {
  const pkgContent = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const packageManager = pkgContent.packageManager || '';
  const match = packageManager.match(/^pnpm@([0-9.]+)/);
  if (match) {
    expectedPnpm = match[1];
    if (actualPnpm !== expectedPnpm) {
      mismatches.push({
        tool: 'pnpm',
        active: actualPnpm,
        expected: `${expectedPnpm} (from package.json#packageManager)`,
        fix: `Update pnpm or run "pnpm run sync:toolchain"`,
      });
    }
  }
}

// 3. Check Hugo against .hugo-version
const hugoVersionPath = path.join(rootDir, '.hugo-version');
let expectedHugo = null;
let actualHugo = null;

try {
  const hugoOutput = execSync('hugo version', { encoding: 'utf8' });
  const hugoMatch = hugoOutput.match(/v?(\d+\.\d+\.\d+)/);
  if (hugoMatch) {
    actualHugo = hugoMatch[1];
  }
} catch (err) {
  mismatches.push({
    tool: 'Hugo',
    active: 'Not installed or not in PATH',
    expected: 'hugo executable',
    fix: 'Install Hugo Extended: https://gohugo.io/installation/',
  });
}

if (fs.existsSync(hugoVersionPath) && actualHugo) {
  expectedHugo = fs.readFileSync(hugoVersionPath, 'utf8').trim();
  if (actualHugo !== expectedHugo) {
    mismatches.push({
      tool: 'Hugo',
      active: `v${actualHugo}`,
      expected: `v${expectedHugo} (from .hugo-version)`,
      fix: 'Update Hugo or run "pnpm run sync:toolchain"',
    });
  }
}

// Result evaluation
if (mismatches.length > 0) {
  console.error('\n❌ Toolchain divergence detected:');
  for (const m of mismatches) {
    console.error(`  - ${m.tool}:`);
    console.error(`      Active:   ${m.active}`);
    console.error(`      Expected: ${m.expected}`);
    console.error(`      Fix:      ${m.fix}`);
  }
  console.error(
    '\nRun "pnpm run update:toolchain" to update repository definitions to match your local host.',
  );
  process.exit(1);
}

if (!isQuiet) {
  const parts = [];
  if (actualNode) parts.push(`Node v${actualNode}`);
  if (actualPnpm) parts.push(`pnpm v${actualPnpm}`);
  if (actualHugo) parts.push(`Hugo v${actualHugo}`);
  console.log(`✓ Toolchains aligned (${parts.join(', ')})`);
}

process.exit(0);
