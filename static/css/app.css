/* ═══════════════════════════════════════════════════════════════════════════
   app.css — Tema náutico escuro, otimizado para legibilidade em campo
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Reset & base ──────────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  /* Paleta náutica */
  --c-sea:        #0a1628;   /* fundo escuro (água profunda) */
  --c-panel:      #0f2040dd; /* painéis semitransparentes */
  --c-panel-alt:  #1a3255cc;
  --c-accent:     #00c4ff;   /* ciano — destaque náutico */
  --c-accent2:    #ffa500;   /* laranja — alertas / embarcações */
  --c-text:       #cce8f4;
  --c-text-dim:   #6a90b0;
  --c-border:     #1e4a70;

  /* Layout */
  --hud-top-h:    48px;
  --hud-bottom-h: 36px;
  --hud-side-w:   200px;
  --radius:       6px;
  --font:         'Courier New', 'Lucida Console', monospace; /* estética terminal náutico */
}

html, body {
  width: 100%; height: 100%;
  overflow: hidden;
  background: var(--c-sea);
  color: var(--c-text);
  font-family: var(--font);
  font-size: 13px;
}

/* ── Mapa ──────────────────────────────────────────────────────────────────── */
#map {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* Customiza controles nativos do MapLibre */
.maplibregl-ctrl-group {
  background: var(--c-panel) !important;
  border: 1px solid var(--c-border) !important;
  border-radius: var(--radius) !important;
}
.maplibregl-ctrl button {
  color: var(--c-text) !important;
}

/* ── HUD Superior ──────────────────────────────────────────────────────────── */
.hud-top {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: var(--hud-top-h);
  background: var(--c-panel);
  border-bottom: 1px solid var(--c-border);
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 12px;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.hud-logo {
  font-size: 15px;
  font-weight: bold;
  color: var(--c-accent);
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.hud-coords {
  flex: 1;
  text-align: center;
  color: var(--c-text-dim);
  font-size: 12px;
  letter-spacing: 0.08em;
}

.hud-actions {
  display: flex;
  gap: 6px;
}

.hud-btn {
  background: var(--c-panel-alt);
  border: 1px solid var(--c-border);
  color: var(--c-text);
  padding: 4px 8px;
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 14px;
  transition: background 0.15s;
}
.hud-btn:hover {
  background: var(--c-accent);
  color: var(--c-sea);
}

/* ── HUD Lateral (Camadas) ─────────────────────────────────────────────────── */
.hud-side {
  position: absolute;
  top: var(--hud-top-h);
  right: 0;
  width: var(--hud-side-w);
  bottom: var(--hud-bottom-h);
  background: var(--c-panel);
  border-left: 1px solid var(--c-border);
  display: flex;
  flex-direction: column;
  padding: 10px 8px;
  gap: 4px;
  overflow-y: auto;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.hud-side-title {
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--c-text-dim);
  border-bottom: 1px solid var(--c-border);
  padding-bottom: 4px;
  margin-bottom: 4px;
}

.layer-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 6px;
  border-radius: var(--radius);
  cursor: pointer;
  user-select: none;
  border: 1px solid transparent;
  transition: all 0.15s;
  color: var(--c-text-dim);
}
.layer-toggle:hover    { background: var(--c-panel-alt); }
.layer-toggle.active   { color: var(--c-text); border-color: var(--c-border); }

.layer-icon  { font-size: 14px; }
.layer-label { flex: 1; font-size: 11px; }
.layer-check { color: var(--c-accent); font-size: 12px; }
.layer-toggle:not(.active) .layer-check { opacity: 0; }

/* Status de módulo */
.module-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  font-size: 11px;
  color: var(--c-text-dim);
}
.module-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #555;
  flex-shrink: 0;
}
.module-dot.ok      { background: #2ecc71; }
.module-dot.error   { background: #e74c3c; }
.module-dot.waiting { background: var(--c-accent2); }

/* ── HUD Inferior ──────────────────────────────────────────────────────────── */
.hud-bottom {
  position: absolute;
  bottom: 0; left: 0; right: var(--hud-side-w);
  height: var(--hud-bottom-h);
  background: var(--c-panel);
  border-top: 1px solid var(--c-border);
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 16px;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.hud-zoom {
  color: var(--c-accent);
  font-size: 12px;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.hud-credit {
  margin-left: auto;
  font-size: 10px;
  color: var(--c-text-dim);
}

/* ── Popup de feature ──────────────────────────────────────────────────────── */
.feature-popup {
  position: absolute;
  bottom: calc(var(--hud-bottom-h) + 12px);
  left: 12px;
  min-width: 200px;
  max-width: 280px;
  background: var(--c-panel);
  border: 1px solid var(--c-accent);
  border-radius: var(--radius);
  padding: 10px 12px;
  z-index: 200;
  backdrop-filter: blur(6px);
}
.feature-popup.hidden { display: none; }

.popup-close {
  position: absolute;
  top: 6px; right: 8px;
  background: none;
  border: none;
  color: var(--c-text-dim);
  cursor: pointer;
  font-size: 13px;
}
.popup-close:hover { color: var(--c-text); }

#popup-content { font-size: 12px; line-height: 1.6; }
#popup-content strong { color: var(--c-accent); display: block; margin-bottom: 4px; }
#popup-content table { width: 100%; border-collapse: collapse; }
#popup-content td { padding: 1px 0; vertical-align: top; }
#popup-content td:first-child { color: var(--c-text-dim); padding-right: 8px; white-space: nowrap; }

/* ── Ícone de embarcação na HUD overlay ────────────────────────────────────── */
.vessel-marker {
  width: 20px; height: 20px;
  background: var(--c-accent2);
  border: 2px solid #fff;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  cursor: pointer;
}

/* ── Scrollbar discreta ────────────────────────────────────────────────────── */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--c-border); border-radius: 2px; }
