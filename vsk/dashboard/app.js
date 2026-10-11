// VSK dashboard client: project launcher, live terminal and the project views (cycle, ontology, VSK,
// git, architecture, repository), rendered from the state pushed by `vsk dashboard` over Server-Sent Events.
"use strict";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const STAGES = ["propose", "tdd", "implement", "refactor", "verify", "merge", "archive"];
const STATUS = { pass: "PASA", fail: "FALLA", skip: "OMITE", pending: "PENDIENTE", indeterminate: "INCIERTO", running: "EN CURSO", nodata: "SIN DATOS" };
const LIGHT = { rojo: "ROJO", "rojo-real": "ROJO REAL", verde: "VERDE", roto: "ROTO", pendiente: "PENDIENTE", "sin-test": "SIN TEST", "no-ejecutado": "SIN EJECUTAR" };
const VIEWS = [
  { id: "ciclo", label: "Ciclo" }, { id: "ontologia", label: "Ontología" }, { id: "slicesystem", label: "VSK" },
  { id: "git", label: "Git" }, { id: "arquitectura", label: "Arquitectura" }, { id: "repositorio", label: "Repositorio" },
];
const mmss = (t) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
const fmtMs = (ms) => (ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`);
const tilde = (p) => String(p ?? "").replace(/^\/Users\/[^/]+|^\/home\/[^/]+/, "~");
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};

// per-run token from the URL printed by `vsk dashboard`; hidden from the address bar for screen sharing
const TOKEN = new URLSearchParams(location.search).get("t") || sessionStorage.getItem("slice-token") || "";
if (TOKEN) { sessionStorage.setItem("slice-token", TOKEN); history.replaceState(null, "", "/"); }
const withToken = (path) => `${path}${path.includes("?") ? "&" : "?"}t=${encodeURIComponent(TOKEN)}`;
async function api(path, data) {
  const r = await fetch(withToken(path), data === undefined ? {} : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
  const out = r.headers.get("content-type")?.includes("json") ? await r.json() : await r.text();
  if (!r.ok) throw new Error(out?.error ?? `error ${r.status}`);
  return out;
}

let state = null;
let pinned = null;          // file chosen by the presenter; otherwise the diff follows the latest change
let shownDiff = null;
let focusComponent = null;
let ontoSel = null;
let ontoMode = store.get("slice-onto-mode", "elementos");
const prevStatus = new Map();
const bornAt = new Map();
const knownOnto = new Set();
let ontoSeeded = false;
const ssPrev = new Map();
const ssFlash = new Map();
let ssSeeded = false;

// ---------------------------------------------------------------- theme
const XTERM = {
  dark: {
    background: "#14072B", foreground: "#FFFFFF", cursor: "#AFFC41", cursorAccent: "#14072B", selectionBackground: "rgba(175, 252, 65, 0.28)",
    black: "#090017", brightBlack: "#7F7790", white: "#C7C2D3", brightWhite: "#FFFFFF",
    green: "#AFFC41", brightGreen: "#C8FF7A", red: "#F28B8B", brightRed: "#FFB3B3", yellow: "#F2E27A", brightYellow: "#FFF2A8",
    blue: "#8FA8FF", brightBlue: "#B8C7FF", magenta: "#C79BFF", brightMagenta: "#DDC2FF", cyan: "#7FE3E8", brightCyan: "#B3F2F5",
  },
  light: {
    background: "#F3F3F3", foreground: "#14072B", cursor: "#14072B", cursorAccent: "#F3F3F3", selectionBackground: "rgba(175, 252, 65, 0.6)",
    black: "#14072B", brightBlack: "#7F7790", white: "#7F7790", brightWhite: "#090017",
    green: "#3B6E00", brightGreen: "#2F5A00", red: "#A3324A", brightRed: "#8A1F38", yellow: "#7A5C00", brightYellow: "#5E4600",
    blue: "#2B45B8", brightBlue: "#1F3596", magenta: "#6B2FB8", brightMagenta: "#561F9C", cyan: "#00707A", brightCyan: "#005A62",
  },
};
const theme = () => document.documentElement.dataset.theme === "light" ? "light" : "dark";
$("theme").addEventListener("click", () => {
  const next = theme() === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem("slice-theme", next); } catch { /* private mode */ }
  if (term) term.options.theme = XTERM[next];
  render();
});

// ---------------------------------------------------------------- zones and tabs
let zones = store.get("slice-zones", { a: "ciclo", b: "ontologia" });
if (!VIEWS.some((v) => v.id === zones.a) || !VIEWS.some((v) => v.id === zones.b) || zones.a === zones.b) zones = { a: "ciclo", b: "ontologia" };
const sigs = new Map();
const badges = new Set();
const viewEl = (id) => document.querySelector(`.view[data-view="${id}"]`);

function placeViews() {
  for (const z of ["a", "b"]) {
    const body = document.querySelector(`#zone-${z} .zone-body`);
    const want = viewEl(zones[z]);
    if (body.firstElementChild !== want) {
      if (body.firstElementChild) $("views").appendChild(body.firstElementChild);
      body.appendChild(want);
    }
    badges.delete(zones[z]);
    document.querySelector(`.tabs[data-zone="${z}"]`).innerHTML = VIEWS.map((v) =>
      `<button data-view="${v.id}" class="${v.id === zones[z] ? "on" : ""} ${badges.has(v.id) ? "badge" : ""}">${v.label}</button>`).join("");
  }
}
document.querySelectorAll(".tabs").forEach((nav) => nav.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-view]");
  if (!b) return;
  const z = nav.dataset.zone, other = z === "a" ? "b" : "a", v = b.dataset.view;
  if (zones[other] === v) zones[other] = zones[z]; // a view lives in one zone only: swap
  zones[z] = v;
  store.set("slice-zones", zones);
  placeViews();
  render();
}));

/** Marks a tab whose view changed while it was not on screen. */
function track(view, sig) {
  if (sigs.has(view) && sigs.get(view) !== sig && zones.a !== view && zones.b !== view) badges.add(view);
  sigs.set(view, sig);
}

// ---------------------------------------------------------------- header, start bar and stages
function renderHeader(s) {
  const p = s.screen === "project";
  $("project").textContent = p ? s.project.name : "VSK dashboard";
  $("project-sub").textContent = p ? (s.kit ? "en construcción." : "por preparar.") : "elige un proyecto.";
  document.title = p ? `${s.project.name} · vsk dashboard` : "VSK dashboard";
  $("version").textContent = `VSK ${s.version} · Cloud District`;
  const mode = $("mode");
  if (!p) { mode.className = "mode"; mode.textContent = "○ SIN PROYECTO"; return; }
  $("change").textContent = s.change ?? "esperando actividad";
  $("slice").textContent = s.slice ? `· ${s.slice}` : "";
  mode.className = `mode ${s.mode === "live" ? "live" : ""}`;
  mode.textContent = s.mode === "live" ? "EN VIVO" : s.mode === "replay" ? "REPETICIÓN" : "○ ESPERANDO";
  const idx = STAGES.indexOf(s.monitor.current);
  $("phase-chip").textContent = String(idx >= 0 ? idx + 1 : 0).padStart(2, "0");
  $("stages").innerHTML = STAGES.map((st, i) => {
    const v = s.monitor.stages[st];
    const cls = st === s.monitor.current && v !== "done" && v !== "fail" ? "active" : v;
    return `<div class="stage ${cls}"><span class="n">${String(i + 1).padStart(2, "0")}</span>${st}<span class="mark"></span></div>`;
  }).join("");
}

let startMsg = "";
function renderStartbar(s) {
  const bar = $("startbar");
  const c = s.project;
  const agentFile = c.claude || c.agents;
  const ready = c.git && c.kit && agentFile && c.ontology;
  bar.hidden = ready;
  if (ready) return;
  const chk = (ok, label) => `<span class="${ok ? "ok" : ""}">${ok ? "✓" : "·"} ${label}</span>`;
  $("checks").innerHTML = chk(c.git, "git") + chk(c.kit, !c.kit && c.legacy ? "VSK · migrar" : "VSK") + chk(c.configured, "configurado")
    + chk(agentFile, "CLAUDE.md / AGENTS.md") + chk(c.ontology, "ontología");
  const acts = [];
  if (!c.git || !c.kit || !agentFile) {
    acts.push(`<button class="primary" data-init="claude">Iniciar con Claude Code</button>`, `<button data-init="codex">Iniciar con Codex</button>`);
  } else if (!c.ontology) {
    acts.push(`<button class="primary" data-onto>Definir ontología</button>`);
  }
  $("start-actions").innerHTML = acts.join("") + (startMsg ? `<span class="dim">${esc(startMsg)}</span>` : "");
}
$("start-actions").addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  try {
    if (b.dataset.init) {
      const r = await api("/api/project/init", { agent: b.dataset.init });
      startMsg = `escrito en la terminal: ${r.command}`;
    } else if (b.dataset.onto !== undefined) {
      const ask = "Define la ontología del proyecto con la skill ontology";
      const t = state.terminal;
      const codexOnly = !t?.configured?.find((a) => a.agent === "Claude Code")?.installed && t?.configured?.find((a) => a.agent === "Codex")?.installed;
      await api("/api/terminal/type", { text: t?.agent?.agent ? ask : `${codexOnly ? "codex" : "claude"} "${ask}"` });
      startMsg = "petición enviada a la terminal";
    }
  } catch (err) { startMsg = err.message; }
  render();
  term?.focus();
});

function tick() {
  if (!state?.monitor?.started) return;
  const end = state.mode === "live" ? Date.now() : state.monitor.last ?? state.monitor.started;
  const e = Math.max(0, Math.floor((end - state.monitor.started) / 1000));
  $("clock").textContent = `${String(Math.floor(e / 3600)).padStart(2, "0")}:${mmss(e % 3600)}`;
}

// ---------------------------------------------------------------- terminal status bar
const fmtTok = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} M` : n >= 1e3 ? `${Math.round(n / 1e3)} k` : String(n));

function renderStatusbar(s) {
  const t = s.terminal;
  const parts = [`<span><b>${esc(s.project.name)}</b></span>`, `<span>${esc(tilde(s.project.path))}</span>`];
  if (s.git?.isRepo) parts.push(`<span>⎇ <b>${esc(s.git.branch || "sin commits")}</b></span>`);
  if (t) {
    parts.push(`<span>${esc(t.shell)} · ${t.cols}×${t.rows}</span>`);
    const a = t.agent;
    if (a?.agent) {
      parts.push(`<span><span class="agent">${esc(a.agent)}</span> modelo <b>${esc(a.model ?? "por defecto")}</b>${a.effort ? ` · esfuerzo <b>${esc(a.effort)}</b>` : ""}${a.version ? ` · v${esc(a.version)}` : ""}</span>`);
    } else {
      const conf = (t.configured ?? []).filter((x) => x.installed).map((x) => `${esc(x.agent)}${x.model ? ` (${esc(x.model)})` : ""}`);
      parts.push(`<span>sin agente activo${conf.length ? ` · disponibles: ${conf.join(", ")}` : ""}</span>`);
    }
  }
  if (s.change) parts.push(`<span>${esc(s.change)} · ${s.usage?.tokens ? `<b>${fmtTok(s.usage.tokens)}</b> tokens${s.usage.cost !== null ? ` · <b>${s.usage.cost.toFixed(2)} US$</b>` : ""}` : `<span class="nodata">consumo sin datos</span>`}</span>`);
  $("statusbar").innerHTML = parts.join("");
}

// ---------------------------------------------------------------- cycle
/** Lane contract per change pack. A missing value says «sin datos»; it is never drawn as green. */
function renderLanes(lanes) {
  $("lanes-block").hidden = !lanes?.length;
  if (!lanes?.length) return;
  const none = `<span class="nodata">sin datos</span>`;
  $("lanes").innerHTML = lanes.map((l) => `<li>
    <span class="id" title="${esc(l.missing.join(" · "))}">${esc(l.change)}<small>${esc(l.tier)}</small></span>
    <span class="st ${l.upToDate ? "pass" : "nodata"}">${l.upToDate ? "AL DÍA" : "INCOMPLETA"}</span>
    <span class="v" title="${esc(l.evidence ? `${l.evidence.what}${l.evidence.stale ? ` · antigua: ${l.evidence.stale}` : ""}` : "")}"><span class="k">evidencia</span>${l.evidence ? `${esc(l.evidence.what)}${l.evidence.stale ? " · antigua" : ""}` : none}</span>
    <span class="v" title="${esc(`${l.next.action} · ${l.next.detail}`)}"><span class="k">siguiente</span><span class="mono">${esc(l.next.action)}</span></span>
    <span class="v"><span class="k">consumo</span>${l.usage ? `${fmtTok(l.usage.tokens)}${l.usage.cost !== null ? ` · ${l.usage.cost.toFixed(2)} US$` : ""}` : none}</span>
  </li>`).join("");
}

function renderCycle(m, kit, phaseGates) {
  track("ciclo", `${m.log.length}|${m.current}|${m.step?.text ?? ""}`);
  if (!kit) {
    $("step-text").innerHTML = "El ciclo aparece cuando el proyecto tiene VSK configurado.";
    $("step-detail").textContent = "Pulsa «Iniciar» arriba o ejecuta la skill vsk-setup en la terminal.";
  } else {
    $("step-phase").textContent = m.step?.phase ? `PASO ACTUAL · ${m.step.phase}` : "PASO ACTUAL";
    if (m.step) {
      $("step-text").textContent = m.step.text;
      $("step-detail").textContent = m.step.detail ?? "";
    }
  }
  let gates = m.gates.filter((g) => !m.current || g.phase === m.current || g.status === "running");
  // a stage without gates of its own (archive) shows the last stage that had them
  if (!gates.length && m.gates.length) { const last = m.gates[m.gates.length - 1].phase; gates = m.gates.filter((g) => g.phase === last); }
  // configured gates of the phase that never ran are shown as «sin datos», not left out
  const phase = gates[0]?.phase ?? m.current;
  for (const g of (phaseGates ?? []).filter((x) => x.phase === phase && !gates.some((y) => y.id === x.id)))
    gates.push({ id: g.id, type: g.type, phase: g.phase, status: "nodata" });
  $("gates").innerHTML = gates.length ? gates.map((g) => `<li><span class="name">${esc(g.id)} <span class="dim">· ${esc(g.type)}</span></span>
    <span class="st ${esc(g.status)}">${STATUS[g.status] ?? esc(g.status)}</span><span class="ms">${g.ms !== undefined ? fmtMs(g.ms) : ""}</span></li>`).join("")
    : `<li class="empty">Ningún gate evaluado en esta fase.</li>`;
  $("lights").innerHTML = m.scenarios.length ? m.scenarios.map((x) => `<li><span class="name mono">${esc(x.scenario)}</span>
    <span class="st ${esc(x.light)}">${LIGHT[x.light] ?? esc(x.light)}</span></li>`).join("") : `<li class="empty">Sin semáforo todavía.</li>`;
  $("overall").innerHTML = m.overall ? `Luz del slice: <b>${esc(m.overall)}</b>` : "";
  $("zombies").innerHTML = m.zombies.length ? m.zombies.map((z) => `<li title="${esc(z.reason)}"><span class="name mono">${esc(z.scenario)}</span>
    <span class="st ${z.status === "pass" ? "cazado" : "falla"}">${z.status === "pass" ? "CAZADO" : z.status === "fail" ? "FALLA" : "INCIERTO"}</span></li>`).join("")
    : `<li class="empty">Sin zombis sembrados.</li>`;
  $("note-title").textContent = m.note?.title ? `· ${m.note.title}` : "";
  $("note-text").textContent = m.note?.text ?? "";
  const log = $("log");
  const atBottom = log.scrollTop + log.clientHeight >= log.scrollHeight - 30;
  log.innerHTML = m.log.map((l) => `<li><span class="t">${mmss(l.t)}</span><span class="${esc(l.tone)}">${esc(l.text)}</span></li>`).join("");
  if (atBottom) log.scrollTop = log.scrollHeight;
}

// ---------------------------------------------------------------- ontology
const GROUPS = ["Negocio", "Lenguaje", "Necesidades", "Modelo", "Hechos", "Comportamiento", "Verificación", "Integración"];

/** Lays out nodes in columns by meta group. When the columns do not fit, they split in two bands: the problem
 *  space (business, language, needs, model) on top and the solution space (facts, behaviour, checks) below. */
function columns(items, groupOf, W, nodeW, nodeH, gapY) {
  const groups = GROUPS.filter((g) => items.some((x) => groupOf(x) === g));
  const minCol = nodeW + 44;
  const bands = groups.length > 1 && W / groups.length < minCol ? [groups.slice(0, Math.ceil(groups.length / 2)), groups.slice(Math.ceil(groups.length / 2))] : [groups];
  const perRow = Math.max(...bands.map((b) => b.length));
  const colW = Math.max(minCol, W / Math.max(1, perRow));
  const pos = new Map();
  const heads = [];
  let top = 0;
  bands.forEach((band, bi) => {
    let maxY = top + 34;
    band.forEach((g, gi) => {
      heads.push({ group: g, x: gi * colW, y: top, first: gi === 0 });
      items.filter((x) => groupOf(x) === g).forEach((x, k) => {
        const y = top + 34 + k * (nodeH + gapY);
        pos.set(x.id, { x: gi * colW + (colW - nodeW) / 2, y, col: `${bi}:${gi}`, band: bi });
        maxY = Math.max(maxY, y + nodeH);
      });
    });
    heads.filter((h) => h.y === top).forEach((h) => { h.bottom = maxY + 8; });
    top = maxY + 64;
  });
  return { heads, colW, pos, width: Math.max(W, perRow * colW), height: top - 16 };
}

function columnHeads(L) {
  return L.heads.map((h) => `<text class="col-title" x="${h.x + 12}" y="${h.y + 16}">${esc(h.group)}</text>` +
    (h.first ? (h.y ? `<line class="col-line" x1="0" y1="${h.y - 20}" x2="${L.width}" y2="${h.y - 20}"/>` : "")
      : `<line class="col-line" x1="${h.x}" y1="${h.y}" x2="${h.x}" y2="${h.bottom}"/>`)).join("");
}

function edgePath(p, q, w, h) {
  if (p.col === q.col) {
    // same column: an arc on the right side of the boxes
    const x = p.x + w, y1 = p.y + h / 2, y2 = q.y + h / 2, bulge = 26 + Math.min(60, Math.abs(y2 - y1) / 6);
    return { d: `M${x},${y1} C${x + bulge},${y1} ${x + bulge},${y2} ${x},${y2}`, mx: x + bulge * 0.75, my: (y1 + y2) / 2 };
  }
  if (p.band !== q.band) {
    // between bands: leaves from the bottom or top edge and lands on the other
    const down = q.y > p.y;
    const x1 = p.x + w / 2, y1 = down ? p.y + h : p.y, x2 = q.x + w / 2, y2 = down ? q.y : q.y + h, dy = (y2 - y1) / 2;
    return { d: `M${x1},${y1} C${x1},${y1 + dy} ${x2},${y2 - dy} ${x2},${y2}`, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 };
  }
  if (Math.abs(q.x - p.x) > w * 1.6) {
    // skips a column: dips under the boxes instead of crossing the ones in between
    const x1 = p.x + w / 2, y1 = p.y + h, x2 = q.x + w / 2, y2 = q.y + h, low = Math.max(y1, y2) + 18 + Math.abs(x2 - x1) / 12;
    return { d: `M${x1},${y1} C${x1},${low} ${x2},${low} ${x2},${y2}`, mx: (x1 + x2) / 2, my: 0.125 * (y1 + y2) + 0.75 * low };
  }
  const fwd = q.x > p.x;
  const x1 = fwd ? p.x + w : p.x, x2 = fwd ? q.x : q.x + w, y1 = p.y + h / 2, y2 = q.y + h / 2;
  const dx = Math.max(30, Math.abs(x2 - x1) / 2) * (fwd ? 1 : -1);
  return { d: `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 };
}

function renderOntology(o) {
  const box = $("onto");
  document.querySelectorAll("#onto-mode button").forEach((b) => b.classList.toggle("on", b.dataset.mode === ontoMode));
  if (!o) {
    track("ontologia", "none");
    $("onto-counts").textContent = "";
    $("onto-findings").innerHTML = "";
    box.innerHTML = `<div class="notice">Todavía no hay ontología. Cuando VSK esté instalado, pulsa <b>Definir ontología</b> o pide en la
      terminal <span class="mono">«define la ontología del proyecto»</span>: el agente seguirá el recorrido de Nedgia (dominio, glosario,
      job stories, eventos, slices…) y cada pieza aparecerá aquí con sus relaciones.</div>`;
    return;
  }
  track("ontologia", `${o.elements.length}|${o.edges.length}|${o.findings.length}`);
  const now = Date.now();
  for (const e of o.elements) {
    if (!knownOnto.has(e.id) && ontoSeeded) bornAt.set(`o:${e.id}`, now);
    knownOnto.add(e.id);
  }
  ontoSeeded = true;
  const errors = o.findings.filter((f) => f.level === "error").length;
  const W = Math.max(560, box.clientWidth - 4);
  if (ontoMode === "tipos") renderOntologyTypes(o, box, W);
  else renderOntologyElements(o, box, W, now);
  const selEl = ontoSel && ontoMode === "elementos" ? o.elements.find((x) => x.id === ontoSel) : null;
  const selType = ontoSel && ontoMode === "tipos" ? o.types.find((x) => x.id === ontoSel) : null;
  if (selEl) {
    $("onto-counts").innerHTML = `<b>${esc(selEl.tipo)}</b> · ${esc(selEl.nombre)}${selEl.descripcion ? ` — ${esc(selEl.descripcion)}` : ""}`;
  } else if (selType) {
    $("onto-counts").innerHTML = `<b>${esc(selType.id)}</b> · ${esc(selType.desc)}`;
  } else {
    $("onto-counts").innerHTML = `<b>${o.elements.length}</b> piezas · <b>${o.edges.length}</b> relaciones · ${errors ? `<b>${errors}</b> errores · ` : ""}${o.findings.length - errors} avisos`;
  }
  $("onto-findings").innerHTML = o.findings.slice(0, 40).map((f) =>
    `<li class="${f.level}"><span class="lv">${f.level}</span><span>${f.element ? `<span class="mono">${esc(f.element)}</span>: ` : ""}${esc(f.message)}</span></li>`).join("");
}

function renderOntologyElements(o, box, W, now) {
  if (!o.elements.length) { box.innerHTML = `<p class="empty">Ontología vacía: el agente la irá rellenando desde la terminal.</p>`; return; }
  const meta = new Map(o.types.map((t) => [t.id, t]));
  const nw = 150, nh = 40;
  const L = columns(o.elements, (e) => meta.get(e.meta)?.group, W, nw, nh, 12);
  const warned = new Set(o.findings.map((f) => f.element).filter(Boolean));
  const near = new Set(ontoSel ? [ontoSel] : []);
  if (ontoSel) for (const e of o.edges) { if (e.from === ontoSel) near.add(e.to); if (e.to === ontoSel) near.add(e.from); }
  const showLabels = Boolean(ontoSel) || o.edges.length <= 24;
  const labels = [];
  const edges = o.edges.map((e) => {
    const p = L.pos.get(e.from), q = L.pos.get(e.to);
    if (!p || !q) return "";
    const hot = ontoSel && (e.from === ontoSel || e.to === ontoSel);
    const { d, mx, my } = edgePath(p, q, nw, nh);
    const cls = hot ? "hot" : ontoSel ? "faded" : "";
    if (showLabels && (!ontoSel || hot)) labels.push(`<text class="edge-label" x="${mx}" y="${my + 3}" text-anchor="middle">${esc(e.verb)}</text>`);
    return `<path class="edge ${cls}" d="${d}"><title>${esc(`${e.from} ${e.verb} ${e.to}`)}</title></path>`;
  }).join("");
  const heads = columnHeads(L);
  const nodes = o.elements.map((e) => {
    const p = L.pos.get(e.id);
    const born = bornAt.get(`o:${e.id}`);
    const cls = [e.meta === "Dominio" ? "hub" : "", warned.has(e.id) ? "warn" : "", ontoSel === e.id ? "sel" : "",
      ontoSel && !near.has(e.id) ? "faded" : "", born && now - born < 2600 ? "new" : ""].join(" ");
    const name = e.nombre.length > 22 ? `${e.nombre.slice(0, 21)}…` : e.nombre;
    const kind = `${e.tipo}${e.clase ? ` · ${e.clase}` : ""}${e.slice ? " · slice" : ""}`;
    return `<g class="node ${cls}" data-id="${esc(e.id)}"><title>${esc(`${e.tipo} ${e.id}${e.descripcion ? `\n${e.descripcion}` : ""}`)}</title>
      <rect x="${p.x}" y="${p.y}" width="${nw}" height="${nh}"/>
      <text class="k" x="${p.x + 10}" y="${p.y + 14}">${esc(kind)}</text>
      <text class="n" x="${p.x + 10}" y="${p.y + 30}">${esc(name)}</text></g>`;
  }).join("");
  box.style.overflow = "auto";
  box.innerHTML = `<svg width="${L.width}" height="${L.height}" style="width:${L.width}px;height:${L.height}px" role="img" aria-label="Ontología">${heads}${edges}${nodes}${labels.join("")}</svg>`;
  box.querySelectorAll(".node").forEach((g) => g.addEventListener("click", () => { ontoSel = ontoSel === g.dataset.id ? null : g.dataset.id; render(); }));
}

function renderOntologyTypes(o, box, W) {
  const nw = 150, nh = 40;
  const L = columns(o.types, (t) => t.group, W, nw, nh, 14);
  const near = new Set(ontoSel ? [ontoSel] : []);
  const rel = Object.entries(o.verbs).flatMap(([verb, v]) => v.from.filter((f) => f !== "*").flatMap((f) => v.to.map((t) => ({ from: f, to: t, verb, desc: v.desc }))));
  if (ontoSel) for (const r of rel) { if (r.from === ontoSel) near.add(r.to); if (r.to === ontoSel) near.add(r.from); }
  const labels = [];
  const edges = rel.map((r) => {
    const p = L.pos.get(r.from), q = L.pos.get(r.to);
    if (!p || !q || r.from === r.to) return "";
    const hot = ontoSel && (r.from === ontoSel || r.to === ontoSel);
    const { d, mx, my } = edgePath(p, q, nw, nh);
    if (hot) labels.push(`<text class="edge-label" x="${mx}" y="${my + 3}" text-anchor="middle">${esc(r.verb)}</text>`);
    return `<path class="edge ${hot ? "hot" : ontoSel ? "faded" : ""}" d="${d}"><title>${esc(`${r.from} ${r.verb} ${r.to}: ${r.desc}`)}</title></path>`;
  }).join("");
  const heads = columnHeads(L);
  const nodes = o.types.map((t) => {
    const p = L.pos.get(t.id);
    const cls = [t.count ? "" : "warn", ontoSel === t.id ? "sel" : "", ontoSel && !near.has(t.id) ? "faded" : ""].join(" ");
    return `<g class="node ${cls}" data-id="${esc(t.id)}"><title>${esc(t.desc)}</title>
      <rect x="${p.x}" y="${p.y}" width="${nw}" height="${nh}"/>
      <text class="k" x="${p.x + 10}" y="${p.y + 14}">${t.count} en el proyecto</text>
      <text class="n" x="${p.x + 10}" y="${p.y + 30}">${esc(t.id)}</text></g>`;
  }).join("");
  box.style.overflow = "auto";
  box.innerHTML = `<svg width="${L.width}" height="${L.height}" style="width:${L.width}px;height:${L.height}px" role="img" aria-label="Tipos y verbos de la ontología">${heads}${edges}${nodes}${labels.join("")}</svg>`;
  box.querySelectorAll(".node").forEach((g) => g.addEventListener("click", () => { ontoSel = ontoSel === g.dataset.id ? null : g.dataset.id; render(); }));
}
document.querySelectorAll("#onto-mode button").forEach((b) => b.addEventListener("click", () => {
  ontoMode = b.dataset.mode; ontoSel = null; store.set("slice-onto-mode", ontoMode); render();
}));

// ---------------------------------------------------------------- VSK (vertical list)
function renderSliceSystem(ss, monitor) {
  const box = $("ss");
  if (!ss) {
    track("slicesystem", "none");
    box.innerHTML = `<div class="notice">VSK no está instalado en este proyecto. Pulsa <b>Iniciar con Claude Code</b> o
      <b>Iniciar con Codex</b>: se hará <span class="mono">git init</span>, se instalará el kit y el agente generará su fichero de contexto.</div>`;
    return;
  }
  track("slicesystem", JSON.stringify([ss.phases, ss.installed.map((s) => s.name), ss.optional.map((s) => s.enabled), ss.agents, ss.hooks, ss.lessons]));
  const seen = new Set();
  const now = Date.now();
  // rows whose content changed since the last render flash for a moment, so edits made from the terminal stand out
  const flash = (key, content) => {
    seen.add(key);
    const sig = JSON.stringify(content);
    if (ssSeeded && ssPrev.get(key) !== sig) ssFlash.set(key, now + 2400);
    ssPrev.set(key, sig);
    return (ssFlash.get(key) ?? 0) > now ? "flash" : "";
  };
  const out = [];
  if (!ss.configured) {
    out.push(`<div class="notice">Kit <b>${esc(ss.version)}</b> instalado, sin configurar. Pide al agente <span class="mono">«configura VSK»</span>
      (skill vsk-setup) para elegir stack, gates y skills.</div>`);
  } else {
    out.push(`<section><h3><b>Fases y gates</b> <i>del ciclo.</i></h3>`);
    for (const ph of ss.phases) {
      out.push(`<div class="phase ${monitor?.current === ph.phase ? "active" : ""}"><div class="phase-head"><b>${esc(ph.phase)}</b>
        <span class="dim">${ph.gates.length} gates${ph.mandatory.length ? ` · ${ph.mandatory.length} skills obligatorias` : ""}</span></div>`);
      for (const g of ph.gates) {
        out.push(`<div class="row ${flash(`g:${g.id}`, g)}" title="${esc(g.description)}"><span>${esc(g.id)}</span><span class="type">${esc(g.type)}</span>
          <span class="what">${g.runs === g.id ? "" : esc(g.runs)}</span><span class="opt">${g.required ? "" : "opcional"}${g.when.length ? ` · si ${esc(g.when.join(", "))}` : ""}</span></div>`);
      }
      if (ph.mandatory.length) out.push(`<div class="must ${flash(`m:${ph.phase}`, ph.mandatory)}">${ph.mandatory.map((m) => `<span>${esc(m)}</span>`).join("")}</div>`);
      out.push(`</div>`);
    }
    out.push(`</section>`);
  }
  out.push(`<section><h3><b>Skills</b> <i>instaladas.</i></h3>`);
  for (const s of ss.installed) {
    out.push(`<div class="skill ${flash(`s:${s.name}`, s.name)}"><span class="mono">${esc(s.name)}</span><span class="d" title="${esc(s.description)}">${esc(s.description)}</span>
      <span class="dim">${s.kit ? "kit" : "propia"}${s.claude ? " · claude" : ""}</span></div>`);
  }
  if (!ss.installed.length) out.push(`<p class="empty">Ninguna todavía.</p>`);
  if (ss.optional.length) {
    out.push(`<div class="must" style="margin-top:10px"><span class="label">OPCIONALES</span> ${ss.optional.map((s) =>
      `<span class="pill ${s.enabled ? "on" : ""} ${flash(`o:${s.name}`, s.enabled)}" title="${esc(s.description)}">${esc(s.name)}</span>`).join("")}</div>`);
  }
  out.push(`</section>`);
  out.push(`<section><h3><b>Agentes y guardas</b> <i>de Claude Code.</i></h3>`);
  for (const a of ss.agents ?? []) {
    out.push(`<div class="skill ${flash(`a:${a.name}`, a)}"><span class="mono">${esc(a.name)}</span><span class="d">${esc(a.tools || "todas las herramientas")}</span>
      <span class="dim">${esc(a.model)} · ${a.kit ? "kit" : "propio"}</span></div>`);
  }
  if (!ss.agents?.length) out.push(`<p class="empty">Sin agentes en .claude/agents. <span class="mono">install.sh --upgrade</span> añade los de verificación.</p>`);
  const h = ss.hooks;
  out.push(`<div class="cmd ${flash("hooks", h)}"><code>hooks</code><span>${h?.installed ? `perfil ${esc(h.profile)}: ${esc(h.enabled.join(", "))}` : `<span class="nodata">sin instalar · vsk hooks install</span>`}</span></div>`);
  out.push(`</section>`);
  out.push(`<section><h3><b>Lecciones</b> <i>aprendidas.</i></h3>`);
  for (const l of (ss.lessons ?? []).slice(0, 8)) {
    out.push(`<div class="skill ${flash(`l:${l.id}`, l)}"><span class="mono">${esc(l.confianza.toFixed(2))} · ${esc(l.id)}</span><span class="d" title="${esc(l.regla)}">${esc(l.regla)}</span>
      <span class="dim">${esc(l.nivel)} · ${l.estado === "pendiente" ? "pendiente" : "codificada"} · ×${l.vista}</span></div>`);
  }
  if (!ss.lessons?.length) out.push(`<p class="empty">Ninguna todavía. Las registra la skill leccion con <span class="mono">vsk lesson add</span>.</p>`);
  out.push(`</section>`);
  if (ss.configured) {
    out.push(`<section><h3><b>Stack</b> <i>y herramientas.</i></h3>`);
    out.push(`<div class="cmd"><code>adaptadores</code><span>${esc(ss.adapters.join(", ") || "—")}</span></div>`);
    for (const [k, v] of Object.entries(ss.toolCommands ?? {})) if (v) out.push(`<div class="cmd ${flash(`t:${k}`, v)}"><code>${esc(k)}</code><span class="mono">${esc(v)}</span></div>`);
    if (ss.branchPattern) out.push(`<div class="cmd"><code>rama</code><span class="mono">${esc(ss.branchPattern)}</span></div>`);
    if (ss.retries !== undefined) out.push(`<div class="cmd"><code>reintentos</code><span>${esc(JSON.stringify(ss.retries))}</span></div>`);
    out.push(`</section>`);
  }
  out.push(`<section><h3><b>Harness</b> <i>desde la terminal.</i></h3><p class="dim" style="margin:0 0 6px;font-size:12px">
    Todo se cambia con <span class="mono">./vsk/bin/vsk</span> y esta lista se actualiza sola.</p>`);
  const groups = [...new Set(ss.commands.map((c) => c.group))];
  for (const g of groups) {
    out.push(`<div class="label" style="margin-top:8px">${esc(g)}</div>`);
    for (const c of ss.commands.filter((x) => x.group === g)) out.push(`<div class="cmd"><code title="vsk ${esc(c.usage)}">vsk ${esc(c.usage)}</code><span>${esc(c.desc)}</span></div>`);
  }
  out.push(`</section>`);
  ssSeeded = true;
  for (const k of [...ssPrev.keys()]) if (!seen.has(k)) ssPrev.delete(k);
  const top = box.scrollTop;
  box.innerHTML = out.join("");
  box.scrollTop = top;
}

// ---------------------------------------------------------------- git
const LANE_COLORS = ["var(--accent-line)", "var(--muted)", "var(--text)", "var(--dim)"];
function renderGit(g) {
  const box = $("git");
  if (!g?.isRepo) {
    track("git", "none");
    $("git-branches").innerHTML = "";
    box.innerHTML = `<div class="notice">Esta carpeta todavía no es un repositorio git. «Iniciar» ejecuta <span class="mono">git init -b main</span>.</div>`;
    return;
  }
  track("git", `${g.head}|${g.branches.length}`);
  $("git-branches").innerHTML = g.branches.filter((b) => !b.remote).map((b) => `<span class="${b.current ? "cur" : ""}">${esc(b.name)}</span>`).join("")
    + g.branches.filter((b) => b.remote).map((b) => `<span title="remota">${esc(b.name)}</span>`).join("");
  if (!g.commits.length) { box.innerHTML = `<p class="empty">Repositorio sin commits todavía en <span class="mono">${esc(g.branch)}</span>.</p>`; return; }
  const RH = 30, LW = 16, pad = 12;
  const left = pad + g.lanes * LW + 8;
  const idx = new Map(g.commits.map((c, i) => [c.hash, i]));
  const X = (lane) => pad + lane * LW + LW / 2, Y = (i) => i * RH + RH / 2;
  const lines = [];
  g.commits.forEach((c, i) => c.parents.forEach((ph, k) => {
    const j = idx.get(ph);
    const x1 = X(c.lane), y1 = Y(i);
    const lane2 = j === undefined ? c.lane : g.commits[j].lane;
    const x2 = X(lane2), y2 = j === undefined ? g.commits.length * RH : Y(j);
    let d;
    if (x1 === x2) d = `M${x1},${y1} L${x2},${y2}`;
    else if (k === 0) d = `M${x1},${y1} L${x1},${y2 - RH} C${x1},${y2 - RH / 2} ${x2},${y2 - RH / 2} ${x2},${y2}`; // branch rejoins its parent
    else d = `M${x1},${y1} C${x1},${y1 + RH / 2} ${x2},${y1 + RH / 2} ${x2},${y1 + RH} L${x2},${y2}`;          // merge pulls in another lane
    lines.push(`<path class="lane-line" d="${d}" style="stroke:${LANE_COLORS[(k ? lane2 : c.lane) % LANE_COLORS.length]}"/>`);
  }));
  const dots = g.commits.map((c, i) => {
    const head = c.refs.some((r) => r.startsWith("HEAD"));
    const col = LANE_COLORS[c.lane % LANE_COLORS.length];
    return `<circle class="dot" cx="${X(c.lane)}" cy="${Y(i)}" r="${head ? 6 : 4.5}" style="stroke:${col};fill:${head ? col : "var(--bg)"}"/>`;
  }).join("");
  const H = g.commits.length * RH;
  const rows = g.commits.map((c) => {
    const refs = c.refs.map((r) => `<span class="ref ${r.startsWith("HEAD") ? "head" : ""}">${esc(r)}</span>`).join("");
    return `<div class="gitrow" style="padding-left:${left}px" title="${esc(`${c.hash}\n${c.author} · ${c.date}`)}">
      <span class="subj">${refs}${esc(c.subject)}</span><span class="meta"><span class="mono">${esc(c.short)}</span> · ${esc(c.author)} · ${esc(c.when)}</span></div>`;
  }).join("");
  const top = box.scrollTop;
  box.innerHTML = `<svg width="${left}" height="${H}">${lines.join("")}${dots}</svg>${rows}`;
  box.scrollTop = top;
}

// ---------------------------------------------------------------- architecture
function renderArch(a) {
  const box = $("arch");
  if (!a) {
    track("arquitectura", "none");
    box.innerHTML = `<div class="notice">No hay <span class="mono">vsk/architecture.yaml</span>. La skill vsk-setup lo genera a partir del código
      y se va completando a medida que la ontología revela componentes.</div>`;
    $("arch-hint").textContent = "";
    return;
  }
  track("arquitectura", a.components.map((c) => c.status).join(""));
  const now = Date.now();
  for (const c of a.components) {
    const before = prevStatus.get(c.id);
    if (before === "planned" && (c.status === "built" || c.status === "changing")) bornAt.set(c.id, now);
    prevStatus.set(c.id, c.status);
  }
  const W = Math.max(600, box.clientWidth), H = Math.max(260, box.clientHeight);
  const colW = W / a.layers.length;
  const bw = Math.min(210, colW - 28), bh = 58;
  const pos = new Map();
  a.layers.forEach((layer, li) => {
    const comps = a.components.filter((c) => c.layer === layer);
    const gap = (H - 40 - comps.length * bh) / (comps.length + 1);
    comps.forEach((c, k) => pos.set(c.id, { x: li * colW + (colW - bw) / 2, y: 34 + gap * (k + 1) + bh * k }));
  });
  const byId = new Map(a.components.map((c) => [c.id, c]));
  const edges = a.edges.map(([from, to]) => {
    const p = pos.get(from), q = pos.get(to);
    if (!p || !q) return "";
    const hot = [byId.get(from), byId.get(to)].some((c) => c?.status === "changing");
    let d;
    if (Math.abs(q.x - p.x) < 1) {
      const down = q.y > p.y;
      const x = p.x + bw / 2, y1 = down ? p.y + bh : p.y, y2 = down ? q.y : q.y + bh;
      d = `M${x},${y1} L${x},${y2}`;
    } else if (q.x > p.x) {
      const x1 = p.x + bw, y1 = p.y + bh / 2, x2 = q.x, y2 = q.y + bh / 2, dx = Math.max(40, (x2 - x1) / 2);
      d = `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
    } else {
      // back edge: leaves from the bottom and returns along the floor of the diagram
      const x1 = p.x + bw / 2, y1 = p.y + bh, x2 = q.x + bw / 2, y2 = q.y + bh, floor = H - 14;
      d = `M${x1},${y1} C${x1},${floor} ${x2},${floor} ${x2},${y2}`;
    }
    return `<path class="edge ${hot ? "hot" : ""}" d="${d}"/>`;
  }).join("");
  const layers = a.layers.map((l, i) => `<text class="col-title" x="${i * colW + 12}" y="16">${esc(l)}</text>` +
    (i ? `<line class="col-line" x1="${i * colW}" y1="0" x2="${i * colW}" y2="${H}"/>` : "")).join("");
  const comps = a.components.map((c) => {
    const p = pos.get(c.id);
    if (!p) return "";
    const isNew = bornAt.has(c.id) && now - bornAt.get(c.id) < 2600;
    const meta = c.status === "planned" ? "prevista" : c.status === "external" ? "externa" : `${c.files.length} ficheros · ${c.tests} tests`;
    const tag = c.status === "changing" ? `<rect class="tagbg" x="${p.x + bw - 74}" y="${p.y - 9}" width="70" height="17" rx="4"/>
      <text class="tag" x="${p.x + bw - 39}" y="${p.y + 3}" text-anchor="middle">EN OBRAS</text>` : "";
    return `<g class="comp ${c.status} ${isNew ? "new" : ""} ${focusComponent === c.id ? "focus" : ""}" data-id="${esc(c.id)}">
      <title>${esc(c.description ?? c.name)}</title>
      <rect x="${p.x}" y="${p.y}" width="${bw}" height="${bh}"/>
      <text class="t1" x="${p.x + 14}" y="${p.y + 24}">${esc(c.name)}</text>
      <text class="t2" x="${p.x + 14}" y="${p.y + 43}">${esc(meta)}</text>${tag}</g>`;
  }).join("");
  box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Arquitectura">${layers}${edges}${comps}</svg>`;
  box.querySelectorAll(".comp").forEach((g) => g.addEventListener("click", () => {
    focusComponent = focusComponent === g.dataset.id ? null : g.dataset.id;
    render();
  }));
  const changing = a.components.filter((c) => c.status === "changing");
  const planned = a.components.filter((c) => c.status === "planned").length;
  $("arch-hint").textContent = a.errors.length ? `architecture.yaml: ${a.errors.join(" · ")}`
    : changing.length ? `En obras: ${changing.map((c) => `${c.name} (${c.dirty.length})`).join(", ")}` + (planned ? ` · ${planned} componentes previstos` : "")
    : planned ? `${planned} componentes previstos por construir` : "Todos los componentes construidos.";
}

// ---------------------------------------------------------------- repository
function renderRepo(s) {
  const r = s.repo, a = s.arch;
  track("repositorio", `${r.recent[0]?.path ?? ""}|${r.files.length}`);
  const count = (st) => r.files.filter((f) => f.status === st).length;
  $("counters").innerHTML = `<span><b>${r.files.length}</b> ficheros</span><span><b>${count("added") + count("untracked")}</b> nuevos</span><span><b>${count("modified")}</b> modificados</span>`;
  const comp = focusComponent && a ? a.components.find((c) => c.id === focusComponent) : null;
  const highlight = new Set(comp ? comp.files : []);
  const target = pinned ?? r.recent[0]?.path ?? null;
  const dirs = new Map();
  for (const f of r.files) {
    const i = f.path.lastIndexOf("/");
    const dir = i < 0 ? "." : f.path.slice(0, i);
    if (!dirs.has(dir)) dirs.set(dir, []);
    dirs.get(dir).push(f);
  }
  const mark = { added: "A", untracked: "+", modified: "M", deleted: "D", clean: "" };
  $("tree").innerHTML = r.files.length ? [...dirs.entries()].map(([dir, files]) =>
    `<li class="dir"><span></span>${esc(dir === "." ? "/" : `${dir}/`)}</li>` + files.map((f) => {
      const cls = [f.status, highlight.has(f.path) ? "hl" : "", f.path === target ? "sel" : ""].join(" ");
      return `<li class="${cls}" data-path="${esc(f.path)}"><span class="m">${mark[f.status]}</span>${esc(f.path.slice(f.path.lastIndexOf("/") + 1))}</li>`;
    }).join("")).join("") : `<li class="empty"><span></span>Carpeta vacía.</li>`;
  $("tree").querySelectorAll("li[data-path]").forEach((li) => li.addEventListener("click", () => {
    pinned = pinned === li.dataset.path ? null : li.dataset.path;
    render();
  }));
  loadDiff(target, r);
  const active = new Set(s.changes.map((c) => c.slice));
  $("slices").innerHTML = s.slices.map((x) => `<span class="${x.slug === s.slice ? "active" : x.status === "shipped" ? "shipped" : ""}" title="${esc(x.capability)} · ${x.scenarios} escenarios">${esc(x.slug)}${active.has(x.slug) && x.slug !== s.slice ? " ·" : ""}</span>`).join("");
}

async function loadDiff(path, r) {
  const key = path ? `${path}@${r.files.find((f) => f.path === path)?.mtime ?? 0}` : "";
  if (key === shownDiff) return;
  shownDiff = key;
  $("diff-file").textContent = path ? `${path}${pinned ? "  (fijado)" : ""}` : "—";
  if (!path) { $("diff").innerHTML = `<span class="hunk">Sin cambios todavía. El último fichero que toque el agente aparecerá aquí.</span>`; return; }
  const text = await api(`/api/diff?file=${encodeURIComponent(path)}`).catch(() => "");
  $("diff").innerHTML = (text || "(sin diferencias con HEAD)").split("\n").map((l) => {
    const cls = l.startsWith("+++") || l.startsWith("---") || l.startsWith("@@") || l.startsWith("diff ") || l.startsWith("index ") ? "hunk"
      : l.startsWith("+") ? "add" : l.startsWith("-") ? "del" : "";
    return `<span class="${cls}">${esc(l)}</span>`;
  }).join("\n");
}

// ---------------------------------------------------------------- launcher
let browsing = store.get("slice-browse", null);
let launcherOpen = false;

function showLauncher(on) {
  launcherOpen = on;
  $("launcher").hidden = !on;
  if (on) { $("launcher-error").textContent = ""; renderRecents(); browse(browsing); }
}

function renderRecents() {
  const list = state?.recents ?? [];
  const badgesOf = (p) => [p.git ? "GIT" : "", p.kit ? "SLICE" : "", p.ontology ? "ONTOLOGÍA" : ""].filter(Boolean).map((b) => `<span>${b}</span>`).join("");
  $("recents").innerHTML = list.length ? list.map((p) => `<li data-path="${esc(p.path)}"><b>${esc(p.name)}</b><span class="p">${esc(tilde(p.path))}</span>
    <span class="badges">${badgesOf(p)}</span></li>`).join("") : `<li class="empty">Aún no has abierto ningún proyecto.</li>`;
}

async function browse(path) {
  try {
    const l = await api(`/api/fs/list${path ? `?path=${encodeURIComponent(path)}` : ""}`);
    browsing = l.path;
    store.set("slice-browse", browsing);
    const rel = l.path.slice(l.home.length).split("/").filter(Boolean);
    const crumbs = [`<a data-path="${esc(l.home)}">~</a>`];
    rel.forEach((part, i) => crumbs.push(`/<a data-path="${esc(`${l.home}/${rel.slice(0, i + 1).join("/")}`)}">${esc(part)}</a>`));
    $("crumbs").innerHTML = crumbs.join("");
    $("dirs").innerHTML = (l.parent ? `<li data-path="${esc(l.parent)}"><span>..</span><span></span></li>` : "") + (l.dirs.length ? l.dirs.map((d) =>
      `<li data-path="${esc(d.path)}"><span>${esc(d.name)}</span><span class="badges">${d.kit ? "<span>SLICE</span>" : d.project ? "<span>PROYECTO</span>" : ""}</span></li>`).join("")
      : `<li class="empty">Sin subcarpetas.</li>`);
    $("launcher-error").textContent = "";
  } catch (e) {
    $("launcher-error").textContent = e.message;
    if (path) browse(null);
  }
}

async function openProject(path) {
  try {
    await api("/api/project/open", { path });
    startMsg = "";
    showLauncher(false);
  } catch (e) { $("launcher-error").textContent = e.message; }
}

$("crumbs").addEventListener("click", (e) => { const a = e.target.closest("a[data-path]"); if (a) browse(a.dataset.path); });
$("dirs").addEventListener("click", (e) => { const li = e.target.closest("li[data-path]"); if (li) browse(li.dataset.path); });
$("dirs").addEventListener("dblclick", (e) => { const li = e.target.closest("li[data-path]"); if (li) openProject(li.dataset.path); });
$("recents").addEventListener("click", (e) => { const li = e.target.closest("li[data-path]"); if (li) openProject(li.dataset.path); });
$("open-here").addEventListener("click", () => browsing && openProject(browsing));
async function createDir() {
  const name = $("newdir").value.trim();
  if (!name) { $("newdir").focus(); return; }
  try {
    const r = await api("/api/fs/mkdir", { parent: browsing, name });
    $("newdir").value = "";
    await openProject(r.path);
  } catch (e) { $("launcher-error").textContent = e.message; }
}
$("create-dir").addEventListener("click", createDir);
$("newdir").addEventListener("keydown", (e) => { if (e.key === "Enter") createDir(); });
$("open-projects").addEventListener("click", () => showLauncher(true));
$("close-launcher").addEventListener("click", () => showLauncher(false));

// ---------------------------------------------------------------- wiring
let lastRoot = null;
function render() {
  if (!state) return;
  const s = state;
  renderHeader(s);
  const project = s.screen === "project";
  document.body.classList.toggle("no-kit", !project || !s.kit);
  $("close-launcher").hidden = !project;
  if (!project) {
    $("startbar").hidden = true;
    $("stages").innerHTML = "";
    $("statusbar").innerHTML = "";
    if (!launcherOpen) showLauncher(true); else renderRecents();
    stopTerminal();
    return;
  }
  if (s.project.path !== lastRoot) { lastRoot = s.project.path; pinned = null; shownDiff = null; focusComponent = null; ontoSel = null; knownOnto.clear(); ontoSeeded = false; ssPrev.clear(); ssFlash.clear(); ssSeeded = false; sigs.clear(); badges.clear(); }
  if (launcherOpen) renderRecents();
  if (s.terminal) startTerminal();
  renderStartbar(s);
  renderStatusbar(s);
  renderLanes(s.lanes);
  renderCycle(s.monitor, s.kit, s.phaseGates);
  renderOntology(s.ontology);
  renderSliceSystem(s.sliceSystem, s.monitor);
  renderGit(s.git);
  renderArch(s.arch);
  renderRepo(s);
  placeViews();
  tick();
}

function connect() {
  const es = new EventSource(withToken("/api/stream"));
  es.addEventListener("state", (e) => { state = JSON.parse(e.data); render(); });
  es.onerror = () => { $("mode").textContent = "○ RECONECTANDO"; };
}

document.addEventListener("keydown", (e) => {
  if (e.key === "F2") { e.preventDefault(); toggleMax(); return; }
  if (e.key === "Escape") {
    if (launcherOpen && state?.screen === "project") { showLauncher(false); return; }
    if (!document.activeElement?.closest(".term-box")) { pinned = null; focusComponent = null; ontoSel = null; render(); }
  }
});
let resizeTimer = 0;
window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(render, 120); });
setInterval(tick, 1000);
placeViews();
connect();

// ---------------------------------------------------------------- live terminal
let term = null;
let fit = null;
let sock = null;
let retry = 0;
let wantTerm = false;
let retryTimer = 0;
const fontKey = "slice-term-font";

function setTermState(text, on) {
  const el = $("term-state");
  el.textContent = text;
  el.classList.toggle("on", Boolean(on));
}

function startTerminal() {
  if (!window.Terminal) return;
  if (!term) {
    term = new window.Terminal({
      fontFamily: "Menlo, ui-monospace, monospace",
      fontSize: Number(store.get(fontKey, 14)) || 14,
      lineHeight: 1.15,
      cursorBlink: true,
      scrollback: 8000,
      allowProposedApi: false,
      theme: XTERM[theme()],
    });
    fit = new window.FitAddon.FitAddon();
    term.loadAddon(fit);
    term.open($("term"));
    term.onData((d) => sock?.readyState === 1 && sock.send(JSON.stringify({ t: "in", d })));
    new ResizeObserver(() => refit()).observe($("term"));
    refit();
    term.focus();
  }
  if (!wantTerm) { wantTerm = true; connectTerminal(); }
}

function stopTerminal() {
  wantTerm = false;
  clearTimeout(retryTimer);
  if (sock) { const s = sock; sock = null; s.onclose = null; s.close(); }
  term?.reset();
  setTermState("sin proyecto", false);
}

function refit() {
  if (!term) return;
  try { fit.fit(); } catch { return; }
  if (sock?.readyState === 1) sock.send(JSON.stringify({ t: "resize", cols: term.cols, rows: term.rows }));
}

function connectTerminal() {
  if (!wantTerm) return;
  setTermState("conectando…", false);
  const s = new WebSocket(`ws://${location.host}${withToken("/api/term")}`);
  sock = s;
  s.onopen = () => { retry = 0; refit(); };
  s.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.t === "hello") {
      term.reset();
      term.write(m.d);
      setTermState(m.running ? "en directo" : `shell cerrada (${m.code})`, m.running);
      $("term-restart").hidden = m.running;
    } else if (m.t === "out") {
      term.write(m.d);
    } else if (m.t === "exit") {
      term.write(`\r\n\x1b[2m[la shell terminó con código ${m.code} · ↻ para abrir otra]\x1b[0m\r\n`);
      setTermState(`shell cerrada (${m.code})`, false);
      $("term-restart").hidden = false;
    } else if (m.t === "restart") {
      term.reset();
      setTermState("en directo", true);
      $("term-restart").hidden = true;
    }
  };
  s.onclose = (e) => {
    if (sock !== s || !wantTerm) return;
    // 4000: the server switched project; reconnect at once to the new shell
    const wait = e.code === 4000 ? 50 : Math.min(5000, 500 * 2 ** retry++);
    setTermState("reconectando…", false);
    retryTimer = setTimeout(connectTerminal, wait);
  };
}

function toggleMax() {
  $("grid").classList.toggle("term-max");
  setTimeout(() => { refit(); render(); }, 50);
}

const setFont = (d) => { if (!term) return; term.options.fontSize = Math.max(9, Math.min(28, term.options.fontSize + d)); store.set(fontKey, term.options.fontSize); refit(); };
$("font-up").addEventListener("click", () => setFont(1));
$("font-down").addEventListener("click", () => setFont(-1));
$("term-max").addEventListener("click", toggleMax);
$("term-restart").addEventListener("click", () => sock?.readyState === 1 && sock.send(JSON.stringify({ t: "restart" })));
