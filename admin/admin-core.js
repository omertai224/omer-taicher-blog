// ============================================================
// admin-core.js — GitHub API, storage, utilities
// ============================================================

const AdminCore = (() => {

  // ---------- Storage ----------
  const STORAGE_KEYS = {
    TOKEN: 'admin_gh_token',
    REPO:  'admin_gh_repo',
    OWNER: 'admin_gh_owner',
  };

  function getConfig() {
    return {
      token: localStorage.getItem(STORAGE_KEYS.TOKEN) || '',
      repo:  localStorage.getItem(STORAGE_KEYS.REPO)  || '',
      owner: localStorage.getItem(STORAGE_KEYS.OWNER) || '',
    };
  }

  function saveConfig(token, owner, repo) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.REPO,  repo);
    localStorage.setItem(STORAGE_KEYS.OWNER, owner);
  }

  function isConfigured() {
    const c = getConfig();
    return !!(c.token && c.repo && c.owner);
  }

  // ---------- GitHub API ----------
  async function ghRequest(path, method = 'GET', body = null) {
    const { token, owner, repo } = getConfig();
    if (!token) throw new Error('טוקן GitHub לא הוגדר');
    const url = `https://api.github.com/repos/${owner}/${repo}${path}`;
    const opts = {
      method,
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json',
      },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `GitHub API error ${res.status}`);
    }
    return res.json();
  }

  // Get file content + sha
  async function getFile(filePath) {
    try {
      const data = await ghRequest(`/contents/${filePath}`);
      const content = atob(data.content.replace(/\n/g, ''));
      return { content, sha: data.sha };
    } catch (e) {
      if (e.message.includes('404')) return { content: null, sha: null };
      throw e;
    }
  }

  // Create or update file
  async function putFile(filePath, content, message, sha = null) {
    const encoded = btoa(unescape(encodeURIComponent(content)));
    const body = { message, content: encoded };
    if (sha) body.sha = sha;
    return ghRequest(`/contents/${filePath}`, 'PUT', body);
  }

  // Delete file
  async function deleteFile(filePath, sha, message) {
    return ghRequest(`/contents/${filePath}`, 'DELETE', { message, sha });
  }

  // ---------- posts.json helpers ----------
  async function loadPosts() {
    const { content, sha } = await getFile('posts.json');
    if (!content) return { posts: [], sha: null };
    const data = JSON.parse(content);
    return { posts: data.posts || [], sha };
  }

  async function savePosts(posts, sha, message) {
    const content = JSON.stringify({ posts }, null, 2);
    return putFile('posts.json', content, message, sha);
  }

  // ---------- Backups ----------
  const MAX_BACKUPS = 10;

  async function createBackup(postsContent) {
    try {
      // List existing backups
      let backups = [];
      try {
        const res = await ghRequest('/contents/admin/backups');
        backups = res.filter(f => f.name.endsWith('.json') && f.name !== '.gitkeep')
                       .sort((a, b) => a.name.localeCompare(b.name));
      } catch {}

      // Remove oldest if over limit
      while (backups.length >= MAX_BACKUPS) {
        const oldest = backups.shift();
        try { await deleteFile(oldest.path, oldest.sha, 'backup: remove old'); } catch {}
      }

      // Create new backup
      const ts = new Date().toISOString().replace(/[:.]/g,'-').slice(0,19);
      await putFile(`admin/backups/posts-${ts}.json`, postsContent, `backup: ${ts}`);
    } catch (e) {
      console.warn('Backup failed:', e);
    }
  }

  // ---------- Slug ----------
  function titleToSlug(title) {
    return title
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\u0590-\u05FF\uFB1D-\uFB4Ea-zA-Z0-9\-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
  }

  // ---------- Date ----------
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    const months = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  // ---------- Alert helper ----------
  function showAlert(container, type, message, autoDismiss = 5000) {
    const el = document.createElement('div');
    el.className = `alert alert-${type}`;
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    el.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${message}`;
    container.prepend(el);
    if (autoDismiss) setTimeout(() => el.remove(), autoDismiss);
    return el;
  }

  return {
    getConfig, saveConfig, isConfigured,
    ghRequest, getFile, putFile, deleteFile,
    loadPosts, savePosts, createBackup,
    titleToSlug, formatDate, todayISO,
    showAlert,
  };
})();
