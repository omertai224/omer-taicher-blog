// ============================================================
// admin-posts.js — create, edit, delete posts
// ============================================================

const AdminPosts = (() => {

  let _allPosts = [];
  let _postsSha = null;
  let _editingId = null; // null = new post, string = editing existing

  // ---------- Load ----------
  async function load() {
    const { posts, sha } = await AdminCore.loadPosts();
    _allPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    _postsSha = sha;
    return _allPosts;
  }

  // ---------- Build post object from form ----------
  function buildPostFromForm() {
    const g = id => document.getElementById(id);
    const title    = g('f-title').value.trim();
    const excerpt  = g('f-excerpt').value.trim();
    const body     = g('f-body').value.trim();
    const date     = g('f-date').value;
    const emoji    = g('f-emoji').value.trim();
    const image    = g('f-image').value.trim();
    const seoTitle = g('f-seo-title').value.trim();
    const seoDesc  = g('f-seo-desc').value.trim();
    const slugField= g('f-slug').value.trim();

    if (!title) throw new Error('כותרת היא שדה חובה');
    if (!excerpt) throw new Error('תקציר הוא שדה חובה');
    if (!body) throw new Error('גוף הפוסט הוא שדה חובה');
    if (!date) throw new Error('תאריך הוא שדה חובה');

    const id = slugField || AdminCore.titleToSlug(title);
    if (!id) throw new Error('לא ניתן לייצר slug מהכותרת');

    return {
      id,
      title,
      excerpt,
      body,
      date,
      emoji: emoji || '📝',
      image: image || '',
      seo_title: seoTitle || `${title} | עומר טייכר`,
      seo_desc:  seoDesc  || excerpt,
    };
  }

  // ---------- Save (create/update) ----------
  async function save(alertContainer) {
    const btn = document.getElementById('btn-save');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> שומר...';

    try {
      if (!AdminCore.isConfigured()) throw new Error('הגדרות GitHub חסרות — עבור להגדרות');

      const post = buildPostFromForm();

      // Reload fresh sha before writing
      const { posts: freshPosts, sha: freshSha } = await AdminCore.loadPosts();
      _postsSha = freshSha;
      let posts = [...freshPosts];

      // Backup before change
      await AdminCore.createBackup(JSON.stringify({ posts }, null, 2));

      if (_editingId) {
        // Edit existing
        const idx = posts.findIndex(p => p.id === _editingId);
        if (idx === -1) throw new Error('הפוסט לא נמצא');
        // Keep original id if changed
        if (post.id !== _editingId) {
          const idExists = posts.some((p, i) => p.id === post.id && i !== idx);
          if (idExists) throw new Error('קיים פוסט עם אותו ID');
        }
        posts[idx] = post;
        await AdminCore.savePosts(posts, freshSha, `edit: ${post.title}`);
        AdminCore.showAlert(alertContainer, 'success', `הפוסט "${post.title}" עודכן בהצלחה ✓`);
      } else {
        // New post — check duplicate id
        if (posts.some(p => p.id === post.id)) throw new Error(`כבר קיים פוסט עם ID: ${post.id}`);
        posts.unshift(post);
        await AdminCore.savePosts(posts, freshSha, `new post: ${post.title}`);
        AdminCore.showAlert(alertContainer, 'success', `הפוסט "${post.title}" פורסם בהצלחה ✓`);
      }

      _allPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
      return post;
    } finally {
      btn.disabled = false;
      btn.innerHTML = _editingId ? '💾 שמור שינויים' : '🚀 פרסם פוסט';
    }
  }

  // ---------- Delete ----------
  async function deletePost(postId, alertContainer) {
    if (!AdminCore.isConfigured()) throw new Error('הגדרות GitHub חסרות');
    const { posts: freshPosts, sha: freshSha } = await AdminCore.loadPosts();
    await AdminCore.createBackup(JSON.stringify({ posts: freshPosts }, null, 2));
    const posts = freshPosts.filter(p => p.id !== postId);
    await AdminCore.savePosts(posts, freshSha, `delete: ${postId}`);
    _allPosts = posts;
    _postsSha = null;
    const deleted = freshPosts.find(p => p.id === postId);
    AdminCore.showAlert(alertContainer, 'success', `הפוסט "${deleted?.title || postId}" נמחק`);
    return posts;
  }

  // ---------- Fill form for editing ----------
  function fillForm(post) {
    _editingId = post.id;
    const g = id => document.getElementById(id);
    g('f-title').value    = post.title;
    g('f-excerpt').value  = post.excerpt;
    g('f-body').value     = post.body;
    g('f-date').value     = post.date;
    g('f-emoji').value    = post.emoji || '';
    g('f-image').value    = post.image || '';
    g('f-seo-title').value= post.seo_title || '';
    g('f-seo-desc').value = post.seo_desc  || '';
    g('f-slug').value     = post.id;
    updatePreview();
    updateSlugPreview();
    updateSeoAuto();
  }

  function resetForm() {
    _editingId = null;
    document.getElementById('post-form').reset();
    document.getElementById('f-date').value = AdminCore.todayISO();
    updatePreview();
  }

  // ---------- Live preview ----------
  function updatePreview() {
    const g = id => document.getElementById(id)?.value || '';
    const title   = g('f-title');
    const excerpt = g('f-excerpt');
    const body    = g('f-body');
    const date    = g('f-date');
    const emoji   = g('f-emoji') || '📝';

    const el = document.getElementById('preview-content');
    if (!el) return;
    el.innerHTML = `
      <div class="preview-frame">
        <div class="preview-title">תצוגה מקדימה</div>
        <div style="font-size:4rem;margin-bottom:16px">${emoji}</div>
        <div class="preview-post-title">${title || 'כותרת הפוסט'}</div>
        <div class="preview-excerpt">${excerpt || 'תקציר הפוסט יופיע כאן...'}</div>
        <div class="preview-meta">עומר טייכר · ${date ? AdminCore.formatDate(date) : ''}</div>
        ${body ? `<div class="preview-body">${body}</div>` : ''}
      </div>`;
  }

  function updateSlugPreview() {
    const title = document.getElementById('f-title')?.value || '';
    const slugEl = document.getElementById('slug-preview');
    if (!slugEl) return;
    const slug = AdminCore.titleToSlug(title);
    slugEl.textContent = slug ? `post.html?id=${slug}` : '';
  }

  function updateSeoAuto() {
    const title   = document.getElementById('f-title')?.value   || '';
    const excerpt = document.getElementById('f-excerpt')?.value || '';
    const seoTitle = document.getElementById('f-seo-title');
    const seoDesc  = document.getElementById('f-seo-desc');
    // Only fill if empty (or placeholder)
    if (seoTitle && !seoTitle.dataset.userEdited) seoTitle.value = title ? `${title} | עומר טייכר` : '';
    if (seoDesc  && !seoDesc.dataset.userEdited)  seoDesc.value  = excerpt;
  }

  // ---------- Getters ----------
  function getAll() { return _allPosts; }
  function getEditingId() { return _editingId; }
  function setEditingId(id) { _editingId = id; }

  return { load, save, deletePost, fillForm, resetForm, updatePreview, updateSlugPreview, updateSeoAuto, getAll, getEditingId, setEditingId };
})();
