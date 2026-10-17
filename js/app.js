/* Rank Ledger — main app */
(function () {
  const state = {
    session: null,
    authMode: "signin",
    email: "",
    password: "",
    authError: "",
    authBusy: false,
    entries: null,
    tags: [],
    loading: true,
    query: "",
    filterTagId: null,
    expandedId: null,
    showAddForm: false,
    showTagManager: false,
    newTagName: "",
    logDrafts: {},
    notesDrafts: {},
    saveError: "",
    confirmDeleteId: null,
    newKeyword: "",
    newDomain: "",
    newEngine: "Google",
    newPosition: "",
    newDate: RL.todayISO(),
    newNotes: "",
    newTagIds: [],
    editTagIds: {}
  };

  function rerender() {
    const active = document.activeElement;
    const activeId = active && active.id;
    const selStart = active && "selectionStart" in active ? active.selectionStart : null;
    const selEnd = active && "selectionEnd" in active ? active.selectionEnd : null;
    doRender();
    if (activeId) {
      const el = document.getElementById(activeId);
      if (el) {
        el.focus();
        if (selStart != null && el.setSelectionRange) {
          try {
            el.setSelectionRange(selStart, selEnd);
          } catch (e) {}
        }
      }
    }
  }

  function doRender() {
    const app = document.getElementById("app");
    if (window.rlConfigError) {
      app.innerHTML = renderSetup();
      return;
    }
    if (!state.session) {
      app.innerHTML = renderAuth();
      bindAuth();
      return;
    }
    app.innerHTML = renderLedger();
    bindLedger();
  }

  function renderSetup() {
    return `<div class="auth-shell">
      <div class="auth-card">
        <div class="auth-brand">
          <div class="brand-mark">R</div>
          <div class="eyebrow">Rank Ledger</div>
          <h1 class="display-title">Almost ready</h1>
          <p class="muted" style="font-size:15px;margin:12px 0 0;line-height:1.45">Connect a free Supabase project to enable team accounts.</p>
        </div>
        <div class="banner-setup">
          <ol style="margin:0;padding-left:18px;font-size:14px;line-height:1.7;color:var(--ink)">
            <li>Create a project at <strong>supabase.com</strong></li>
            <li>Run <code>sql/schema.sql</code> in the SQL Editor</li>
            <li>Paste URL + anon key into <code>js/config.js</code></li>
            <li>Host this folder on Cloudflare Pages, Netlify, or GitHub Pages</li>
          </ol>
          <p class="muted" style="font-size:12px;margin:16px 0 0">Full steps are in README.md</p>
        </div>
        <p class="footer-credit" style="border:none;margin-top:24px;padding:0">Built by Alok Roy, SEO Expert</p>
      </div>
    </div>`;
  }

  function renderAuth() {
    const isSignIn = state.authMode === "signin";
    return `<div class="auth-shell">
      <div class="auth-card">
        <div class="auth-brand">
          <div class="brand-mark">R</div>
          <div class="eyebrow">Rank Ledger</div>
          <h1>Track ranks as a team</h1>
          <p class="muted" style="font-size:15px;margin:12px 0 0;line-height:1.45">Each person gets their own account and private ledger.</p>
        </div>
        <div class="auth-panel">
          <div class="auth-toggle">
            <button type="button" data-action="auth-mode" data-mode="signin" class="${isSignIn ? "is-active" : ""}">Sign in</button>
            <button type="button" data-action="auth-mode" data-mode="signup" class="${!isSignIn ? "is-active" : ""}">Sign up</button>
          </div>
          <div class="stack-gap">
            <div>
              <label class="field-label" for="auth-email">Email</label>
              <input id="auth-email" class="field" type="email" autocomplete="email" value="${RL.esc(state.email)}" data-bind="email" placeholder="you@company.com" />
            </div>
            <div>
              <label class="field-label" for="auth-password">Password</label>
              <input id="auth-password" class="field" type="password" autocomplete="${isSignIn ? "current-password" : "new-password"}" value="${RL.esc(state.password)}" data-bind="password" placeholder="At least 6 characters" data-enter="auth-submit" />
            </div>
            ${state.authError ? `<p class="error-text">${RL.esc(state.authError)}</p>` : ""}
            <button type="button" class="btn-primary" style="width:100%" data-action="auth-submit" ${state.authBusy || !state.email.trim() || !state.password ? "disabled" : ""}>
              ${state.authBusy ? "Please wait…" : isSignIn ? "Sign in" : "Create account"}
            </button>
          </div>
        </div>
        <p class="footer-credit" style="border:none;margin-top:24px;padding:0">Built by Alok Roy, SEO Expert</p>
      </div>
    </div>`;
  }

  function bindAuth() {
    document.querySelectorAll("[data-bind]").forEach((el) => {
      el.addEventListener("input", (e) => {
        state[el.dataset.bind] = e.target.value;
        if (state.authError) state.authError = "";
        rerender();
      });
    });
    document.querySelectorAll('[data-action="auth-mode"]').forEach((el) => {
      el.addEventListener("click", () => {
        state.authMode = el.dataset.mode;
        state.authError = "";
        rerender();
      });
    });
    const submit = () => submitAuth();
    const btn = document.querySelector('[data-action="auth-submit"]');
    if (btn) btn.addEventListener("click", submit);
    document.querySelectorAll("[data-enter='auth-submit']").forEach((el) => {
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") submit();
      });
    });
  }

  async function submitAuth() {
    if (state.authBusy) return;
    state.authBusy = true;
    state.authError = "";
    rerender();
    try {
      if (state.authMode === "signin") {
        await RL.auth.signIn(state.email.trim(), state.password);
      } else {
        const data = await RL.auth.signUp(state.email.trim(), state.password);
        if (data.user && !data.session) {
          state.authError =
            "Account created. Check your email to confirm, then sign in. (Or disable email confirm in Supabase Auth settings for a private team.)";
          state.authMode = "signin";
        }
      }
      state.password = "";
    } catch (err) {
      state.authError = err.message || "Authentication failed.";
    } finally {
      state.authBusy = false;
      rerender();
    }
  }

  function getStats() {
    if (!state.entries) return { total: 0, up: 0, down: 0, flat: 0 };
    let up = 0,
      down = 0,
      flat = 0;
    state.entries.forEach((e) => {
      const t = RL.getTrend(e.history);
      if (t.direction === "up") up++;
      else if (t.direction === "down") down++;
      else flat++;
    });
    return { total: state.entries.length, up, down, flat };
  }

  function getFiltered() {
    if (!state.entries) return [];
    const q = state.query.trim().toLowerCase();
    let list = state.entries;
    if (state.filterTagId) {
      list = list.filter((e) => (e.tagIds || []).includes(state.filterTagId));
    }
    if (q) {
      list = list.filter(
        (e) =>
          e.keyword.toLowerCase().includes(q) ||
          e.domain.toLowerCase().includes(q) ||
          (e.notes || "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const aLast = RL.sortedHistory(a.history).slice(-1)[0]?.date || "";
      const bLast = RL.sortedHistory(b.history).slice(-1)[0]?.date || "";
      return bLast.localeCompare(aLast);
    });
  }

  function tagName(id) {
    const t = state.tags.find((x) => x.id === id);
    return t ? t.name : "";
  }

  function renderTrendBadge(direction, delta) {
    if (direction === "flat") {
      return `<span class="trend-badge" style="color:var(--flat)">${RL.icon("minus", 13, "var(--flat)")} no change</span>`;
    }
    const up = direction === "up";
    const color = up ? "var(--rise)" : "var(--fall)";
    const label = `${delta} spot${delta > 1 ? "s" : ""} ${up ? "up" : "down"}`;
    return `<span class="trend-badge" style="color:${color}">${RL.icon(up ? "trendingUp" : "trendingDown", 13, color)} ${label}</span>`;
  }

  function renderPositionStamp(position, direction) {
    const cls =
      direction === "up" ? "is-up" : direction === "down" ? "is-down" : "";
    return `<div class="position-stamp ${cls}"><span>${position == null ? "—" : "#" + position}</span></div>`;
  }

  function renderConfirm() {
    if (!state.confirmDeleteId) return "";
    return `<div class="confirm-backdrop" data-action="cancel-delete">
      <div class="confirm-dialog" role="dialog" aria-modal="true">
        <h3>Remove keyword?</h3>
        <p class="muted" style="font-size:14px;margin:0">This deletes its rank history too. This cannot be undone.</p>
        <div class="confirm-actions">
          <button type="button" class="btn-teal" style="background:var(--fall)" data-action="confirm-delete">Remove</button>
          <button type="button" class="btn-secondary" data-action="cancel-delete">Cancel</button>
        </div>
      </div>
    </div>`;
  }

  function renderLedger() {
    const filtered = getFiltered();
    const stats = getStats();
    const email = state.session?.user?.email || "Account";
    const series = RL.buildDashboardSeries(state.entries || [], 30);

    let dashboard = "";
    if (!state.loading && state.entries && state.entries.length > 0) {
      dashboard = `<section class="dash-grid" aria-label="Dashboard">
        <div class="metric-board">
          <div class="metric-cell">
            <div class="label">Tracked</div>
            <div class="value">${stats.total}</div>
            <div class="hint">keywords in ledger</div>
          </div>
          <div class="metric-cell is-rise">
            <div class="label">Rising</div>
            <div class="value">${stats.up}</div>
            <div class="hint">improved since last log</div>
          </div>
          <div class="metric-cell is-fall">
            <div class="label">Falling</div>
            <div class="value">${stats.down}</div>
            <div class="hint">dropped since last log</div>
          </div>
          <div class="metric-cell is-flat">
            <div class="label">Steady</div>
            <div class="value">${stats.flat}</div>
            <div class="hint">no change</div>
          </div>
        </div>
        <div class="chart-panel">
          <div class="chart-panel-head">
            <h2>Rank movement</h2>
            <span class="period">Last 30 days</span>
          </div>
          ${RL.renderDashboardChart(series)}
        </div>
      </section>`;
    }

    let addForm = "";
    if (state.showAddForm) {
      const addDisabled =
        !state.newKeyword.trim() ||
        !state.newDomain.trim() ||
        state.newPosition === "";
      const tagChecks = state.tags
        .map(
          (t) => `<label><input type="checkbox" data-action="new-tag-toggle" data-id="${t.id}" ${state.newTagIds.includes(t.id) ? "checked" : ""}/> ${RL.esc(t.name)}</label>`
        )
        .join("");
      addForm = `<div class="panel add-panel">
        <div class="eyebrow" style="margin-bottom:14px">New keyword</div>
        <div class="add-form-grid">
          <div>
            <label class="field-label" for="input-newkeyword">Keyword</label>
            <input id="input-newkeyword" class="field" value="${RL.esc(state.newKeyword)}" placeholder="e.g. best hiking boots" data-bind="newKeyword" />
          </div>
          <div>
            <label class="field-label" for="input-newdomain">Domain / URL</label>
            <input id="input-newdomain" class="field" value="${RL.esc(state.newDomain)}" placeholder="e.g. example.com" data-bind="newDomain" />
          </div>
          <div>
            <label class="field-label" for="select-newengine">Search engine</label>
            <select id="select-newengine" class="field" data-bind="newEngine">
              ${["Google", "Bing", "DuckDuckGo", "Other"]
                .map(
                  (o) =>
                    `<option ${state.newEngine === o ? "selected" : ""}>${o}</option>`
                )
                .join("")}
            </select>
          </div>
          <div class="inline-row" style="align-items:stretch">
            <div style="flex:1">
              <label class="field-label" for="input-newposition">Starting position</label>
              <input id="input-newposition" class="field" type="number" min="1" value="${RL.esc(state.newPosition)}" placeholder="e.g. 14" data-bind="newPosition" />
            </div>
            <div style="flex:1">
              <label class="field-label" for="input-newdate">Date</label>
              <input id="input-newdate" class="field" type="date" value="${RL.esc(state.newDate)}" data-bind="newDate" />
            </div>
          </div>
          <div style="grid-column:1/-1">
            <label class="field-label" for="input-newnotes">Notes (optional)</label>
            <textarea id="input-newnotes" class="notes-area" data-bind="newNotes" placeholder="Why this keyword matters…">${RL.esc(state.newNotes)}</textarea>
          </div>
          ${
            state.tags.length
              ? `<div style="grid-column:1/-1"><span class="field-label">Tags</span><div class="check-row">${tagChecks}</div></div>`
              : ""
          }
        </div>
        <button type="button" class="btn-primary" data-action="add-keyword" ${addDisabled ? "disabled" : ""}>Add to ledger</button>
      </div>`;
    }

    let tagBar = "";
    if (!state.loading && (state.tags.length > 0 || state.entries?.length > 0)) {
      const chips = [
        `<button type="button" class="tag-chip ${!state.filterTagId ? "is-active" : ""}" data-action="filter-tag" data-id="">All</button>`,
        ...state.tags.map(
          (t) =>
            `<button type="button" class="tag-chip ${state.filterTagId === t.id ? "is-active" : ""}" data-action="filter-tag" data-id="${t.id}">${RL.esc(t.name)}</button>`
        )
      ].join("");
      tagBar = `<div class="tag-filter-row">
        ${RL.icon("tag", 14, "var(--teal)")}
        ${chips}
        <button type="button" class="tag-chip" data-action="toggle-tag-manager">${state.showTagManager ? "Close tags" : "Manage tags"}</button>
      </div>`;
      if (state.showTagManager) {
        tagBar += `<div class="panel add-panel" style="margin-top:4px;margin-bottom:0;padding:16px 18px">
          <div class="inline-row">
            <div style="flex:1;min-width:160px">
              <label class="field-label" for="input-newtag">New tag / project</label>
              <input id="input-newtag" class="field" value="${RL.esc(state.newTagName)}" placeholder="e.g. Client A" data-bind="newTagName" data-enter="create-tag" />
            </div>
            <button type="button" class="btn-teal" data-action="create-tag" ${!state.newTagName.trim() ? "disabled" : ""}>Add tag</button>
          </div>
        </div>`;
      }
    }

    let searchBar = "";
    if (!state.loading && state.entries && state.entries.length > 0) {
      searchBar = `<div class="search-wrap">
        <span class="icon">${RL.icon("search", 15, "var(--ink-soft)")}</span>
        <input id="input-query" value="${RL.esc(state.query)}" placeholder="Filter by keyword, domain, or notes" data-bind="query" />
      </div>`;
    }

    let rows = "";
    if (!state.loading && filtered.length > 0) {
      rows = `<div class="ledger-list">${filtered
        .map((entry, i) => {
          const trend = RL.getTrend(entry.history);
          const pos = RL.currentPosition(entry.history);
          const best = RL.bestPosition(entry.history);
          const expanded = state.expandedId === entry.id;
          const draft = state.logDrafts[entry.id] || {
            position: "",
            date: RL.todayISO()
          };
          const notesDraft =
            state.notesDrafts[entry.id] != null
              ? state.notesDrafts[entry.id]
              : entry.notes || "";
          const selectedTags =
            state.editTagIds[entry.id] != null
              ? state.editTagIds[entry.id]
              : entry.tagIds || [];
          const logDisabled = draft.position === "";

          let expandedBlock = "";
          if (expanded) {
            const historyRows = RL.sortedHistory(entry.history)
              .slice()
              .reverse()
              .map(
                (h) =>
                  `<div class="row"><span>${RL.formatDate(h.date)}</span><span>#${h.position}</span></div>`
              )
              .join("");
            const editChecks = state.tags
              .map(
                (t) =>
                  `<label><input type="checkbox" data-action="edit-tag-toggle" data-kid="${entry.id}" data-id="${t.id}" ${selectedTags.includes(t.id) ? "checked" : ""}/> ${RL.esc(t.name)}</label>`
              )
              .join("");

            expandedBlock = `<div class="expand-panel">
              <div class="inline-row" style="margin-bottom:18px">
                <div>
                  <label class="field-label">New position</label>
                  <input id="input-logposition-${entry.id}" class="field" style="width:112px" type="number" min="1" value="${RL.esc(draft.position)}" placeholder="e.g. 9" data-action="log-draft-position" data-id="${entry.id}" />
                </div>
                <div>
                  <label class="field-label">Date</label>
                  <input id="input-logdate-${entry.id}" class="field" type="date" value="${RL.esc(draft.date)}" data-action="log-draft-date" data-id="${entry.id}" />
                </div>
                <button type="button" class="btn-teal" data-action="log-position" data-id="${entry.id}" ${logDisabled ? "disabled" : ""}>${RL.icon("calendarPlus", 15)} Log entry</button>
                <button type="button" class="btn-danger-ghost" style="margin-left:auto" data-action="ask-delete" data-id="${entry.id}">${RL.icon("trash2", 15)} Remove</button>
              </div>
              <div style="margin-bottom:18px">
                <label class="field-label" for="notes-${entry.id}">Notes</label>
                <textarea id="notes-${entry.id}" class="notes-area" data-action="notes-draft" data-id="${entry.id}">${RL.esc(notesDraft)}</textarea>
                <button type="button" class="btn-ghost-border" style="margin-top:10px" data-action="save-notes" data-id="${entry.id}">Save notes</button>
              </div>
              ${
                state.tags.length
                  ? `<div style="margin-bottom:18px"><span class="field-label">Tags</span><div class="check-row" style="margin-bottom:10px">${editChecks}</div>
                    <button type="button" class="btn-ghost-border" data-action="save-tags" data-id="${entry.id}">Save tags</button></div>`
                  : ""
              }
              <div class="eyebrow" style="margin-bottom:8px">History</div>
              <div class="history-list">${historyRows}</div>
            </div>`;
          }

          const tagLabels = (entry.tagIds || [])
            .map((id) => tagName(id))
            .filter(Boolean)
            .map((n) => `<span class="tag-badge">${RL.esc(n)}</span>`)
            .join("");

          const trendClass =
            trend.direction === "up"
              ? "is-up"
              : trend.direction === "down"
                ? "is-down"
                : "";

          return `<div class="ledger-item">
            <div class="ledger-row ${trendClass}" data-action="toggle-expand" data-id="${entry.id}">
              ${renderPositionStamp(pos, trend.direction)}
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                  <span class="kw-title">${RL.esc(entry.keyword)}</span>
                  <span class="engine-badge">${RL.esc(entry.engine)}</span>
                  ${tagLabels}
                </div>
                <div class="kw-meta">
                  ${RL.esc(entry.domain)} · best #${best} · ${entry.history.length} log${entry.history.length === 1 ? "" : "s"}
                </div>
                ${renderTrendBadge(trend.direction, trend.delta)}
              </div>
              <div class="spark-hide-mobile">${RL.renderSparkline(entry.history, trend.direction)}</div>
              <span style="padding:6px;flex-shrink:0;color:var(--ink-faint)">${RL.icon(expanded ? "chevronUp" : "chevronDown", 18)}</span>
            </div>
            ${expandedBlock}
          </div>`;
        })
        .join("")}</div>`;
    }

    return `<div class="app-frame">
      <header class="top-nav">
        <div class="top-nav-brand">
          <div class="mark">R</div>
          <div>
            <div class="name">Rank Ledger</div>
            <div class="sub">Private SEO tracker</div>
          </div>
        </div>
        <div class="top-nav-actions">
          <div class="user-chip" title="${RL.esc(email)}">
            <span class="avatar">${RL.icon("user", 13, "var(--teal-deep)")}</span>
            <span>${RL.esc(email)}</span>
          </div>
          <button type="button" class="btn-secondary" data-action="sign-out">${RL.icon("logOut", 13)} Sign out</button>
        </div>
      </header>

      <div class="page-hero">
        <div>
          <div class="eyebrow">Dashboard</div>
          <h1 class="display-title">Your ledger</h1>
          <p>Log positions manually, watch trends, and keep every keyword organized by project.</p>
        </div>
        <button type="button" class="btn-primary" data-action="toggle-add-form">
          ${RL.icon(state.showAddForm ? "x" : "plus", 16)} ${state.showAddForm ? "Cancel" : "Track a keyword"}
        </button>
      </div>

      ${dashboard}
      ${addForm}
      <div class="toolbar">
        ${tagBar}
        ${searchBar}
      </div>
      ${state.saveError ? `<div class="banner-error">${RL.esc(state.saveError)}</div>` : ""}
      ${state.loading ? `<div class="loading-block">Opening your ledger</div>` : ""}
      ${
        !state.loading && state.entries && state.entries.length === 0
          ? `<div class="empty-state">
              <div class="empty-icon">${RL.icon("trendingUp", 22, "var(--teal-deep)")}</div>
              <h2>Nothing logged yet</h2>
              <p class="muted" style="font-size:15px;margin:10px 0 22px;line-height:1.45">Add a keyword and its current position to start your ledger.</p>
              <button type="button" class="btn-primary" data-action="show-add-form">Track your first keyword</button>
            </div>`
          : ""
      }
      ${rows}
      ${
        !state.loading &&
        state.entries &&
        state.entries.length > 0 &&
        filtered.length === 0
          ? `<div class="loading-block">No keywords match your filters</div>`
          : ""
      }
      <div class="footer-credit">Built by Alok Roy, SEO Expert</div>
      ${renderConfirm()}
    </div>`;
  }

  function bindLedger() {
    document.querySelectorAll("[data-bind]").forEach((el) => {
      el.addEventListener(el.tagName === "SELECT" ? "change" : "input", (e) => {
        state[el.dataset.bind] = e.target.value;
        rerender();
      });
    });

    const map = {
      "toggle-add-form": () => {
        state.showAddForm = !state.showAddForm;
        rerender();
      },
      "show-add-form": () => {
        state.showAddForm = true;
        rerender();
      },
      "sign-out": async () => {
        try {
          await RL.auth.signOut();
        } catch (e) {
          state.saveError = e.message || "Could not sign out.";
          rerender();
        }
      },
      "add-keyword": () => addKeyword(),
      "toggle-tag-manager": () => {
        state.showTagManager = !state.showTagManager;
        rerender();
      },
      "create-tag": () => createTag(),
      "cancel-delete": () => {
        state.confirmDeleteId = null;
        rerender();
      },
      "confirm-delete": () => confirmDelete()
    };

    Object.keys(map).forEach((action) => {
      document.querySelectorAll(`[data-action="${action}"]`).forEach((el) => {
        el.addEventListener("click", (e) => {
          if (action === "cancel-delete" && e.target !== el) return;
          e.stopPropagation();
          map[action]();
        });
      });
    });

    const dialog = document.querySelector(".confirm-dialog");
    if (dialog) {
      dialog.addEventListener("click", (e) => e.stopPropagation());
    }

    document.querySelectorAll('[data-action="filter-tag"]').forEach((el) => {
      el.addEventListener("click", () => {
        state.filterTagId = el.dataset.id || null;
        rerender();
      });
    });

    document.querySelectorAll('[data-action="new-tag-toggle"]').forEach((el) => {
      el.addEventListener("change", (e) => {
        e.stopPropagation();
        const id = el.dataset.id;
        if (el.checked) state.newTagIds = [...state.newTagIds, id];
        else state.newTagIds = state.newTagIds.filter((x) => x !== id);
      });
    });

    document.querySelectorAll('[data-action="edit-tag-toggle"]').forEach((el) => {
      el.addEventListener("click", (e) => e.stopPropagation());
      el.addEventListener("change", (e) => {
        e.stopPropagation();
        const kid = el.dataset.kid;
        const id = el.dataset.id;
        const current =
          state.editTagIds[kid] != null
            ? [...state.editTagIds[kid]]
            : [...(state.entries.find((x) => x.id === kid)?.tagIds || [])];
        if (el.checked) {
          if (!current.includes(id)) current.push(id);
        } else {
          const idx = current.indexOf(id);
          if (idx >= 0) current.splice(idx, 1);
        }
        state.editTagIds[kid] = current;
      });
    });

    document.querySelectorAll('[data-action="toggle-expand"]').forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.dataset.id;
        state.expandedId = state.expandedId === id ? null : id;
        rerender();
      });
    });

    document.querySelectorAll('[data-action="ask-delete"]').forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        state.confirmDeleteId = el.dataset.id;
        rerender();
      });
    });

    document.querySelectorAll('[data-action="log-position"]').forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        logPosition(el.dataset.id);
      });
    });

    document.querySelectorAll('[data-action="log-draft-position"]').forEach((el) => {
      el.addEventListener("click", (e) => e.stopPropagation());
      el.addEventListener("input", (e) => {
        const id = el.dataset.id;
        const draft = state.logDrafts[id] || { position: "", date: RL.todayISO() };
        state.logDrafts[id] = { ...draft, position: e.target.value };
        rerender();
      });
    });

    document.querySelectorAll('[data-action="log-draft-date"]').forEach((el) => {
      el.addEventListener("click", (e) => e.stopPropagation());
      el.addEventListener("input", (e) => {
        const id = el.dataset.id;
        const draft = state.logDrafts[id] || { position: "", date: RL.todayISO() };
        state.logDrafts[id] = { ...draft, date: e.target.value };
        rerender();
      });
    });

    document.querySelectorAll('[data-action="notes-draft"]').forEach((el) => {
      el.addEventListener("click", (e) => e.stopPropagation());
      el.addEventListener("input", (e) => {
        state.notesDrafts[el.dataset.id] = e.target.value;
      });
    });

    document.querySelectorAll('[data-action="save-notes"]').forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        saveNotes(el.dataset.id);
      });
    });

    document.querySelectorAll('[data-action="save-tags"]').forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        saveTags(el.dataset.id);
      });
    });

    document.querySelectorAll("[data-enter='create-tag']").forEach((el) => {
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") createTag();
      });
    });
  }

  async function loadLedger() {
    state.loading = true;
    state.saveError = "";
    rerender();
    try {
      const [entries, tags] = await Promise.all([
        RL.db.listKeywordsWithLogs(),
        RL.db.listTags()
      ]);
      state.entries = entries;
      state.tags = tags;
    } catch (err) {
      state.entries = [];
      state.tags = [];
      state.saveError = err.message || "Could not load ledger.";
    } finally {
      state.loading = false;
      rerender();
    }
  }

  async function addKeyword() {
    if (!state.newKeyword.trim() || !state.newDomain.trim() || state.newPosition === "")
      return;
    try {
      const entry = await RL.db.createKeyword({
        keyword: state.newKeyword.trim(),
        domain: state.newDomain.trim(),
        engine: state.newEngine,
        position: state.newPosition,
        date: state.newDate || RL.todayISO(),
        notes: state.newNotes,
        tagIds: state.newTagIds
      });
      state.entries = [entry, ...(state.entries || [])];
      state.newKeyword = "";
      state.newDomain = "";
      state.newPosition = "";
      state.newDate = RL.todayISO();
      state.newNotes = "";
      state.newTagIds = [];
      state.showAddForm = false;
      state.saveError = "";
    } catch (err) {
      state.saveError = err.message || "Could not add keyword.";
    }
    rerender();
  }

  async function logPosition(id) {
    const draft = state.logDrafts[id];
    if (!draft || draft.position === "") return;
    try {
      const log = await RL.db.addRankLog(id, draft.position, draft.date);
      state.entries = (state.entries || []).map((e) =>
        e.id === id ? { ...e, history: [...e.history, log] } : e
      );
      state.logDrafts[id] = { position: "", date: RL.todayISO() };
      state.saveError = "";
    } catch (err) {
      state.saveError = err.message || "Could not log position.";
    }
    rerender();
  }

  async function saveNotes(id) {
    const notes =
      state.notesDrafts[id] != null
        ? state.notesDrafts[id]
        : state.entries.find((e) => e.id === id)?.notes || "";
    try {
      await RL.db.updateKeywordNotes(id, notes);
      state.entries = (state.entries || []).map((e) =>
        e.id === id ? { ...e, notes } : e
      );
      state.saveError = "";
    } catch (err) {
      state.saveError = err.message || "Could not save notes.";
    }
    rerender();
  }

  async function saveTags(id) {
    const tagIds =
      state.editTagIds[id] != null
        ? state.editTagIds[id]
        : state.entries.find((e) => e.id === id)?.tagIds || [];
    try {
      await RL.db.setKeywordTags(id, tagIds);
      state.entries = (state.entries || []).map((e) =>
        e.id === id ? { ...e, tagIds: [...tagIds] } : e
      );
      state.saveError = "";
    } catch (err) {
      state.saveError = err.message || "Could not save tags.";
    }
    rerender();
  }

  async function createTag() {
    const name = state.newTagName.trim();
    if (!name) return;
    try {
      const tag = await RL.db.createTag(name);
      state.tags = [...state.tags, tag].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      state.newTagName = "";
      state.saveError = "";
    } catch (err) {
      state.saveError = err.message || "Could not create tag.";
    }
    rerender();
  }

  async function confirmDelete() {
    const id = state.confirmDeleteId;
    if (!id) return;
    try {
      await RL.db.deleteKeyword(id);
      state.entries = (state.entries || []).filter((e) => e.id !== id);
      state.confirmDeleteId = null;
      if (state.expandedId === id) state.expandedId = null;
      state.saveError = "";
    } catch (err) {
      state.saveError = err.message || "Could not delete keyword.";
      state.confirmDeleteId = null;
    }
    rerender();
  }

  async function boot() {
    doRender();
    if (window.rlConfigError) return;

    RL.auth.onAuthStateChange(async (_event, session) => {
      state.session = session;
      if (session) {
        state.authError = "";
        await loadLedger();
      } else {
        state.entries = null;
        state.tags = [];
        state.loading = false;
        rerender();
      }
    });

    try {
      const session = await RL.auth.getSession();
      state.session = session;
      if (session) await loadLedger();
      else {
        state.loading = false;
        rerender();
      }
    } catch (err) {
      state.authError = err.message || "Could not restore session.";
      rerender();
    }
  }

  boot();
})();
