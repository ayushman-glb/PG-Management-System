const fs = require('fs');
const path = require('path');

function getActualCasePath(baseDir, relativePath) {
  const parts = relativePath.split(/[/\\]+/);
  let current = baseDir;
  for (const part of parts) {
    if (part === '.' || part === '') continue;
    if (part === '..') {
      current = path.dirname(current);
      continue;
    }
    if (!fs.existsSync(current)) return null;
    const entries = fs.readdirSync(current);
    const match = entries.find(e => e.toLowerCase() === part.toLowerCase());
    if (!match) return null;
    if (match !== part) {
      return { expected: part, actual: match, fullActual: path.join(current, match) };
    }
    current = path.join(current, match);
  }
  return null;
}

function checkImportsInDir(dir, aliases = {}, ignoreTests = true) {
  const issues = [];
  function scan(currentDir) {
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (ignoreTests && (file === '__tests__' || file === 'tests' || file === 'e2e')) continue;
        scan(fullPath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        if (ignoreTests && (file.includes('.test.') || file.includes('.spec.'))) continue;
        const content = fs.readFileSync(fullPath, 'utf8');
        const importRegex = /(?:import|export)\s+(?:[\s\S]*?from\s+)?['"]([^'"]+)['"]/g;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
          const importPath = match[1];
          if (importPath.startsWith('.') || Object.keys(aliases).some(a => importPath === a || importPath.startsWith(a + '/'))) {
            let resolvedTarget = null;
            let aliasKey = Object.keys(aliases).find(a => importPath === a || importPath.startsWith(a + '/'));
            if (aliasKey) {
              const subPath = importPath === aliasKey ? '' : importPath.slice(aliasKey.length + 1);
              resolvedTarget = path.join(aliases[aliasKey], subPath);
            } else if (importPath.startsWith('.')) {
              resolvedTarget = path.resolve(currentDir, importPath);
            }

            if (resolvedTarget) {
              let targetExists = false;
              let targetActualCase = null;
              const candidates = [
                resolvedTarget,
                resolvedTarget + '.ts',
                resolvedTarget + '.tsx',
                resolvedTarget + '.d.ts',
                resolvedTarget + '.js',
                resolvedTarget + '.json',
                path.join(resolvedTarget, 'index.ts'),
                path.join(resolvedTarget, 'index.tsx'),
                path.join(resolvedTarget, 'index.js'),
              ];

              for (const cand of candidates) {
                if (fs.existsSync(cand)) {
                  targetExists = true;
                  const root = path.parse(cand).root;
                  const relFromRoot = path.relative(root, cand);
                  const caseDiff = getActualCasePath(root, relFromRoot);
                  if (caseDiff) {
                    targetActualCase = caseDiff;
                  }
                  break;
                }
              }

              if (!targetExists) {
                issues.push({
                  file: fullPath,
                  importPath,
                  type: 'CANNOT_FIND_TARGET'
                });
              } else if (targetActualCase) {
                issues.push({
                  file: fullPath,
                  importPath,
                  type: 'CASE_SENSITIVITY_MISMATCH',
                  details: targetActualCase
                });
              }
            }
          }
        }
      }
    }
  }
  scan(dir);
  return issues;
}

const frontendRoot = path.resolve(__dirname, '../frontend/src');
const frontendAliases = {
  '@': frontendRoot,
  '@app': path.resolve(frontendRoot, 'app'),
  '@components': path.resolve(frontendRoot, 'components'),
  '@features': path.resolve(frontendRoot, 'features'),
  '@hooks': path.resolve(frontendRoot, 'hooks'),
  '@services': path.resolve(frontendRoot, 'services'),
  '@types': path.resolve(frontendRoot, 'types'),
  '@config': path.resolve(frontendRoot, 'config'),
  '@utils': path.resolve(frontendRoot, 'utils'),
  '@constants': path.resolve(frontendRoot, 'constants'),
  '@theme': path.resolve(frontendRoot, 'theme'),
  '@pages': path.resolve(frontendRoot, 'pages'),
  '@store': path.resolve(frontendRoot, 'store'),
  '@providers': path.resolve(frontendRoot, 'providers'),
  '@schemas': path.resolve(frontendRoot, 'schemas'),
  '@guards': path.resolve(frontendRoot, 'guards'),
  '@assets': path.resolve(frontendRoot, 'assets'),
};

console.log('--- Checking Frontend Production Source Imports ---');
const frontendIssues = checkImportsInDir(frontendRoot, frontendAliases, true);
console.log('Frontend Issues Count:', frontendIssues.length);
if (frontendIssues.length > 0) {
  console.log(JSON.stringify(frontendIssues, null, 2));
}

const backendRoot = path.resolve(__dirname, '../backend/src');
console.log('\n--- Checking Backend Production Source Imports ---');
const backendIssues = checkImportsInDir(backendRoot, {}, true);
console.log('Backend Issues Count:', backendIssues.length);
if (backendIssues.length > 0) {
  console.log(JSON.stringify(backendIssues, null, 2));
}
