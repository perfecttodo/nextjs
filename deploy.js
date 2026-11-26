const path = require('path');
const fs = require('fs-extra');
const { execSync } = require('child_process');

const WORKTREE_DIR = path.resolve(__dirname, '.tmp-main-worktree');
const IGNORE_ITEMS = new Set([
  '.git',
  'node_modules',
  '.next',
  '.tmp-main-worktree',
  'dist',
  'build.js',
  'deploy.js',
  '.github',
]);

(async () => {
  try {
    await fs.remove(WORKTREE_DIR);
    execSync('git worktree prune', { stdio: 'ignore' });
    // 加上 + 號強制將本地 main 指針對齊遠端 origin/main
    execSync('git fetch origin +main:main', { stdio: 'inherit' });
    execSync(`git worktree add "${WORKTREE_DIR}" main`, { stdio: 'inherit' });

    const existing = await fs.readdir(WORKTREE_DIR);
    for (const item of existing) {
      if (item !== '.git') {
        await fs.remove(path.join(WORKTREE_DIR, item));
      }
    }

    const devItems = await fs.readdir(__dirname);
    for (const item of devItems) {
      if (IGNORE_ITEMS.has(item) || item === 'public') continue;
      await fs.copy(path.join(__dirname, item), path.join(WORKTREE_DIR, item));
    }

    const mainPkgPath = path.join(WORKTREE_DIR, 'package.json');
    if (await fs.pathExists(mainPkgPath)) {
      const pkg = await fs.readJson(mainPkgPath);
      if (pkg.scripts) {
        pkg.scripts.build = 'next build';
        delete pkg.scripts.deploy;
      }
      await fs.writeJson(mainPkgPath, pkg, { spaces: 2 });
    }

    execSync(`node build.js "${path.join(WORKTREE_DIR, 'public')}"`, { stdio: 'inherit' });

    execSync('git add -A', { cwd: WORKTREE_DIR, stdio: 'inherit' });
    const status = execSync('git status --porcelain', { cwd: WORKTREE_DIR }).toString().trim();

    if (status) {
      execSync('git commit -m "chore: sync Next.js project with obfuscated public"', { cwd: WORKTREE_DIR, stdio: 'inherit' });
      execSync('git push origin main', { cwd: WORKTREE_DIR, stdio: 'inherit' });
      console.log('🚀 已成功同步並推送到 main 分支！');
    } else {
      console.log('ℹ️ 遠端 main 分支已是最新內容，無需重複推送。');
    }
  } finally {
    try {
      execSync(`git worktree remove -f "${WORKTREE_DIR}"`, { stdio: 'ignore' });
    } catch (_) {}
    await fs.remove(WORKTREE_DIR);
  }
})();
