"""
mapa-offline — Servidor principal
Detecta automaticamente se o .mbtiles é raster ou vetorial
e configura tudo sem precisar de argumentos extras.
"""

import argparse
import webbrowser
import threading
import time
import uvicorn

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from modules.tiles      import router as tiles_router
from modules.overlay    import router as overlay_router
from modules.config_api import router as config_router
from modules.detect     import detect_format

# ── Argumentos CLI ─────────────────────────────────────────────────────────────
parser = argparse.ArgumentParser(description="Mapa Offline")
parser.add_argument("--mbtiles",    default="map.mbtiles", help="Caminho para o arquivo .mbtiles")
parser.add_argument("--host",       default="127.0.0.1",   help="Host do servidor")
parser.add_argument("--port",       default=8080, type=int,help="Porta do servidor")
parser.add_argument("--no-browser", action="store_true",   help="Não abre o browser automaticamente")
args = parser.parse_args()

# ── Detecção automática do formato ─────────────────────────────────────────────
from modules import shared_state
shared_state.MBTILES_PATH = args.mbtiles
shared_state.HOST         = args.host
shared_state.PORT         = args.port

try:
    shared_state.TILE_FORMAT = detect_format(args.mbtiles)
    print(f"\n  🔍  Formato detectado: {shared_state.TILE_FORMAT.upper()}")
except FileNotFoundError:
    print(f"\n  ⚠️  Arquivo não encontrado: {args.mbtiles}")
    print("      Crie um arquivo .mbtiles ou passe o caminho correto com --mbtiles\n")
    shared_state.TILE_FORMAT = "vector"

# ── App FastAPI ────────────────────────────────────────────────────────────────
app = FastAPI(title="Mapa Offline", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tiles_router,   prefix="/tiles",   tags=["Tiles"])
app.include_router(overlay_router, prefix="/overlay", tags=["Overlay"])
app.include_router(config_router,  prefix="/config",  tags=["Config"])

app.mount("/styles", StaticFiles(directory="styles"),              name="styles")
app.mount("/",       StaticFiles(directory="static", html=True),   name="static")

# ── Auto-abrir browser ─────────────────────────────────────────────────────────
def _open_browser():
    time.sleep(1.2)
    webbrowser.open(f"http://{args.host}:{args.port}")

if __name__ == "__main__":
    if not args.no_browser:
        threading.Thread(target=_open_browser, daemon=True).start()

    print(f"  🗺️  Rodando em http://{args.host}:{args.port}")
    print(f"  📦  MBTiles: {args.mbtiles}\n")

    uvicorn.run("main:app", host=args.host, port=args.port, log_level="warning")
