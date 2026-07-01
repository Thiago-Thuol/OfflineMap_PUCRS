/**
 * js/hud.js — Módulo da HUD (painel lateral)
 * Gerencia os toggles de camadas do mapa base
 * e exibe o status dos módulos registrados no backend.
 *
 * Interface com outros módulos:
 *  - window.HUD.addLayerToggle(id, label, icon, onToggle) → adiciona um toggle
 *  - window.HUD.setModuleStatus(id, label, status, icon)  → atualiza indicador
 */

(function initHUD() {

  const togglesContainer = document.getElementById('overlay-toggles');
  const moduleContainer  = document.getElementById('module-status');

  // ── API pública da HUD ────────────────────────────────────────────────────

  window.HUD = {

    /**
     * Adiciona um toggle de camada ao painel lateral.
     * Chamado pelo módulo overlay.js ao receber layers do backend.
     *
     * @param {string}   id        - identificador único
     * @param {string}   label     - texto exibido
     * @param {string}   icon      - emoji
     * @param {boolean}  active    - estado inicial
     * @param {Function} onToggle  - callback(newState: boolean)
     */
    addLayerToggle(id, label, icon, active, onToggle) {
      // Remove toggle anterior com mesmo ID (atualização)
      const existing = document.getElementById(`hud-toggle-${id}`);
      if (existing) existing.remove();

      const el = document.createElement('label');
      el.id        = `hud-toggle-${id}`;
      el.className = `layer-toggle${active ? ' active' : ''}`;
      el.innerHTML = `
        <span class="layer-icon">${icon || '📍'}</span>
        <span class="layer-label">${label}</span>
        <span class="layer-check">✓</span>
      `;
      el.addEventListener('click', () => {
        const nowActive = !el.classList.contains('active');
        el.classList.toggle('active', nowActive);
        onToggle?.(nowActive);
      });

      togglesContainer.appendChild(el);
    },

    /**
     * Atualiza o indicador de status de um módulo externo.
     * Status: 'ok' | 'error' | 'waiting'
     */
    setModuleStatus(id, label, status = 'waiting', icon = '🔌') {
      let el = document.getElementById(`mod-status-${id}`);
      if (!el) {
        el = document.createElement('div');
        el.id        = `mod-status-${id}`;
        el.className = 'module-item';
        moduleContainer.appendChild(el);
      }
      el.innerHTML = `
        <span class="module-dot ${status}"></span>
        <span>${icon} ${label}</span>
      `;
    },

  };

  // ── Carrega status dos módulos do backend ─────────────────────────────────

  async function refreshModules() {
    try {
      const modules = await fetch('/overlay/modules').then(r => r.json());
      Object.entries(modules).forEach(([id, info]) => {
        window.HUD.setModuleStatus(id, info.label, info.status, info.icon);
      });
    } catch (_) { /* backend pode não ter módulos externos */ }
  }

  // Atualiza status dos módulos a cada 10s
  refreshModules();
  setInterval(refreshModules, 10_000);

})();
