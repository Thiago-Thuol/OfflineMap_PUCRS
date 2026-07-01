"""
modules/shared_state.py
Estado global compartilhado entre todos os módulos.
"""

MBTILES_PATH:   str  = "map.mbtiles"
HOST:           str  = "127.0.0.1"
PORT:           int  = 8080
TILE_FORMAT:    str  = "vector"   # "raster" ou "vector" — preenchido pelo main.py

active_overlays:    dict = {}
registered_modules: dict = {}
