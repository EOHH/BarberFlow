import { readdir, readFile } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';

const root = resolve(process.cwd(), 'src');
const sourceExtensions = new Set(['.js', '.jsx', '.ts', '.tsx']);
const directSileoAllowlist = new Set([
  'app/providers.tsx',
  'shared/lib/notifications.ts',
]);
const alternativeToastPackages = [
  'sonner',
  'react-toastify',
  'react-hot-toast',
  'notistack',
];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? collectFiles(path) : [path];
  }));
  return files.flat().filter((file) => sourceExtensions.has(extname(file)));
}

const violations = [];

for (const file of await collectFiles(root)) {
  const source = await readFile(file, 'utf8');
  const path = relative(root, file).replaceAll('\\', '/');

  if (/(?:^|[^\w.$])(?:window\.)?(?:alert|confirm|prompt)\s*\(/m.test(source)) {
    violations.push(`${path}: usa una API nativa de feedback bloqueante`);
  }

  for (const packageName of alternativeToastPackages) {
    const packagePattern = new RegExp(`(?:from\\s*|import\\s*\\(|require\\s*\\()(['"])${packageName}\\1`);
    if (packagePattern.test(source)) {
      violations.push(`${path}: importa la biblioteca de notificaciones no permitida "${packageName}"`);
    }
  }

  if (!directSileoAllowlist.has(path) && /(?:from\s*|import\s*\()(['"])sileo\1/.test(source)) {
    violations.push(`${path}: debe usar shared/lib/notifications en lugar de importar Sileo directamente`);
  }
}

if (violations.length > 0) {
  console.error('Feedback no estandarizado:\n' + violations.map((violation) => `- ${violation}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log('Feedback check: OK');
}
