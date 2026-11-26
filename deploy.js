const path = require('path');
const fs = require('fs-extra');
const { execSync } = require('child_process');

const WORKTREE_DIR = path.resolve(__dirname, '.tmp-main-worktree');

(async () => {
  try {
    await fs.remove(WORKTREE_DIR);
    execSync('git worktree prune', { stdio: 'ignore' });
    execSync(`git worktree add "${WORKTREE_DIR}" main`, { stdio: 'inherit' });

    const existing = await fs.readdir(WORKTREE_DIR);
    for (const item of existing) {
      if (item !== '.git') {
        await fs.remove(path.join(WORKTREE_DIR, item));
      }
    }

    // 若想在 main 分支保留 public/ 層級，將 WORKTREE_DIR 改為 path.join(WORKTREE_DIR, 'public')
    execSync(`node build.js "${WORKTREE_DIR}"`, { stdio: 'inherit' });

    execSync('git add -A', { cwd: WORKTREE_DIR, stdio: 'inherit' });
    const status = execSync('git status --porcelain', { cwd: WORKTREE_DIR }).toString().trim();

    if (status) {
      execSync('git commit -m "chore: build & obfuscate from dev (local)"', { cwd: WORKTREE_DIR, stdio: 'inherit' });
      execSync('git push origin main', { cwd: WORKTREE_DIR, stdio: 'inherit' });
      console.log('🚀 已成功壓縮混淆並推送到 main 分支！');
    } else {
      console.log('ℹ️ 內容無變化，無需推送。');
    }
  } finally {
    execSync(`git worktree remove -f "${WORKTREE_DIR}"`, { stdio: 'ignore' });
    await fs.remove(WORKTREE_DIR);
  }
})();
