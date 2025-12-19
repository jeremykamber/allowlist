const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

class UIErrorHandler {
	static showError(element, message) {
		element.classList.add('error-state');
		const errorDiv = document.createElement('div');
		errorDiv.className = 'error-message';
		errorDiv.textContent = message;
		element.appendChild(errorDiv);
		setTimeout(() => {
			errorDiv.remove();
			element.classList.remove('error-state');
		}, 4000);
	}

	static showToast(message, type = 'info') {
		const el = $("#toast");
		el.innerHTML = '';
		el.className = `toast ${type}`;
		el.appendChild(document.createTextNode(message));
		el.classList.remove("hidden");
		setTimeout(() => el.classList.add("hidden"), 1200);
	}
}

function setButtonLoading(btn, loading) {
	if (loading) {
		btn.classList.add('loading');
		btn.disabled = true;
	} else {
		btn.classList.remove('loading');
		btn.disabled = false;
	}
}

const runtimeSend = (msg, cb) => {
	try {
		if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) return chrome.runtime.sendMessage(msg, cb);
		if (window.browser && browser.runtime && browser.runtime.sendMessage) return browser.runtime.sendMessage(msg).then(cb).catch(() => cb && cb());
	} catch (e) {
		cb && cb();
	}
};

const send = (type, payload) =>
	new Promise((r) => runtimeSend({ type, payload }, r));

function queryTabs(query) {
	return new Promise((resolve) => {
		try {
			if (window.chrome && chrome.tabs && chrome.tabs.query) return chrome.tabs.query(query, resolve);
			if (window.browser && browser.tabs && browser.tabs.query) return browser.tabs.query(query).then(resolve).catch(() => resolve([]));
		} catch (e) {
			resolve([]);
		}
	});
}

let state = null;

function getTimeGreeting() {
	const hour = new Date().getHours();
	if (hour < 12) return "Good Morning!";
	if (hour < 18) return "Good Afternoon!";
	if (hour < 21) return "Good Evening!";
	return "good night";
}

function initDarkMode() {
	const savedPreference = localStorage.getItem('darkMode');
	if (savedPreference !== null) {
		document.documentElement.setAttribute('data-theme', savedPreference === 'true' ? 'dark' : 'light');
	}
	updateDarkModeButton();
}

function toggleDarkMode() {
	const currentTheme = document.documentElement.getAttribute('data-theme');
	const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
	document.documentElement.setAttribute('data-theme', newTheme);
	localStorage.setItem('darkMode', newTheme === 'dark' ? 'true' : 'false');
	updateDarkModeButton();
}

function updateDarkModeButton() {
	const btn = $("#dark-mode-toggle");
	if (!btn) return;
	const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
	btn.querySelector('.material-symbols-outlined').textContent = isDark ? 'brightness_7' : 'brightness_4';
}

async function init() {
	try {
		initDarkMode();
		state = await send("get_state");
		if (!state) {
			UIErrorHandler.showError($("#content"), "Failed to load settings. Please try refreshing.");
			return;
		}
		const greetingEl = $("#header-greeting");
		greetingEl.textContent = "AllowList";
		renderAllowlists();
		renderEntries();
		syncToggle();
	} catch (e) {
		UIErrorHandler.showError($("#content"), "Initialization error");
	}
}

function renderAllowlists() {
	const wrapper = $("#list-select");
	const btn = $("#list-select-btn");
	const menu = $("#list-select-menu");
	menu.innerHTML = "";
	if (!state || !state.allowlists) return;
	const names = Object.keys(state.allowlists);
	names.forEach((name) => {
		const item = document.createElement('div');
		item.className = 'custom-select-item';
		item.setAttribute('role', 'option');
		item.textContent = name;
		item.dataset.name = name;
		if (name === state.current) item.setAttribute('aria-selected', 'true');
		item.addEventListener('click', async () => {
			try {
				await send('set_current', name);
				state = await send('get_state');
				if (!state) {
					UIErrorHandler.showToast("Failed to update list", "error");
					return;
				}
				renderAllowlists();
				renderEntries();
				menu.classList.add('hidden');
				btn.setAttribute('aria-expanded', 'false');
			} catch (e) {
				UIErrorHandler.showToast("Error switching list", "error");
			}
		});
		menu.appendChild(item);
	});

	btn.textContent = state.current || names[0] || 'AllowList';

	btn.onclick = (e) => {
		const open = !menu.classList.contains('hidden');
		menu.classList.toggle('hidden', open);
		btn.setAttribute('aria-expanded', String(!open));
		if (!open) menu.querySelector('.custom-select-item')?.focus();
	};

	document.addEventListener('click', (ev) => {
		if (!wrapper.contains(ev.target)) {
			menu.classList.add('hidden');
			btn.setAttribute('aria-expanded', 'false');
		}
	});

	const manageBtn = $("#manage-list-btn");
	if (manageBtn) manageBtn.onclick = () => openManageModal();
}

function renderEntries() {
	const list = $("#entries");
	const empty = $("#empty-state");
	if (!state || !state.allowlists || !state.current) {
		empty.classList.remove("hidden");
		list.innerHTML = "";
		return;
	}
	const entries = state.allowlists[state.current] || [];

	list.innerHTML = "";
	empty.classList.toggle("hidden", entries.length > 0);

	entries.forEach((entry) => {
		const li = document.getElementById("entry-tpl").content.cloneNode(true);
		li.querySelector(".entry-type").textContent = entry.type;
		li.querySelector(".entry-value").textContent = entry.value;

		li.querySelector(".entry-copy").addEventListener("click", async () => {
			try {
				await writeClipboard(entry.value);
				toast("Copied");
			} catch (e) {
				toast("Copy failed", "error");
			}
		});

		li.querySelector(".entry-edit").addEventListener("click", async () => {
			const modal = $("#edit-entry-modal");
			const input = $("#edit-entry-value");
			input.value = entry.value;
			modal.classList.remove("hidden");
			input.focus();
			input.select();

			$("#edit-entry-save").onclick = async () => {
				const btn = $("#edit-entry-save");
				setButtonLoading(btn, true);
				try {
					const newVal = input.value.trim();
					if (!newVal || newVal === entry.value) {
						modal.classList.add("hidden");
						return;
					}
					const r = await send("classify_input", newVal);
					if (!r?.entry) {
						toast("Invalid entry format", "error");
						return;
					}
					await send("update_entry_current", {
						from: entry,
						to: r.entry,
					});
					state = await send("get_state");
					if (!state) {
						toast("Failed to update", "error");
						return;
					}
					renderEntries();
					modal.classList.add("hidden");
					toast("Updated");
				} catch (e) {
					toast("Error updating entry", "error");
				} finally {
					setButtonLoading(btn, false);
				}
			};

			$("#edit-entry-cancel").onclick = () => {
				modal.classList.add("hidden");
			};
		});

		li.querySelector(".entry-delete").addEventListener(
			"click",
			async () => {
				try {
					const removed = { ...entry };
					await send("remove_entry_current", entry);
					state = await send("get_state");
					if (!state) {
						toast("Failed to remove", "error");
						return;
					}
					renderEntries();
					toast("Removed", async () => {
						try {
							await send("add_entry_current", removed);
							state = await send("get_state");
							renderEntries();
							toast("Restored");
						} catch (e) {
							toast("Restore failed", "error");
						}
					});
				} catch (e) {
					toast("Error removing entry", "error");
				}
			},
		);

		list.appendChild(li);
	});
}

async function writeClipboard(text) {
	try {
		if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
		const ta = document.createElement('textarea');
		ta.value = text;
		ta.style.position = 'fixed';
		ta.style.left = '-9999px';
		document.body.appendChild(ta);
		ta.focus();
		ta.select();
		document.execCommand('copy');
		ta.remove();
	} catch (e) {
		throw e;
	}
}

function openManageModal() {
	const modal = $("#manage-list-modal");
	const nameEl = $("#manage-current-name");
	const input = $("#manage-rename-input");
	modal.classList.remove('hidden');
	nameEl.textContent = state.current || '';
	input.value = state.current || '';

	$("#manage-rename-save").onclick = async () => {
		const btn = $("#manage-rename-save");
		setButtonLoading(btn, true);
		try {
			const newName = input.value.trim();
			if (!newName || newName === state.current) { modal.classList.add('hidden'); return; }
			await send('rename_allowlist', { from: state.current, to: newName });
			await send('set_current', newName);
			state = await send('get_state');
			if (!state) {
				toast("Failed to rename", "error");
				return;
			}
			renderAllowlists();
			renderEntries();
			modal.classList.add('hidden');
			toast('Renamed');
		} catch (e) {
			toast("Error renaming list", "error");
		} finally {
			setButtonLoading(btn, false);
		}
	};

	$("#manage-save-as").onclick = async () => {
		const btn = $("#manage-save-as");
		setButtonLoading(btn, true);
		try {
			const name = await askForName('Save list as', state.current);
			if (!name) return;
			const entries = [...(state.allowlists[state.current] || [])];
			await send('save_allowlist', { name: name.trim(), entries });
			await send('set_current', name.trim());
			state = await send('get_state');
			if (!state) {
				toast("Failed to save", "error");
				return;
			}
			renderAllowlists();
			renderEntries();
			modal.classList.add('hidden');
			toast(`Saved as "${name.trim()}"`);
		} catch (e) {
			toast("Error saving list", "error");
		} finally {
			setButtonLoading(btn, false);
		}
	};

	$("#manage-delete").onclick = () => {
		modal.classList.add('hidden');
		openConfirmDelete();
	};

	$("#manage-list-close").onclick = () => modal.classList.add('hidden');
}

function openConfirmDelete() {
	const dlg = $("#confirm-delete-modal");
	dlg.classList.remove('hidden');
	$("#confirm-delete-no").onclick = () => dlg.classList.add('hidden');
	$("#confirm-delete-yes").onclick = async () => {
		const btn = $("#confirm-delete-yes");
		setButtonLoading(btn, true);
		try {
			const name = state.current;
			const entriesBackup = [...(state.allowlists[name] || [])];
			if (name === 'Scratchpad') {
				await send('save_allowlist', { name: 'Scratchpad', entries: [] });
				state = await send('get_state');
				if (!state) {
					toast("Failed to clear", "error");
					return;
				}
				renderAllowlists();
				renderEntries();
				dlg.classList.add('hidden');
				toast('Cleared', async () => {
					try {
						await send('save_allowlist', { name: 'Scratchpad', entries: entriesBackup });
						state = await send('get_state');
						renderAllowlists();
						renderEntries();
						toast('Restored');
					} catch (e) {
						toast("Restore failed", "error");
					}
				});
				return;
			}
			await send('delete_allowlist', name);
			state = await send('get_state');
			if (!state) {
				toast("Failed to delete", "error");
				return;
			}
			renderAllowlists();
			renderEntries();
			dlg.classList.add('hidden');
			toast('Deleted', async () => {
				try {
					await send('save_allowlist', { name, entries: entriesBackup });
					await send('set_current', name);
					state = await send('get_state');
					renderAllowlists();
					renderEntries();
					toast('Restored');
				} catch (e) {
					toast("Restore failed", "error");
				}
			});
		} catch (e) {
			toast("Error deleting list", "error");
		} finally {
			setButtonLoading(btn, false);
		}
	};
}

function askForName(title = 'Name', defaultValue = '') {
	return new Promise((resolve) => {
		const modal = $('#input-name-modal');
		const titleEl = $('#input-name-title');
		const input = $('#input-name-value');
		const saveBtn = $('#input-name-save');
		const cancelBtn = $('#input-name-cancel');
		const closeBtn = $('#input-name-close');

		titleEl.textContent = title;
		input.value = defaultValue || '';
		modal.classList.remove('hidden');
		input.focus();
		input.select();

		const cleanup = () => {
			saveBtn.onclick = null;
			cancelBtn.onclick = null;
			closeBtn.onclick = null;
		};

		saveBtn.onclick = () => {
			const v = input.value.trim();
			cleanup();
			modal.classList.add('hidden');
			resolve(v || null);
		};
		cancelBtn.onclick = closeBtn.onclick = () => {
			cleanup();
			modal.classList.add('hidden');
			resolve(null);
		};
	});
}

let toastTimeout = null;

function toast(msg, undoFn = null) {
	const el = $("#toast");
	el.innerHTML = '';
	el.appendChild(document.createTextNode(msg));
	if (undoFn) {
		const btn = document.createElement('button');
		btn.className = 'toast-undo';
		btn.textContent = 'Undo';
		btn.onclick = (e) => {
			e.stopPropagation();
			undoFn();
			el.classList.add('hidden');
			clearTimeout(toastTimeout);
		};
		el.appendChild(btn);
	}
	el.classList.remove("hidden");
	clearTimeout(toastTimeout);
	toastTimeout = setTimeout(() => el.classList.add("hidden"), undoFn ? 4000 : 1200);
}

function classify(text) {
	return send("classify_input", text).then((r) => r?.entry || null);
}

function syncToggle() {
	$("#enabled-toggle").checked = state.enabled;
}

$("#quick-add-site").addEventListener("click", async () => {
	const btn = $("#quick-add-site");
	setButtonLoading(btn, true);
	try {
		const [tab] = await queryTabs({
			active: true,
			currentWindow: true,
		});
		if (!tab?.url) {
			toast("No active tab found", "error");
			return;
		}
		const u = new URL(tab.url);
		u.hash = "";
		const entry = {
			type: "url",
			value: `${u.protocol}//${u.host}${u.pathname}${u.search}`,
		};
		const r = await send("add_entry_current", entry);
		if (!r?.ok) {
			toast("Failed to add site", "error");
			return;
		}
		state = await send("get_state");
		if (!state) {
			toast("Failed to refresh", "error");
			return;
		}
		renderEntries();
		toast(r?.isDuplicate ? "Already added" : `Added ${u.host}`);
	} catch (e) {
		toast("Error adding site", "error");
	} finally {
		setButtonLoading(btn, false);
	}
});

$("#quick-add-domain").addEventListener("click", async () => {
	const btn = $("#quick-add-domain");
	setButtonLoading(btn, true);
	try {
		const [tab] = await queryTabs({
			active: true,
			currentWindow: true,
		});
		if (!tab?.url) {
			toast("No active tab found", "error");
			return;
		}
		const host = new URL(tab.url).hostname;
		const parts = host.split(".").filter(Boolean);
		let domain = host;
		if (parts.length > 2) {
			const twoLevel = new Set([
				"co.uk", "com.au", "co.jp", "co.in", "com.br", "co.kr", "com.sg", "com.cn", "com.tw", "com.mx", "co.za",
			]);
			const last2 = parts.slice(-2).join(".");
			domain = twoLevel.has(last2) ? parts.slice(-3).join(".") : last2;
		}
		const entry = { type: "domain", value: domain };
		const r = await send("add_entry_current", entry);
		if (!r?.ok) {
			toast("Failed to add domain", "error");
			return;
		}
		state = await send("get_state");
		if (!state) {
			toast("Failed to refresh", "error");
			return;
		}
		renderEntries();
		toast(r?.isDuplicate ? "Already added" : `Added ${domain}`);
	} catch (e) {
		toast("Error adding domain", "error");
	} finally {
		setButtonLoading(btn, false);
	}
});

$("#add-input").addEventListener("input", async () => {
	const entry = await classify($("#add-input").value);
	const chip = $("#type-chip");
	if (!entry) {
		chip.textContent = "Type";
		chip.style.color = "";
	} else {
		chip.textContent = entry.type.charAt(0).toUpperCase() + entry.type.slice(1);
		chip.style.color = "#3b82f6";
	}
});

$("#add-input").addEventListener("keypress", async (e) => {
	if (e.key === "Enter") {
		$("#add-btn").click();
	}
});

$("#add-btn").addEventListener("click", async () => {
	const btn = $("#add-btn");
	setButtonLoading(btn, true);
	try {
		const entry = await classify($("#add-input").value);
		if (!entry) {
			toast("Invalid entry format", "error");
			return;
		}
		const r = await send("add_entry_current", entry);
		if (!r?.ok) {
			toast("Failed to add entry", "error");
			return;
		}
		state = await send("get_state");
		if (!state) {
			toast("Failed to refresh", "error");
			return;
		}
		renderEntries();
		$("#add-input").value = "";
		toast(r?.isDuplicate ? "Already added" : "Added");
	} catch (e) {
		toast("Error adding entry", "error");
	} finally {
		setButtonLoading(btn, false);
	}
});

$("#new-list-btn").addEventListener("click", async () => {
	const btn = $("#new-list-btn");
	setButtonLoading(btn, true);
	try {
		const name = await askForName('New list name');
		if (!name) return;
		const name_trimmed = name.trim();
		if (!name_trimmed) return;

		const currentState = await send("get_state");
		if (!currentState) {
			toast("Failed to check existing lists", "error");
			return;
		}
		if (currentState.allowlists[name_trimmed]) {
			toast("List already exists", "error");
			return;
		}

		await send("save_allowlist", { name: name_trimmed, entries: [] });
		await send("set_current", name_trimmed);
		state = await send("get_state");
		if (!state) {
			toast("Failed to create list", "error");
			return;
		}
		renderAllowlists();
		renderEntries();
		toast(`Created "${name_trimmed}"`);
	} catch (e) {
		toast("Error creating list", "error");
	} finally {
		setButtonLoading(btn, false);
	}
});

$("#enabled-toggle").addEventListener("change", async () => {
	try {
		await send("set_enabled", $("#enabled-toggle").checked);
		state = await send("get_state");
		if (!state) {
			toast("Failed to update setting", "error");
		}
	} catch (e) {
		toast("Error updating setting", "error");
	}
});

$("#edit-entry-close").addEventListener("click", () => {
	$("#edit-entry-modal").classList.add("hidden");
});

$("#dark-mode-toggle").addEventListener("click", () => {
	toggleDarkMode();
});

$$(".modal").forEach((modal) => {
	modal.querySelector(".modal-bg").addEventListener("click", () => {
		modal.classList.add("hidden");
	});
});

init();
