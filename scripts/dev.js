import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Building initial Vite bundle...');
try {
  execSync('pnpm exec vite build', { cwd: rootDir, stdio: 'inherit' });
} catch (err) {
  console.error('Initial Vite build failed:', err);
  process.exit(1);
}

console.log('Starting Vite watch mode and Hugo dev server...');

const viteProcess = spawn('pnpm', ['exec', 'vite', 'build', '--watch'], {
  cwd: rootDir,
  stdio: 'inherit',
});

const hugoProcess = spawn('hugo', ['server', '--noHTTPCache'], {
  cwd: rootDir,
  stdio: 'inherit',
});

function cleanup() {
  if (viteProcess && !viteProcess.killed) {
    viteProcess.kill('SIGINT');
  }
  if (hugoProcess && !hugoProcess.killed) {
    hugoProcess.kill('SIGINT');
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

viteProcess.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.error(`Vite watcher exited with code ${code}`);
  }
});

hugoProcess.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.error(`Hugo server exited with code ${code}`);
  }
});
