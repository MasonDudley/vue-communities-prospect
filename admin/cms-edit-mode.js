/**
 * CMS Edit Mode — injected into site pages when loaded inside the admin editor iframe.
 * Makes [data-cms] elements editable (text/html → contenteditable, images → click-to-replace).
 * Communicates pending changes to the parent admin dashboard via postMessage.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://povizsshrvyqcaszwzmr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_4EFhT1Gx4qk_PHEm4cdRjw_kFKrEDZJ';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const cmsPage = document.body.dataset.cmsPage;
if (!cmsPage) throw new Error('cms-edit-mode: no data-cms-page on <body>');

// ── Auth gate ────────────────────────────────────────────────────────────────

const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#64748b;">Not authorized. Please log in to the admin portal.</div>';
  throw new Error('cms-edit-mode: no active session');
}

// ── Inject edit-mode styles ──────────────────────────────────────────────────

const style = document.createElement('style');
style.textContent = `
  [data-cms] {
    outline: 2px dashed transparent;
    outline-offset: 2px;
    transition: outline-color 0.15s;
    cursor: pointer;
    position: relative;
  }
  [data-cms]:hover {
    outline-color: #2563eb;
  }
  [data-cms].cms-editing {
    outline-color: #f59e0b;
    outline-style: solid;
  }
  [data-cms].cms-changed {
    outline-color: #10b981;
    outline-style: solid;
  }
  [data-cms][data-cms-type="image"] {
    cursor: pointer;
  }
  .cms-image-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(13, 39, 68, 0.55);
    color: #fff;
    font: 600 0.875rem/1 system-ui, sans-serif;
    opacity: 0;
    transition: opacity 0.15s;
    pointer-events: none;
    border-radius: 4px;
    z-index: 10;
  }
  [data-cms][data-cms-type="image"]:hover .cms-image-overlay {
    opacity: 1;
  }
  .cms-toast {
    position: fixed;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    background: #0d2744;
    color: #fff;
    padding: 0.625rem 1.25rem;
    border-radius: 6px;
    font: 500 0.875rem/1.4 system-ui, sans-serif;
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .cms-toast.is-visible { opacity: 1; }
`;
document.head.appendChild(style);

// ── Edit mode banner ─────────────────────────────────────────────────────────

const banner = document.createElement('div');
banner.style.cssText = 'position:sticky;top:0;z-index:9999;background:#1e40af;color:#fff;text-align:center;padding:0.5rem 1rem;font:500 0.8125rem/1.4 system-ui,sans-serif;';
banner.textContent = 'Editing mode — click any highlighted element to edit text, or click images to replace them';
document.body.prepend(banner);

// ── Disable page links & navigation in edit mode ─────────────────────────────

document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href]');
  if (link && !link.closest('[data-cms]')) {
    e.preventDefault();
  }
}, true);

// ── Pending changes tracking ─────────────────────────────────────────────────

const pendingChanges = new Map();

function notifyParent() {
  const changes = Array.from(pendingChanges.entries()).map(([key, data]) => ({
    page: data.page,
    cms_key: key,
    content_type: data.content_type,
    value: data.value,
  }));
  window.parent.postMessage({ type: 'cms-changes', changes, count: changes.length }, window.location.origin);
}

function recordChange(el) {
  const key = el.dataset.cms;
  const contentType = el.dataset.cmsType || 'text';
  let value;

  if (contentType === 'image') {
    value = el.src;
  } else if (contentType === 'html') {
    value = el.innerHTML;
  } else {
    value = el.textContent;
  }

  // Determine page scope: keys starting with "shared:" go to page='shared'
  const page = key.startsWith('shared:') ? 'shared' : cmsPage;

  pendingChanges.set(key, { page, content_type: contentType, value });
  el.classList.add('cms-changed');
  notifyParent();
}

// ── Text editing ─────────────────────────────────────────────────────────────

const cmsElements = document.querySelectorAll('[data-cms]');

cmsElements.forEach((el) => {
  const contentType = el.dataset.cmsType || 'text';

  // Store original content for reset-to-default
  if (contentType === 'image') {
    el.dataset.cmsOriginal = el.src;
  } else if (contentType === 'html') {
    el.dataset.cmsOriginal = el.innerHTML;
  } else {
    el.dataset.cmsOriginal = el.textContent;
  }

  // Right-click to reset to baked-in default
  el.addEventListener('contextmenu', (e) => {
    if (!el.dataset.cmsOriginal) return; // no original stored, nothing to reset
    e.preventDefault();
    const restore = confirm('Reset this element to its default content?');
    if (!restore) return;
    if (contentType === 'image') {
      el.src = el.dataset.cmsOriginal;
    } else if (contentType === 'html') {
      el.innerHTML = el.dataset.cmsOriginal;
    } else {
      el.textContent = el.dataset.cmsOriginal;
    }
    el.classList.remove('cms-changed');
    pendingChanges.delete(el.dataset.cms);
    notifyParent();
    showToast('Reset to default');
  });

  if (contentType === 'image') {
    // Image: add overlay and click for choice (upload or gallery)
    const wrapper = el.parentElement;
    if (wrapper) wrapper.style.position = 'relative';

    const overlay = document.createElement('div');
    overlay.className = 'cms-image-overlay';
    overlay.textContent = 'Click to replace image';
    (wrapper || el).appendChild(overlay);

    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showImageChoiceModal(el, overlay);
    });
  } else {
    // Text or HTML: make contenteditable on click
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (el.isContentEditable) return;
      el.contentEditable = 'true';
      el.classList.add('cms-editing');
      el.focus();
    });

    el.addEventListener('blur', () => {
      el.contentEditable = 'false';
      el.classList.remove('cms-editing');
      recordChange(el);
    });

    el.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        el.blur();
      }
      // Prevent Enter from creating new block elements in non-html fields
      if (e.key === 'Enter' && (el.dataset.cmsType || 'text') === 'text') {
        e.preventDefault();
        el.blur();
      }
    });

    // Strip HTML when pasting into text-only fields
    if ((el.dataset.cmsType || 'text') === 'text') {
      el.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
      });
    }
  }
});

// ── Listen for messages from parent dashboard ────────────────────────────────

window.addEventListener('message', (e) => {
  if (e.data?.type === 'cms-saved') {
    pendingChanges.clear();
    cmsElements.forEach((el) => el.classList.remove('cms-changed'));
    showToast('Changes saved');
  }

  if (e.data?.type === 'cms-discard') {
    // Reload the page to reset all edits
    window.location.reload();
  }
});

// ── Keyboard shortcuts ───────────────────────────────────────────────────────

document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    if (pendingChanges.size > 0) {
      window.parent.postMessage({ type: 'cms-save-request' }, window.location.origin);
      showToast('Saving...');
    }
  }
});

// ── Toast helper ─────────────────────────────────────────────────────────────

function showToast(msg) {
  let toast = document.querySelector('.cms-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'cms-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('is-visible');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('is-visible'), 3000);
}

// ── Image choice modal + gallery picker ──────────────────────────────────────

// Inject gallery picker styles into iframe head
const galleryStyle = document.createElement('style');
galleryStyle.textContent = `
  .cms-choice-backdrop { position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:99998;display:flex;align-items:center;justify-content:center; }
  .cms-choice-card { background:#fff;border-radius:16px;padding:1.5rem;max-width:340px;width:calc(100% - 2rem);box-shadow:0 20px 60px rgba(0,0,0,0.2); }
  .cms-choice-card h3 { margin:0 0 1rem;font-size:1rem;font-weight:600;text-align:center; }
  .cms-choice-option { display:block;width:100%;padding:0.75rem 1rem;border:1px solid #e2e8f0;border-radius:8px;background:#fff;color:#16304c;font:500 0.875rem/1 system-ui,sans-serif;cursor:pointer;text-align:left;margin-bottom:0.5rem;transition:background 0.15s; }
  .cms-choice-option:hover { background:#f1f5f9;border-color:#cbd5e1; }
  .cms-choice-cancel { display:block;width:100%;padding:0.5rem;background:none;border:none;color:#64748b;font:0.8125rem system-ui,sans-serif;cursor:pointer;margin-top:0.5rem;text-align:center; }
  .cms-choice-cancel:hover { color:#16304c; }
  .gallery-picker-backdrop { position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center; }
  .gallery-picker { background:#fff;border-radius:16px;width:calc(100% - 2rem);max-width:800px;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.25); }
  .gallery-picker__header { display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;border-bottom:1px solid #e2e8f0; }
  .gallery-picker__header h3 { margin:0;font-size:1rem;font-weight:600; }
  .gallery-picker__close { background:none;border:1px solid #e2e8f0;border-radius:6px;padding:0.25rem 0.625rem;cursor:pointer;font-size:1rem;color:#64748b; }
  .gallery-picker__close:hover { background:#f1f5f9; }
  .gallery-picker__search { padding:0.75rem 1.25rem;border-bottom:1px solid #e2e8f0; }
  .gallery-picker__search input { width:100%;padding:0.4375rem 0.75rem;border:1px solid #e2e8f0;border-radius:6px;font:0.875rem system-ui,sans-serif; }
  .gallery-picker__search input::placeholder { color:#94a3b8; }
  .gallery-picker__grid { flex:1;overflow-y:auto;padding:1rem 1.25rem;display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:0.75rem;align-content:start; }
  .gallery-picker__item { aspect-ratio:1;border:2px solid transparent;border-radius:8px;overflow:hidden;cursor:pointer;background:#f8fafc;transition:border-color 0.15s; }
  .gallery-picker__item:hover { border-color:#2563eb; }
  .gallery-picker__item img { width:100%;height:100%;object-fit:cover; }
  .gallery-picker__empty { grid-column:1/-1;text-align:center;padding:2rem;color:#64748b;font-size:0.875rem; }
  .gallery-picker__loading { grid-column:1/-1;text-align:center;padding:2rem;color:#94a3b8;font-size:0.875rem; }
`;
document.head.appendChild(galleryStyle);

function showImageChoiceModal(imgEl, overlay) {
  const backdrop = document.createElement('div');
  backdrop.className = 'cms-choice-backdrop';
  backdrop.innerHTML = `
    <div class="cms-choice-card">
      <h3>Replace image</h3>
      <button class="cms-choice-option" data-choice="upload">Upload a new image</button>
      <button class="cms-choice-option" data-choice="gallery">Choose from media library</button>
      <button class="cms-choice-cancel" data-choice="cancel">Cancel</button>
    </div>`;
  document.body.appendChild(backdrop);

  const cleanup = () => backdrop.remove();
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) cleanup(); });

  backdrop.querySelector('[data-choice="cancel"]').addEventListener('click', cleanup);

  backdrop.querySelector('[data-choice="upload"]').addEventListener('click', () => {
    cleanup();
    triggerFileUpload(imgEl, overlay);
  });

  backdrop.querySelector('[data-choice="gallery"]').addEventListener('click', () => {
    cleanup();
    showGalleryPicker(imgEl, overlay);
  });
}

function triggerFileUpload(imgEl, overlay) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml';
  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;

    overlay.textContent = 'Uploading...';
    overlay.style.opacity = '1';

    try {
      const ext = file.name.split('.').pop().toLowerCase();
      const ts = Date.now();
      const path = `cms/${cmsPage}/${imgEl.dataset.cms}/${ts}.${ext}`;

      const { error } = await supabase.storage
        .from('vue-site-assets')
        .upload(path, file, { contentType: file.type, upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('vue-site-assets')
        .getPublicUrl(path);

      imgEl.src = urlData.publicUrl;
      recordChange(imgEl);
      overlay.textContent = 'Click to replace image';
      overlay.style.opacity = '';
      showToast('Image uploaded');
    } catch (err) {
      overlay.textContent = 'Upload failed — click to retry';
      overlay.style.opacity = '';
      console.error('CMS image upload failed:', err);
      showToast('Image upload failed');
    }
  });
  input.click();
}

async function listAllFilesCms(prefix = '') {
  const files = [];
  const { data, error } = await supabase.storage.from('vue-site-assets').list(prefix, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });
  if (error || !data) return files;
  for (const item of data) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id) {
      files.push({ ...item, fullPath });
    } else {
      const nested = await listAllFilesCms(fullPath);
      files.push(...nested);
    }
  }
  return files;
}

async function showGalleryPicker(imgEl, overlay) {
  const imgExts = /\.(jpe?g|png|webp|gif|svg)$/i;

  const backdrop = document.createElement('div');
  backdrop.className = 'gallery-picker-backdrop';
  backdrop.innerHTML = `
    <div class="gallery-picker">
      <div class="gallery-picker__header">
        <h3>Choose from media library</h3>
        <button class="gallery-picker__close">&times;</button>
      </div>
      <div class="gallery-picker__search">
        <input type="search" placeholder="Search images..." />
      </div>
      <div class="gallery-picker__grid">
        <div class="gallery-picker__loading">Loading images...</div>
      </div>
    </div>`;
  document.body.appendChild(backdrop);

  const close = () => backdrop.remove();
  backdrop.querySelector('.gallery-picker__close').addEventListener('click', close);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });

  // Load images
  const allFiles = await listAllFilesCms();
  const imageFiles = allFiles.filter(f => imgExts.test(f.name));
  const grid = backdrop.querySelector('.gallery-picker__grid');

  function renderPickerGrid(search = '') {
    const filtered = search
      ? imageFiles.filter(f => f.fullPath.toLowerCase().includes(search))
      : imageFiles;

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="gallery-picker__empty">No images found</div>';
      return;
    }

    grid.innerHTML = filtered.map(f => {
      const { data } = supabase.storage.from('vue-site-assets').getPublicUrl(f.fullPath);
      const url = data?.publicUrl || '';
      return `<div class="gallery-picker__item" data-url="${url}" title="${f.fullPath}"><img src="${url}" alt="${f.name}" loading="lazy" /></div>`;
    }).join('');

    grid.querySelectorAll('.gallery-picker__item').forEach(item => {
      item.addEventListener('click', () => {
        imgEl.src = item.dataset.url;
        recordChange(imgEl);
        close();
        showToast('Image selected from gallery');
      });
    });
  }

  renderPickerGrid();

  // Search
  const searchInput = backdrop.querySelector('.gallery-picker__search input');
  let debounce;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => renderPickerGrid(searchInput.value.toLowerCase().trim()), 200);
  });
}

// ── Warn on unload with pending changes ──────────────────────────────────────

window.addEventListener('beforeunload', (e) => {
  if (pendingChanges.size > 0) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// ── Notify parent that edit mode is ready ────────────────────────────────────

window.parent.postMessage({ type: 'cms-ready', page: cmsPage }, window.location.origin);
notifyParent();
