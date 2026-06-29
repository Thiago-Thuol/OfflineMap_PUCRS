"""
modules/tiles.py
Serve tiles PNG raster do arquivo .mbtiles via HTTP.
"""

import sqlite3
from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import JSONResponse

from modules import shared_state

router = APIRouter()


def _get_db() -> sqlite3.Connection:
    path = Path(shared_state.MBTILES_PATH)
    if not path.exists():
        raise FileNotFoundError(f"Arquivo MBTiles não encontrado: {path}")
    conn = sqlite3.connect(str(path), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


@router.get("/metadata")
def get_metadata():
    """Retorna os metadados do arquivo .mbtiles."""
    try:
        db   = _get_db()
        rows = db.execute("SELECT name, value FROM metadata").fetchall()
        meta = {r["name"]: r["value"] for r in rows}
        db.close()
        return JSONResponse(meta)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao ler metadados: {e}")


@router.get("/tilejson")
def get_tilejson():
    """TileJSON para referência."""
    try:
        db   = _get_db()
        rows = db.execute("SELECT name, value FROM metadata").fetchall()
        meta = {r["name"]: r["value"] for r in rows}
        db.close()

        host   = shared_state.HOST
        port   = shared_state.PORT
        bounds = [float(x) for x in meta.get("bounds", "-180,-85,180,85").split(",")]

        return {
            "tilejson": "2.2.0",
            "name":     meta.get("name", "Mapa Offline"),
            "tiles":    [f"http://{host}:{port}/tiles/{{z}}/{{x}}/{{y}}.png"],
            "minzoom":  int(meta.get("minzoom", 0)),
            "maxzoom":  int(meta.get("maxzoom", 14)),
            "bounds":   bounds,
            "center":   [(bounds[0]+bounds[2])/2, (bounds[1]+bounds[3])/2, 7],
            "format":   "png",
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{z}/{x}/{y}.png")
def get_tile(z: int, x: int, y: int):
    """Serve um tile PNG individual."""
    # Converte XYZ → TMS (y invertido)
    tms_y = (2 ** z - 1) - y

    try:
        tile_data = _fetch_tile(z, x, tms_y)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    if tile_data is None:
        return Response(status_code=204)

    return Response(
        content=tile_data,
        headers={"Content-Type": "image/png"}
    )


@lru_cache(maxsize=512)
def _fetch_tile(z: int, x: int, tms_y: int) -> bytes | None:
    """Busca tile no SQLite com cache LRU."""
    db  = _get_db()
    row = db.execute(
        "SELECT tile_data FROM tiles WHERE zoom_level=? AND tile_column=? AND tile_row=?",
        (z, x, tms_y),
    ).fetchone()
    db.close()
    return row["tile_data"] if row else None
