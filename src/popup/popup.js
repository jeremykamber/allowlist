// ═══════════════════════════════════════════════════════════════════════════════
//  AllowList — Popup Controller
//  Professional-grade extension UX with keyboard support, undo, and polish.
// ═══════════════════════════════════════════════════════════════════════════════

const $ = (s) => document.querySelector(s);
const $$ = (s, ctx) => Array.from((ctx || document).querySelectorAll(s));

// ── Async message helpers ──────────────────────────────────────────────────

const send = (type, payload) =>
  new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type, payload }, (res) => {
        if (chrome.runtime.lastError) resolve(null);
        else resolve(res);
      });
    } catch {
      resolve(null);
    }
  });

const queryTabs = (query) =>
  new Promise((resolve) => {
    try {
      chrome.tabs.query(query, resolve);
    } catch {
      resolve([]);
    }
  });

// ── State ──────────────────────────────────────────────────────────────────

let state = null;

// ── Toast ──────────────────────────────────────────────────────────────────

let toastTimeout = null;

/**
 * Show a toast notification at the bottom of the popup.
 * @param {string} msg - The message.
 * @param {object} [opts] - Options.
 * @param {'info'|'error'} [opts.type='info'] - Toast type.
 * @param {() => Promise<void>} [opts.undo] - Optional async undo callback.
 * @param {number} [opts.duration] - Duration in ms (default: 1200, 4000 with undo).
 */
function toast(msg, opts = {}) {
  const { type = 'info', undo, duration } = opts;
  const el = $('#toast');
  el.innerHTML = '';
  el.className = `toast ${type}`;
  el.textContent = '';

  const textSpan = document.createElement('span');
  textSpan.textContent = msg;
  el.appendChild(textSpan);

  if (undo) {
    const undoBtn = document.createElement('button');
    undoBtn.className = 'toast-undo';
    undoBtn.textContent = 'Undo';
    undoBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await undo();
      } catch {
        // silent
      }
      el.classList.add('hidden');
      clearTimeout(toastTimeout);
    });
    el.appendChild(undoBtn);
  }

  el.classList.remove('hidden');
  clearTimeout(toastTimeout);
  const dur = duration ?? (undo ? 4000 : 1500);
  toastTimeout = setTimeout(() => el.classList.add('hidden'), dur);
}

// ── Loading states ─────────────────────────────────────────────────────────

function setLoading(btn, loading) {
  if (loading) {
    btn.classList.add('loading');
    btn.disabled = true;
  } else {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

// ── Dark mode ──────────────────────────────────────────────────────────────

function initDarkMode() {
  const saved = localStorage.getItem('darkMode');
  if (saved !== null) {
    document.documentElement.setAttribute('data-theme', saved === 'true' ? 'dark' : 'light');
  }
  updateDarkModeBtn();
}

function toggleDarkMode() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('darkMode', next === 'dark' ? 'true' : 'false');
  updateDarkModeBtn();
}

function updateDarkModeBtn() {
  const btn = $('#dark-mode-toggle');
  if (!btn) return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  btn.querySelector('.material-symbols-outlined').textContent = isDark ? 'light_mode' : 'dark_mode';
}

// ── URL command handling (scriptable IPC) ───────────────────────────────────

async function processUrlCommand(cmd, value) {
  const bg = (t, p) => chrome.runtime.sendMessage({ type: t, payload: p });

  switch (cmd) {
    case 'toggle': {
      await bg('toggle');
      break;
    }
    case 'enable': {
      await bg('set_enabled', true);
      break;
    }
    case 'disable': {
      await bg('set_enabled', false);
      break;
    }
    case 'set_list': {
      if (value) await bg('set_current', decodeURIComponent(value));
      break;
    }
    case 'add_site': {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        const u = new URL(tab.url);
        const parts = u.hostname.split('.').filter(Boolean);
        let domain = u.hostname;
        if (parts.length > 2) {
          const twoLevel = new Set([
            'co.uk', 'com.au', 'co.jp', 'co.in', 'com.br',
            'co.kr', 'com.sg', 'com.cn', 'com.tw', 'com.mx', 'co.za',
          ]);
          const last2 = parts.slice(-2).join('.');
          domain = twoLevel.has(last2) ? parts.slice(-3).join('.') : last2;
        }
        await bg('add_entry_current', { type: 'domain', value: domain });
      }
      break;
    }
    case 'cycle_list': {
      const old = await bg('get_state');
      if (old) {
        const names = Object.keys(old.allowlists);
        const idx = names.indexOf(old.current);
        const next = names[(idx + 1) % names.length];
        await bg('set_current', next);
      }
      break;
    }
  }
}

// ── Init ───────────────────────────────────────────────────────────────────

async function init() {
  try {
    initDarkMode();

    // Handle URL commands (scriptable IPC)
    const params = new URLSearchParams(window.location.search);
    const cmd = params.get('cmd');
    if (cmd) {
      try {
        await processUrlCommand(cmd, params.get('value') || '');
      } catch {
        // silent
      }
      setTimeout(() => {
        window.location.href = 'about:blank';
        try { window.close(); } catch {}
      }, 200);
      return;
    }

    state = await send('get_state');
    if (!state) {
      toast('Failed to load settings', { type: 'error' });
      return;
    }

    renderAllowlists();
    renderEntries();
    syncToggle();
  } catch {
    toast('Initialization error', { type: 'error' });
  }
}

// ── Render: List dropdown ──────────────────────────────────────────────────

function renderAllowlists() {
  const btn = $('#list-select-btn');
  const menu = $('#list-select-menu');
  menu.innerHTML = '';
  if (!state?.allowlists) return;

  // Sort: current list first, then by most recently created (reverse key order),
  // but keep Scratchpad at a predictable position
  const names = Object.keys(state.allowlists);

  // Build display order: current list first, then "🔬 Deep Work" (for quick access),
  // then the rest sorted, Scratchpad last
  const order = buildListOrder(names);

  for (const name of order) {
    const item = document.createElement('div');
    item.className = 'custom-select-item';
    item.setAttribute('role', 'option');
    item.textContent = name;
    item.dataset.name = name;
    if (name === state.current) {
      item.setAttribute('aria-selected', 'true');
    }
    item.addEventListener('click', async () => {
      try {
        await send('set_current', name);
        state = await send('get_state');
        if (!state) return;
        renderAllowlists();
        renderEntries();
        closeDropdown();
      } catch {
        toast('Failed to switch list', { type: 'error' });
      }
    });
    menu.appendChild(item);
  }

  btn.textContent = state.current || names[0] || 'AllowList';

  // Dropdown toggle
  btn.onclick = (e) => {
    e.stopPropagation();
    const open = !menu.classList.contains('hidden');
    if (open) closeDropdown();
    else openDropdown();
  };

  // Click outside closes
  document.addEventListener('click', (ev) => {
    const wrapper = $('#list-select');
    if (!wrapper.contains(ev.target)) closeDropdown();
  });
}

function buildListOrder(names) {
  // Priority: current first, then preset work lists, then alphabetically
  const priority = ['🔬 Deep Work', '💼 Work', '🎓 Learning', '🎨 Creative', '📚 Research'];
  const current = state.current;

  const ordered = [];

  // Current list first
  if (current && names.includes(current)) {
    ordered.push(current);
  }

  // Priority presets next (that aren't current)
  for (const p of priority) {
    if (p !== current && names.includes(p) && !ordered.includes(p)) {
      ordered.push(p);
    }
  }

  // Everything else sorted alphabetically (but not Scratchpad)
  const rest = names
    .filter((n) => !ordered.includes(n) && n !== 'Scratchpad')
    .sort((a, b) => a.localeCompare(b));

  ordered.push(...rest);

  // Scratchpad last
  if (names.includes('Scratchpad') && !ordered.includes('Scratchpad')) {
    ordered.push('Scratchpad');
  }

  return ordered;
}

function openDropdown() {
  const menu = $('#list-select-menu');
  const btn = $('#list-select-btn');
  menu.classList.remove('hidden');
  btn.setAttribute('aria-expanded', 'true');
  const firstItem = menu.querySelector('.custom-select-item');
  if (firstItem) firstItem.focus();
}

function closeDropdown() {
  const menu = $('#list-select-menu');
  const btn = $('#list-select-btn');
  menu.classList.add('hidden');
  btn.setAttribute('aria-expanded', 'false');
}

// ── Render: Entries list ───────────────────────────────────────────────────

function renderEntries() {
  const list = $('#entries');
  const empty = $('#empty-state');
  const count = $('#entries-count');

  if (!state?.allowlists?.[state.current]) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    count.textContent = '0 entries';
    return;
  }

  const entries = state.allowlists[state.current];
  list.innerHTML = '';
  empty.classList.toggle('hidden', entries.length > 0);
  count.textContent = `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`;

  for (const entry of entries) {
    const li = document.getElementById('entry-tpl').content.cloneNode(true);
    li.querySelector('.entry-type').textContent = entry.type;
    li.querySelector('.entry-value').textContent = entry.value;

    // Copy
    li.querySelector('.entry-copy').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(entry.value);
        toast('Copied to clipboard');
      } catch {
        toast('Copy failed', { type: 'error' });
      }
    });

    // Edit
    li.querySelector('.entry-edit').addEventListener('click', () => {
      openEditEntryModal(entry);
    });

    // Delete
    li.querySelector('.entry-delete').addEventListener('click', () => {
      deleteEntry(entry);
    });

    list.appendChild(li);
  }
}

// ── Entry operations ───────────────────────────────────────────────────────

async function deleteEntry(entry) {
  try {
    const removed = { ...entry };
    await send('remove_entry_current', entry);
    state = await send('get_state');
    if (!state) return;
    renderEntries();
    toast('Removed', {
      undo: async () => {
        await send('add_entry_current', removed);
        state = await send('get_state');
        renderEntries();
        toast('Restored');
      },
      duration: 4000,
    });
  } catch {
    toast('Error removing entry', { type: 'error' });
  }
}

function openEditEntryModal(entry) {
  const modal = $('#edit-entry-modal');
  const input = $('#edit-entry-value');
  const form = $('#edit-entry-form');

  input.value = entry.value;
  modal.classList.remove('hidden');
  setTimeout(() => {
    input.focus();
    input.select();
  }, 100);

  const close = () => modal.classList.add('hidden');

  const onSave = async () => {
    const btn = $('#edit-entry-save');
    setLoading(btn, true);
    try {
      const val = input.value.trim();
      if (!val || val === entry.value) { close(); return; }
      const r = await send('classify_input', val);
      if (!r?.entry) {
        toast('Invalid entry format', { type: 'error' });
        return;
      }
      await send('update_entry_current', { from: entry, to: r.entry });
      state = await send('get_state');
      if (!state) return;
      renderEntries();
      close();
      toast('Updated');
    } catch {
      toast('Error updating entry', { type: 'error' });
    } finally {
      setLoading(btn, false);
    }
  };

  $('#edit-entry-save').onclick = onSave;
  $('#edit-entry-cancel').onclick = close;
  $('#edit-entry-close').onclick = close;

  // Enter submits the form
  form.onsubmit = (e) => {
    e.preventDefault();
    onSave();
  };
}

// ── List management ────────────────────────────────────────────────────────

function openManageModal() {
  const modal = $('#manage-list-modal');
  const nameEl = $('#manage-current-name');
  const input = $('#manage-rename-input');

  modal.classList.remove('hidden');
  const currentName = state.current || '';
  nameEl.textContent = currentName;
  input.value = currentName;
  setTimeout(() => input.focus(), 100);

  const close = () => modal.classList.add('hidden');

  $('#manage-rename-save').onclick = async () => {
    const btn = $('#manage-rename-save');
    setLoading(btn, true);
    try {
      const newName = input.value.trim();
      if (!newName || newName === currentName) { close(); return; }
      await send('rename_allowlist', { from: currentName, to: newName });
      await send('set_current', newName);
      state = await send('get_state');
      if (!state) return;
      renderAllowlists();
      renderEntries();
      close();
      toast('Renamed');
    } catch {
      toast('Error renaming list', { type: 'error' });
    } finally {
      setLoading(btn, false);
    }
  };

  $('#manage-save-as').onclick = async () => {
    const btn = $('#manage-save-as');
    setLoading(btn, true);
    try {
      const name = await askForName('Save list as', currentName);
      if (!name) return;
      const entries = [...(state.allowlists[currentName] || [])];
      await send('save_allowlist', { name: name.trim(), entries });
      await send('set_current', name.trim());
      state = await send('get_state');
      if (!state) return;
      renderAllowlists();
      renderEntries();
      close();
      toast(`Saved as "${name.trim()}"`);
    } catch {
      toast('Error saving list', { type: 'error' });
    } finally {
      setLoading(btn, false);
    }
  };

  $('#manage-delete').onclick = () => {
    close();
    setTimeout(() => openConfirmDelete(), 200);
  };

  $('#manage-list-close').onclick = close;

  // Enter on rename input triggers rename
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      $('#manage-rename-save').click();
    }
  });
}

function openConfirmDelete() {
  const dlg = $('#confirm-delete-modal');
  dlg.classList.remove('hidden');

  $('#confirm-delete-no').onclick = () => dlg.classList.add('hidden');

  $('#confirm-delete-yes').onclick = async () => {
    const btn = $('#confirm-delete-yes');
    setLoading(btn, true);
    try {
      const name = state.current;
      const backup = [...(state.allowlists[name] || [])];

      if (name === 'Scratchpad') {
        // Scratchpad can't be deleted — just clear it
        await send('save_allowlist', { name: 'Scratchpad', entries: [] });
        state = await send('get_state');
        if (!state) return;
        renderAllowlists();
        renderEntries();
        dlg.classList.add('hidden');
        toast('Scratchpad cleared', {
          undo: async () => {
            await send('save_allowlist', { name: 'Scratchpad', entries: backup });
            state = await send('get_state');
            renderAllowlists();
            renderEntries();
            toast('Restored');
          },
        });
        return;
      }

      await send('delete_allowlist', name);
      state = await send('get_state');
      if (!state) return;
      renderAllowlists();
      renderEntries();
      dlg.classList.add('hidden');
      toast('List deleted', {
        undo: async () => {
          await send('save_allowlist', { name, entries: backup });
          await send('set_current', name);
          state = await send('get_state');
          renderAllowlists();
          renderEntries();
          toast('Restored');
        },
        duration: 5000,
      });
    } catch {
      toast('Error deleting list', { type: 'error' });
    } finally {
      setLoading(btn, false);
    }
  };
}

// ── Input name modal (returns Promise<string|null>) ─────────────────────────

function askForName(title = 'Name', defaultValue = '') {
  return new Promise((resolve) => {
    const modal = $('#input-name-modal');
    const titleEl = $('#input-name-title');
    const input = $('#input-name-value');
    const form = $('#input-name-form');

    titleEl.textContent = title;
    input.value = defaultValue || '';
    modal.classList.remove('hidden');
    setTimeout(() => {
      input.focus();
      input.select();
    }, 100);

    const cleanup = () => {
      $('#input-name-save').onclick = null;
      $('#input-name-cancel').onclick = null;
      $('#input-name-close').onclick = null;
      form.onsubmit = null;
    };

    const onSave = () => {
      const v = input.value.trim();
      cleanup();
      modal.classList.add('hidden');
      resolve(v || null);
    };

    const onCancel = () => {
      cleanup();
      modal.classList.add('hidden');
      resolve(null);
    };

    $('#input-name-save').onclick = onSave;
    $('#input-name-cancel').onclick = onCancel;
    $('#input-name-close').onclick = onCancel;

    form.onsubmit = (e) => {
      e.preventDefault();
      onSave();
    };
  });
}

// ── Input classifier chip ──────────────────────────────────────────────────

async function updateTypeChip() {
  const input = $('#add-input');
  const chip = $('#type-chip');
  const text = input.value.trim();
  if (!text) {
    chip.textContent = 'Type';
    chip.classList.remove('has-type');
    return;
  }
  const r = await send('classify_input', text);
  const entry = r?.entry;
  if (entry) {
    chip.textContent = entry.type.charAt(0).toUpperCase() + entry.type.slice(1);
    chip.classList.add('has-type');
  } else {
    chip.textContent = '?';
    chip.classList.remove('has-type');
  }
}

// ── Sync toggle ────────────────────────────────────────────────────────────

function syncToggle() {
  $('#enabled-toggle').checked = state?.enabled ?? true;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Add entry form ─────────────────────────────────────────────────────────

$('#add-entry-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('#add-btn');
  const input = $('#add-input');
  setLoading(btn, true);
  try {
    const r = await send('classify_input', input.value.trim());
    const entry = r?.entry;
    if (!entry) {
      toast('Invalid entry format', { type: 'error' });
      return;
    }
    const res = await send('add_entry_current', entry);
    if (!res?.ok) {
      toast('Failed to add entry', { type: 'error' });
      return;
    }
    state = await send('get_state');
    if (!state) return;
    renderEntries();
    input.value = '';
    updateTypeChip();
    toast(res.isDuplicate ? 'Already in list' : 'Added');
  } catch {
    toast('Error adding entry', { type: 'error' });
  } finally {
    setLoading(btn, false);
    input.focus();
  }
});

$('#add-input').addEventListener('input', updateTypeChip);

// ── Quick add site ─────────────────────────────────────────────────────────

$('#quick-add-site').addEventListener('click', async () => {
  const btn = $('#quick-add-site');
  setLoading(btn, true);
  try {
    const [tab] = await queryTabs({ active: true, currentWindow: true });
    if (!tab?.url) { toast('No active tab', { type: 'error' }); return; }
    const u = new URL(tab.url);
    u.hash = '';
    const entry = { type: 'url', value: `${u.protocol}//${u.host}${u.pathname}${u.search}` };
    const r = await send('add_entry_current', entry);
    if (!r?.ok) { toast('Failed to add', { type: 'error' }); return; }
    state = await send('get_state');
    if (!state) return;
    renderEntries();
    toast(r.isDuplicate ? 'Already in list' : `Added ${u.host}`);
  } catch {
    toast('Error adding site', { type: 'error' });
  } finally {
    setLoading(btn, false);
  }
});

// ── Quick add domain ───────────────────────────────────────────────────────

$('#quick-add-domain').addEventListener('click', async () => {
  const btn = $('#quick-add-domain');
  setLoading(btn, true);
  try {
    const [tab] = await queryTabs({ active: true, currentWindow: true });
    if (!tab?.url) { toast('No active tab', { type: 'error' }); return; }
    const host = new URL(tab.url).hostname;
    const parts = host.split('.').filter(Boolean);
    let domain = host;
    if (parts.length > 2) {
      const twoLevel = new Set([
        'co.uk', 'com.au', 'co.jp', 'co.in', 'com.br',
        'co.kr', 'com.sg', 'com.cn', 'com.tw', 'com.mx', 'co.za',
      ]);
      const last2 = parts.slice(-2).join('.');
      domain = twoLevel.has(last2) ? parts.slice(-3).join('.') : last2;
    }
    const r = await send('add_entry_current', { type: 'domain', value: domain });
    if (!r?.ok) { toast('Failed to add', { type: 'error' }); return; }
    state = await send('get_state');
    if (!state) return;
    renderEntries();
    toast(r.isDuplicate ? 'Already in list' : `Added ${domain}`);
  } catch {
    toast('Error adding domain', { type: 'error' });
  } finally {
    setLoading(btn, false);
  }
});

// ── New list ───────────────────────────────────────────────────────────────

$('#new-list-btn').addEventListener('click', async () => {
  const btn = $('#new-list-btn');
  setLoading(btn, true);
  try {
    const name = await askForName('New list name');
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    const s = await send('get_state');
    if (!s) { toast('Failed to check lists', { type: 'error' }); return; }
    if (s.allowlists[trimmed]) { toast('List already exists', { type: 'error' }); return; }

    await send('save_allowlist', { name: trimmed, entries: [] });
    await send('set_current', trimmed);
    state = await send('get_state');
    if (!state) return;
    renderAllowlists();
    renderEntries();
    toast(`Created "${trimmed}"`);
  } catch {
    toast('Error creating list', { type: 'error' });
  } finally {
    setLoading(btn, false);
  }
});

// ── Toggle enabled ─────────────────────────────────────────────────────────

$('#enabled-toggle').addEventListener('change', async () => {
  try {
    await send('set_enabled', $('#enabled-toggle').checked);
    state = await send('get_state');
  } catch {
    toast('Error updating', { type: 'error' });
  }
});

// ── Dark mode toggle ───────────────────────────────────────────────────────

$('#dark-mode-toggle').addEventListener('click', toggleDarkMode);

// ── Close modals on background click ───────────────────────────────────────

$$('.modal').forEach((modal) => {
  const bg = modal.querySelector('.modal-bg');
  if (bg) {
    bg.addEventListener('click', () => modal.classList.add('hidden'));
  }
});

// ── Keyboard: Escape closes modals ─────────────────────────────────────────

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    $$('.modal').forEach((m) => {
      if (!m.classList.contains('hidden')) m.classList.add('hidden');
    });
    closeDropdown();
  }
});

// ── Keyboard: Up/Down arrows navigate list dropdown ────────────────────────

document.addEventListener('keydown', (e) => {
  const menu = $('#list-select-menu');
  if (menu.classList.contains('hidden')) return;

  const items = $$('.custom-select-item', menu);
  if (items.length === 0) return;

  const focused = document.activeElement;
  const idx = items.indexOf(focused);

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const next = (idx + 1) % items.length;
    items[next].focus();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    const prev = idx <= 0 ? items.length - 1 : idx - 1;
    items[prev].focus();
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (focused?.classList?.contains('custom-select-item')) {
      focused.click();
    }
  }
});

// ── Boot ───────────────────────────────────────────────────────────────────

init();
