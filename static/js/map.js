(async function initMap() {

  let center = [-52.03, -26.81];
  let zoom   = 7;
  let tileFormat = "vector";

  // 1. Metadados
  try {
    const meta = await fetch('/tiles/metadata').then(r => r.json());
    tileFormat = meta._detected_format || "vector";

    // Usa centro real calculado pelo backend
    if (meta._real_center_lng && meta._real_center_lat) {
      center = [parseFloat(meta._real_center_lng), parseFloat(meta._real_center_lat)];
    }
    console.info('[map] Centro:', center, '| Formato:', tileFormat);
  } catch (err) {
    console.warn('[map] Metadados indisponíveis.', err);
  }

  // 2. Estilo
  let style;
  if (tileFormat === "raster") {
    style = {
      version: 8,
      sources: { offline: { type: "raster", tiles: ["http://127.0.0.1:8080/tiles/{z}/{x}/{y}.png"], tileSize: 256 } },
      layers: [
        { id: "background", type: "background", paint: { "background-color": "#a8cfe0" } },
        { id: "raster", type: "raster", source: "offline" }
      ]
    };
  } else {
    // Carrega estilo vetorial — NÃO filtra por layers (confia no basic.json)
    try {
      style = await fetch('/styles/basic.json').then(r => r.json());
      console.info('[map] Estilo vetorial carregado, layers:', style.layers.length);
    } catch (err) {
      console.warn('[map] Erro ao carregar estilo.', err);
      style = {
        version: 8,
        sources: { offline: { type: "vector", url: "http://127.0.0.1:8080/tiles/tilejson" } },
        layers: [{ id: "background", type: "background", paint: { "background-color": "#f0ebe3" } }]
      };
    }
  }

  // 3. MapLibre
  const map = new maplibregl.Map({
    container:        'map',
    style:            style,
    center:           center,
    zoom:             zoom,
    maxZoom:          18,
    minZoom:          2,
    maxTileCacheSize: 50,
    antialias:        false,
  });

  window.MAP = map;

  map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-left');
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

  map.on('mousemove', (e) => {
    const { lng, lat } = e.lngLat;
    document.getElementById('hud-coords').textContent =
      `${lat.toFixed(5)}°  ${lng.toFixed(5)}°`;
  });

  map.on('zoom', () => {
    document.getElementById('hud-zoom').textContent = `Z ${map.getZoom().toFixed(1)}`;
  });

  // Popup ao clicar
  const popup   = document.getElementById('feature-popup');
  const content = document.getElementById('popup-content');
  map.on('click', (e) => {
    if (tileFormat === "raster") return;
    const features = map.queryRenderedFeatures(e.point);
    if (!features.length) { popup.classList.add('hidden'); return; }
    const f = features[0];
    const rows = Object.entries(f.properties || {})
      .filter(([,v]) => v !== null && v !== '')
      .slice(0, 12)
      .map(([k,v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');
    content.innerHTML = `<strong>${f.layer?.['source-layer'] || f.layer?.id}</strong><table>${rows}</table>`;
    popup.classList.remove('hidden');
  });
  document.getElementById('popup-close').addEventListener('click', () => popup.classList.add('hidden'));

  map.on('load', () => {
    document.getElementById('hud-zoom').textContent = `Z ${map.getZoom().toFixed(1)}`;
    map.fire('mapa:ready');
  });

  document.getElementById('btn-center').addEventListener('click', () => map.flyTo({ center, zoom, speed: 1.2 }));
  document.getElementById('btn-fullscreen').addEventListener('click', () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  });

})();
