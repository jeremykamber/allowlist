const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const send = (type, payload) =>
    new Promise((r) => chrome.runtime.sendMessage({ type, payload }, r));

let state = null;

async function init() {
    state = await send("get_state");
    renderAllowlists();
    renderEntries();
    syncToggle();
}

function renderAllowlists() {
    const select = $("#list-select");
    select.innerHTML = "";
    Object.keys(state.allowlists).forEach((name) => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        opt.selected = name === state.current;
        select.appendChild(opt);
    });
    select.addEventListener("change", async () => {
        await send("set_current", select.value);
        state = await send("get_state");
        renderAllowlists();
        renderEntries();
    });
}

function renderEntries() {
    const list = $("#entries");
    const empty = $("#empty-state");
    const entries = state.allowlists[state.current] || [];

    list.innerHTML = "";
    empty.classList.toggle("hidden", entries.length > 0);

    entries.forEach((entry) => {
        const li = document.getElementById("entry-tpl").content.cloneNode(true);
        li.querySelector(".entry-type").textContent = entry.type;
        li.querySelector(".entry-value").textContent = entry.value;

        li.querySelector(".entry-copy").addEventListener("click", async () => {
            await navigator.clipboard.writeText(entry.value);
            toast("Copied");
        });

        li.querySelector(".entry-edit").addEventListener("click", async () => {
            const modal = $("#edit-entry-modal");
            const input = $("#edit-entry-value");
            input.value = entry.value;
            modal.classList.remove("hidden");
            input.focus();
            input.select();

            $("#edit-entry-save").onclick = async () => {
                const newVal = input.value.trim();
                if (!newVal || newVal === entry.value) {
                    modal.classList.add("hidden");
                    return;
                }
                const r = await send("classify_input", newVal);
                if (!r?.entry) {
                    toast("Invalid");
                    return;
                }
                await send("update_entry_current", {
                    from: entry,
                    to: r.entry,
                });
                state = await send("get_state");
                renderEntries();
                modal.classList.add("hidden");
                toast("Updated");
            };

            $("#edit-entry-cancel").onclick = () => {
                modal.classList.add("hidden");
            };
        });

        li.querySelector(".entry-delete").addEventListener(
            "click",
            async () => {
                await send("remove_entry_current", entry);
                state = await send("get_state");
                renderEntries();
                toast("Removed");
            },
        );

        list.appendChild(li);
    });
}

function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.remove("hidden");
    setTimeout(() => el.classList.add("hidden"), 1200);
}

function classify(text) {
    return send("classify_input", text).then((r) => r?.entry || null);
}

function syncToggle() {
    $("#enabled-toggle").checked = state.enabled;
}

// Event listeners

$("#quick-add-site").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
    });
    if (!tab?.url) return;
    try {
        const u = new URL(tab.url);
        u.hash = "";
        const entry = {
            type: "url",
            value: `${u.protocol}//${u.host}${u.pathname}${u.search}`,
        };
        const r = await send("add_entry_current", entry);
        state = await send("get_state");
        renderEntries();
        toast(r?.isDuplicate ? "Already added" : `Added ${u.host}`);
    } catch (e) {
        toast("Error");
    }
});

$("#quick-add-domain").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
    });
    if (!tab?.url) return;
    try {
        const host = new URL(tab.url).hostname;
        const parts = host.split(".").filter(Boolean);
        let domain = host;
        if (parts.length > 2) {
            const twoLevel = new Set([
                "co.uk",
                "com.au",
                "co.jp",
                "co.in",
                "com.br",
                "co.kr",
                "com.sg",
                "com.cn",
                "com.tw",
                "com.mx",
                "co.za",
            ]);
            const last2 = parts.slice(-2).join(".");
            domain = twoLevel.has(last2) ? parts.slice(-3).join(".") : last2;
        }
        const entry = { type: "domain", value: domain };
        const r = await send("add_entry_current", entry);
        state = await send("get_state");
        renderEntries();
        toast(r?.isDuplicate ? "Already added" : `Added ${domain}`);
    } catch (e) {
        toast("Error");
    }
});

$("#add-input").addEventListener("input", async () => {
    const entry = await classify($("#add-input").value);
    const chip = $("#type-chip");
    if (!entry) {
        chip.textContent = "Type";
        chip.style.color = "";
    } else {
        chip.textContent =
            entry.type.charAt(0).toUpperCase() + entry.type.slice(1);
        chip.style.color = "#3b82f6";
    }
});

$("#add-input").addEventListener("keypress", async (e) => {
    if (e.key === "Enter") {
        $("#add-btn").click();
    }
});

$("#add-btn").addEventListener("click", async () => {
    const entry = await classify($("#add-input").value);
    if (!entry) {
        toast("Invalid");
        return;
    }
    $("#add-choice").classList.remove("hidden");

    $("#choice-update").onclick = async () => {
        await send("add_entry_current", entry);
        state = await send("get_state");
        renderEntries();
        $("#add-choice").classList.add("hidden");
        $("#add-input").value = "";
        toast("Added");
    };

    $("#choice-new").onclick = async () => {
        const name = prompt("New list name:");
        if (!name) return;
        const entries = [...(state.allowlists[state.current] || []), entry];
        await send("save_allowlist", { name, entries });
        await send("set_current", name);
        state = await send("get_state");
        renderAllowlists();
        renderEntries();
        $("#add-choice").classList.add("hidden");
        $("#add-input").value = "";
        toast(`Created "${name}"`);
    };

    $("#choice-cancel").onclick = () => {
        $("#add-choice").classList.add("hidden");
    };

    $("#choice-cancel-x").onclick = () => {
        $("#add-choice").classList.add("hidden");
    };
});

// $('#open-settings').addEventListener('click', () => {
//   chrome.runtime.openOptionsPage();
// });

$("#new-list-btn").addEventListener("click", async () => {
    const name = prompt("New list name:");
    if (!name) return;
    const name_trimmed = name.trim();
    if (!name_trimmed) return;
    
    // Check if name already exists
    const state = await send("get_state");
    if (state.allowlists[name_trimmed]) {
        toast("List already exists");
        return;
    }
    
    // Create new list with empty entries
    await send("save_allowlist", { name: name_trimmed, entries: [] });
    await send("set_current", name_trimmed);
    state = await send("get_state");
    renderAllowlists();
    renderEntries();
    toast(`Created "${name_trimmed}"`);
});

$("#enabled-toggle").addEventListener("change", async () => {
    await send("set_enabled", $("#enabled-toggle").checked);
    state = await send("get_state");
});

$("#edit-entry-close").addEventListener("click", () => {
    $("#edit-entry-modal").classList.add("hidden");
});

// Close modals on background click
$$(".modal").forEach((modal) => {
    modal.querySelector(".modal-bg").addEventListener("click", () => {
        modal.classList.add("hidden");
    });
});

init();
