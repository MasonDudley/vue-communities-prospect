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
  window.parent.postMessage({ type: 'cms-changes', changes, count: changes.length }, '*');
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

  if (contentType === 'image') {
    // Image: add overlay and click-to-upload
    const wrapper = el.parentElement;
    if (wrapper) wrapper.style.position = 'relative';

    const overlay = document.createElement('div');
    overlay.className = 'cms-image-overlay';
    overlay.textContent = 'Click to replace image';
    (wrapper || el).appendChild(overlay);

    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml';
      input.addEventListener('change', async () => {
        const file = input.files[0];
        if (!file) return;

        // Show uploading state
        overlay.textContent = 'Uploading...';
        overlay.style.opacity = '1';

        try {
          const ext = file.name.split('.').pop().toLowerCase();
          const ts = Date.now();
          const path = `cms/${cmsPage}/${el.dataset.cms}/${ts}.${ext}`;

          const { error } = await supabase.storage
            .from('vue-site-assets')
            .upload(path, file, { contentType: file.type, upsert: true });

          if (error) throw error;

          const { data: urlData } = supabase.storage
            .from('vue-site-assets')
            .getPublicUrl(path);

          el.src = urlData.publicUrl;
          recordChange(el);
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
  toast._timer = setTimeout(() => toast.classList.remove('is-visible'), 2000);
}

// ── Notify parent that edit mode is ready ────────────────────────────────────

window.parent.postMessage({ type: 'cms-ready', page: cmsPage }, '*');
notifyParent();
