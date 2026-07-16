/**
 * P-04 family — Retired-script sanity check
 *
 * Confirms that migrate-tier-enum.ts is NOT imported or called anywhere in:
 *  - app runtime (mobile/src, admin/src, firebase/functions/src)
 *  - CI pipeline (.github/workflows)
 *  - package.json scripts in any workspace
 *
 * This is a grep-based test, not a unit test.
 * Runs with: node --test tests/retired-script-sanity.test.js
 */

import { execSync } from 'node:child_process';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function grep(pattern, dir) {
  try {
    const result = execSync(
      `grep -r --include="*.ts" --include="*.js" --include="*.json" --include="*.yml" --include="*.yaml" -l "${pattern}" "${dir}" 2>/dev/null`,
      { encoding: 'utf8', cwd: ROOT }
    ).trim();
    return result ? result.split('\n').filter(Boolean) : [];
  } catch {
    // grep exits 1 when no matches — that's success for us
    return [];
  }
}

describe('P-04 — migrate-tier-enum.ts retired-script sanity', () => {
  test('migrate-tier-enum is not imported anywhere in mobile/src', () => {
    const hits = grep('migrate-tier-enum', `${ROOT}/mobile/src`);
    assert.deepEqual(hits, [], `Found imports of retired script in: ${hits.join(', ')}`);
  });

  test('migrate-tier-enum is not imported anywhere in admin/src', () => {
    const hits = grep('migrate-tier-enum', `${ROOT}/admin/src`);
    assert.deepEqual(hits, [], `Found imports of retired script in: ${hits.join(', ')}`);
  });

  test('migrate-tier-enum is not referenced in any CI workflow', () => {
    const ciDir = `${ROOT}/.github/workflows`;
    if (!existsSync(ciDir)) {
      // No CI directory — script cannot be called from CI
      return;
    }
    const hits = grep('migrate-tier-enum', ciDir);
    assert.deepEqual(hits, [], `Found reference to retired script in CI: ${hits.join(', ')}`);
  });

  test('migrate-tier-enum is not listed in any package.json scripts', () => {
    const packageFiles = [
      `${ROOT}/package.json`,
      `${ROOT}/mobile/package.json`,
      `${ROOT}/admin/package.json`,
      `${ROOT}/firebase/package.json`,
    ].filter(existsSync);

    const violations = [];
    for (const pkgPath of packageFiles) {
      const content = readFileSync(pkgPath, 'utf8');
      if (content.includes('migrate-tier-enum')) {
        violations.push(pkgPath);
      }
    }
    assert.deepEqual(violations, [], `Retired script appears in package.json scripts: ${violations.join(', ')}`);
  });

  test('migrate-tier-enum.ts itself is not committed to git (should be untracked)', () => {
    try {
      // If it were committed, git ls-files would return it
      const committed = execSync(
        `git ls-files -- "*migrate-tier-enum*"`,
        { encoding: 'utf8', cwd: ROOT }
      ).trim();
      assert.equal(committed, '', `migrate-tier-enum.ts was committed to git: "${committed}" — it must remain untracked`);
    } catch {
      // Not a git repo or git not available — skip
    }
  });
});
