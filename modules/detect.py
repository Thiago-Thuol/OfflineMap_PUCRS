"""
modules/detect.py
Detecta automaticamente se um arquivo .mbtiles é raster (PNG) ou vetorial (PBF).
Lê o primeiro tile disponível e verifica os magic bytes.
"""

import gzip
import sqlite3
from pathlib import Path


def detect_format(mbtiles_path: str) -> str:
    """
    Retorna 'raster' ou 'vector' baseado no conteúdo real do arquivo.

    Lógica:
      1. Tenta ler o campo 'format' dos metadados (mais rápido)
      2. Se não encontrar, lê o primeiro tile e verifica os bytes
         - PNG:  começa com \\x89PNG  → raster
         - gzip: começa com \\x1f\\x8b → vetorial (PBF comprimido)
         - PBF:  qualquer outro       → vetorial
    """
    path = Path(mbtiles_path)
    if not path.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {mbtiles_path}")

    db = sqlite3.connect(str(path))

    # ── Tentativa 1: campo 'format' nos metadados ──────────────────────────
    try:
        row = db.execute("SELECT value FROM metadata WHERE name='format'").fetchone()
        if row:
            fmt = row[0].lower().strip()
            if fmt in ("png", "jpg", "jpeg", "webp"):
                db.close()
                return "raster"
            if fmt in ("pbf", "mvt"):
                db.close()
                return "vector"
    except Exception:
        pass

    # ── Tentativa 2: magic bytes do primeiro tile ──────────────────────────
    try:
        row = db.execute("SELECT tile_data FROM tiles LIMIT 1").fetchone()
        if row:
            data = row[0]
            # Descomprime gzip para ver o conteúdo real
            if data[:2] == b"\x1f\x8b":
                inner = gzip.decompress(data[:16])
                data  = inner

            if data[:4] == b"\x89PNG":
                db.close()
                return "raster"
            if data[:3] in (b"\xff\xd8\xff",):   # JPEG
                db.close()
                return "raster"
    except Exception:
        pass

    db.close()
    # Padrão: assume vetorial se não conseguiu detectar
    return "vector"
