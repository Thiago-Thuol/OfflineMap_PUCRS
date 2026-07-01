/**
 * js/overlay.js — Módulo de overlays dinâmicos
 * Consome os dados de /overlay/stream (SSE) e /overlay/snapshot (polling)
 * e renderiza cada overlay como um layer GeoJSON no MapLibre.
 *
 * Quando o módulo AIS/rádio estiver implementado no backend:
 *   1. Ele chama push_overlay("vessels", geojson) em Python
 *   2. Este arquivo recebe via SSE automaticamente
 *   3. Adiciona/atualiza o layer no mapa sem nenhuma mudança aqui
 *
 * Para overlays de embarcações, espera features com properties:
 *   { name, mmsi, speed, heading, source }
 */

(function initOverlay() {

  // Aguarda o mapa estar pronto
  function whenMapReady(fn) {
    if (window.MAP && window.MAP.loaded()) { fn(); return; }
    const check = setInterval(() => {
      if (window.MAP?.loaded()) { clearInterval(check); fn(); }
    }, 200);
  }

  // ── Estado interno ─────────────────────────────────────────────────────────
  const _layers  = {};  // { layer_id: { visible, mapSourceAdded } }

  // ── Renderização de um overlay no MapLibre ──────────────────────────────────

  function renderOverlay(id, overlayDef) {
    const map     = window.MAP;
    const geojson = overlayDef.data;
    const visible = overlayDef.visible !== false;
    const sourceId = `overlay-${id}`;
    const layerId  = `overlay-layer-${id}`;

    if (!_layers[id]) {
      // Primeira vez — cria source e layer
      _layers[id] = { visible, mapSourceAdded: false };

      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, { type: 'geojson', data: geojson });
        _layers[id].mapSourceAdded = true;

        // Layer de pontos (ex: embarcações)
        map.addLayer({
          id:     layerId,
          type:   'circle',
          source: sourceId,
          filter: ['==', '$type', 'Point'],
          paint: {
            'circle-radius':       8,
            'circle-color':        '#ffa500',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
            'circle-opacity':      0.9,
          },
        });

        // Layer de linhas (ex: trilha de GPS)
        map.addLayer({
          id:     `${layerId}-line`,
          type:   'line',
          source: sourceId,
          filter: ['==', '$type', 'LineString'],
          paint: {
            'line-color': '#00c4ff',
            'line-width': 2,
            'line-opacity': 0.8,
          },
        });

        // Labels do layer (ex: nome do barco)
        map.addLayer({
          id:     `${layerId}-label`,
          type:   'symbol',
          source: sourceId,
          filter: ['==', '$type', 'Point'],
          layout: {
            'text-field':         ['coalesce', ['get', 'name'], ['get', 'mmsi'], ''],
            'text-font':          ['Noto Sans Regular'],
            'text-size':          11,
            'text-anchor':        'top',
            'text-offset':        [0, 1.2],
          },
          paint: {
            'text-color':       '#ffa500',
            'text-halo-color':  '#0a1628',
            'text-halo-width':  1.5,
          },
        });

        // Popup ao clicar em embarcação / ponto do overlay
        map.on('click', layerId, (e) => {
          const props = e.features[0].properties || {};
          const rows  = Object.entries(props)
            .filter(([, v]) => v !== null && v !== '')
            .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
            .join('');

          const popup   = document.getElementById('feature-popup');
          const content = document.getElementById('popup-content');
          content.innerHTML = `
            <strong>${overlayDef.icon || '📍'} ${overlayDef.label || id}</strong>
            <table>${rows}</table>
          `;
          popup.classList.remove('hidden');
        });

        map.on('mouseenter', layerId, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', layerId, () => { map.getCanvas().style.cursor = ''; });
      }

      // Registra toggle na HUD
      window.HUD?.addLayerToggle(id, overlayDef.label || id, overlayDef.icon, visible, (active) => {
        _setLayerVisibility(id, active);
        // Sincroniza com backend (opcional)
        fetch(`/overlay/toggle/${id}`, { method: 'POST' }).catch(() => {});
      });

    } else {
      // Já existe — apenas atualiza os dados
      map.getSource(sourceId)?.setData(geojson);
    }

    _setLayerVisibility(id, visible);
  }

  function _setLayerVisibility(id, visible) {
    const map = window.MAP;
    const v   = visible ? 'visible' : 'none';
    [`overlay-layer-${id}`, `overlay-layer-${id}-line`, `overlay-layer-${id}-label`].forEach(lid => {
      if (map.getLayer(lid)) map.setLayoutProperty(lid, 'visibility', v);
    });
    if (_layers[id]) _layers[id].visible = visible;
  }

  // ── Aplicar snapshot inteiro ───────────────────────────────────────────────

  function applySnapshot(snapshot) {
    Object.entries(snapshot).forEach(([id, def]) => {
      try { renderOverlay(id, def); }
      catch (err) { console.warn(`[overlay] Erro ao renderizar "${id}":`, err); }
    });
  }

  // ── SSE: recebe atualizações em tempo real ─────────────────────────────────

  function connectSSE() {
    const es = new EventSource('/overlay/stream');
    es.onmessage = (event) => {
      try {
        const snapshot = JSON.parse(event.data);
        whenMapReady(() => applySnapshot(snapshot));
      } catch (err) {
        console.warn('[overlay] Erro ao parsear SSE:', err);
      }
    };
    es.onerror = () => {
      console.warn('[overlay] SSE desconectado, reconectando em 5s...');
      es.close();
      setTimeout(connectSSE, 5_000);
    };
  }

  // ── Polling de fallback (caso SSE não funcione) ────────────────────────────

  function startPolling() {
    setInterval(async () => {
      try {
        const snapshot = await fetch('/overlay/snapshot').then(r => r.json());
        whenMapReady(() => applySnapshot(snapshot));
      } catch (_) {}
    }, 5_000);
  }

  // ── Inicialização ──────────────────────────────────────────────────────────

  whenMapReady(() => {
    // Carrega snapshot inicial imediatamente
    fetch('/overlay/snapshot')
      .then(r => r.json())
      .then(applySnapshot)
      .catch(() => {});

    // Conecta SSE para atualizações em tempo real
    connectSSE();

    // Polling como fallback redundante
    startPolling();
  });

})();
