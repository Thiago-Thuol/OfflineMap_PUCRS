"""
modules/shared_state.py
Estado global compartilhado entre todos os módulos.
Evita imports circulares e centraliza configuração de runtime.
"""

# ── Configuração do servidor (preenchida pelo main.py) ─────────────────────────
MBTILES_PATH: str = "map.mbtiles"
HOST:         str = "127.0.0.1"
PORT:         int = 8080

# ── Overlays ativos (preenchidos por módulos de dados ao vivo) ─────────────────
# Cada módulo registra seus dados aqui para o frontend consumir via /overlay
# Estrutura: { "layer_id": { "type": "geojson", "data": {...} } }
active_overlays: dict = {}

# ── Registro de módulos de dados (para descoberta dinâmica no frontend) ────────
# Cada módulo externo (AIS, NMEA, etc.) se registra aqui ao iniciar
# Estrutura: { "module_id": { "label": "...", "status": "ok"|"error", "icon": "..." } }
registered_modules: dict = {}
