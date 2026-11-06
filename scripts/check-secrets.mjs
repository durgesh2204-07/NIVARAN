import fs from 'node:fs';
import path from 'node:path';

/**
 * Pre-build secret & credential scanner (Section 8.1).
 * Fails the build with exit code 1 if any file under /src contains patterns
 * resembling API keys, private keys, AWS credentials, or bearer tokens.
 */

const SRC_DIR = path.resolve(process.cwd(), 'src');

const FORBIDDEN_PATTERNS = [
  { name: 'PEM Private Key', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'Google API Key', regex: /\bAIza[0-9A-Za-z\-_]{35}\b/ },
  { name: 'AWS Access Key ID', regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'GitHub Token', regex: /\bgh[pousr]_[A-Za-z0-9_]{36,}\b/ },
  { name: 'Slack Token', regex: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/ },
  { name: 'Hardcoded JWT', regex: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
];

function walkFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, acc);
    } else if (/\.(ts|tsx|js|jsx|json|css|html)$/.test(entry.name)) {
      acc.push(fullPath);
    }
  }
  return acc;
}

const files = walkFiles(SRC_DIR);
let violations = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  for (const rule of FORBIDDEN_PATTERNS) {
    if (rule.regex.test(content)) {
      console.error(`[SECURITY VIOLATION] Found ${rule.name} pattern in ${path.relative(process.cwd(), file)}`);
      violations += 1;
    }
  }
}

if (violations > 0) {
  console.error(`Pre-build secret scan failed with ${violations} violation(s).`);
  process.exit(1);
} else {
  console.log(`Pre-build secret scan passed (${files.length} source files verified clean).`);
}
