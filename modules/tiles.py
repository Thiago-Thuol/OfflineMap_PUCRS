"""
modules/tiles.py — Serve tiles vetoriais/raster com correção de bounds.
"""

import gzip, math, sqlite3
from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import JSONResponse
from modules import shared_state

router = APIRouter()

def _get_db():
    path = Path(shared_state.MBTILES_PATH)
    if not path.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {path}")
    conn = sqlite3.connect(str(path), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def _tile_to_lng(x, z):  return x / 2**z * 360.0 - 180.0
def _tile_to_lat(y, z):
    n = math.pi - 2 * math.pi * y / 2**z
    return math.degrees(math.atan(math.sinh(n)))

def _real_bounds():
    """Calcula bounds geográficos reais lendo os tiles existentes."""
    db = _get_db()
    zooms = [r[0] for r in db.execute("SELECT DISTINCT zoom_level FROM tiles ORDER BY zoom_level").fetchall()]
    z = min(zooms, key=lambda x: abs(x - 7))
    r = db.execute("SELECT MIN(tile_column),MAX(tile_column),MIN(tile_row),MAX(tile_row) FROM tiles WHERE zoom_level=?", (z,)).fetchone()
    db.close()
    min_col, max_col, min_tms, max_tms = r[0], r[1], r[2], r[3]
    # TMS → XYZ
    min_xyz = (2**z - 1) - max_tms
    max_xyz = (2**z - 1) - min_tms
    west  = _tile_to_lng(min_col, z)
    east  = _tile_to_lng(max_col + 1, z)
    north = _tile_to_lat(min_xyz, z)
    south = _tile_to_lat(max_xyz + 1, z)
    return {
        "bounds": [round(west,4), round(south,4), round(east,4), round(north,4)],
        "center_lng": round((west+east)/2, 4),
        "center_lat": round((north+south)/2, 4),
    }

@router.get("/metadata")
def get_metadata():
    try:
        db   = _get_db()
        meta = {r[0]: r[1] for r in db.execute("SELECT name, value FROM metadata").fetchall()}
        db.close()
        # Sempre injeta bounds e centro reais calculados
        real = _real_bounds()
        meta["_detected_format"] = shared_state.TILE_FORMAT
        meta["_real_center_lng"] = str(real["center_lng"])
        meta["_real_center_lat"] = str(real["center_lat"])
        meta["_real_bounds"]     = ",".join(str(x) for x in real["bounds"])
        return JSONResponse(meta)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tilejson")
def get_tilejson():
    try:
        db   = _get_db()
        meta = {r[0]: r[1] for r in db.execute("SELECT name, value FROM metadata").fetchall()}
        db.close()
        real = _real_bounds()
        fmt  = shared_state.TILE_FORMAT
        ext  = "png" if fmt == "raster" else "pbf"
        host, port = shared_state.HOST, shared_state.PORT
        tj = {
            "tilejson": "2.2.0",
            "name":     meta.get("name", "Mapa Offline"),
            "tiles":    [f"http://{host}:{port}/tiles/{{z}}/{{x}}/{{y}}.{ext}"],
            "minzoom":  int(meta.get("minzoom", 0)),
            "maxzoom":  int(meta.get("maxzoom", 14)),
            "bounds":   real["bounds"],
            "center":   [real["center_lng"], real["center_lat"], 7],
            "format":   ext,
        }
        if fmt == "vector":
            import json as _json
            tj["vector_layers"] = _json.loads(meta.get("json","{}")).get("vector_layers",[])
        return tj
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/layers")
def get_layers():
    try:
        db  = _get_db()
        row = db.execute("SELECT tile_data FROM tiles WHERE zoom_level=(SELECT MAX(zoom_level) FROM tiles) LIMIT 1").fetchone()
        db.close()
        if not row: return JSONResponse({"layers": []})
        data = row["tile_data"]
        if data[:2] == b"\x1f\x8b": data = gzip.decompress(data)
        return JSONResponse({"layers": _layer_names(data)})
    except Exception as e:
        return JSONResponse({"layers": [], "error": str(e)})

def _layer_names(data):
    layers = []; i = 0
    while i < len(data):
        tag = data[i]; i += 1
        fn = tag >> 3; wt = tag & 7
        if wt == 2:
            ln = 0; sh = 0
            while True:
                b = data[i]; i += 1; ln |= (b&0x7F)<<sh; sh+=7
                if not(b&0x80): break
            if fn == 3:
                ld = data[i:i+ln]; j = 0
                while j < len(ld):
                    lt = ld[j]; j+=1; lf=lt>>3; lw=lt&7
                    if lw==2:
                        ll=0;ls=0
                        while True:
                            lb=ld[j];j+=1;ll|=(lb&0x7F)<<ls;ls+=7
                            if not(lb&0x80):break
                        if lf==1:
                            n=ld[j:j+ll].decode("utf-8",errors="ignore")
                            if n and n not in layers: layers.append(n)
                            break
                        j+=ll
                    elif lw==0:
                        while j<len(ld) and ld[j]&0x80: j+=1
                        j+=1
                    else: break
            i += ln
        elif wt==0:
            while i<len(data) and data[i]&0x80: i+=1
            i+=1
        elif wt==5: i+=4
        elif wt==1: i+=8
        else: break
    return layers

@router.get("/{z}/{x}/{y}.png")
def get_raster(z:int, x:int, y:int):
    tms_y = (2**z-1)-y
    try: data = _fetch(z,x,tms_y)
    except FileNotFoundError as e: raise HTTPException(404, str(e))
    if data is None: return Response(status_code=204)
    return Response(content=data, headers={"Content-Type":"image/png"})

@router.get("/{z}/{x}/{y}.pbf")
def get_vector(z:int, x:int, y:int):
    tms_y = (2**z-1)-y
    try: data = _fetch(z,x,tms_y)
    except FileNotFoundError as e: raise HTTPException(404, str(e))
    if data is None: return Response(status_code=204)
    h = {"Content-Type":"application/x-protobuf"}
    if data[:2]==b"\x1f\x8b": h["Content-Encoding"]="gzip"
    else: data=gzip.compress(data); h["Content-Encoding"]="gzip"
    return Response(content=data, headers=h)

@lru_cache(maxsize=512)
def _fetch(z,x,tms_y):
    db  = _get_db()
    row = db.execute("SELECT tile_data FROM tiles WHERE zoom_level=? AND tile_column=? AND tile_row=?", (z,x,tms_y)).fetchone()
    db.close()
    return row["tile_data"] if row else None
