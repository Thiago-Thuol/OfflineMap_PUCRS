"""
modules/overlay.py
Módulo de overlays da HUD — gerencia camadas extras exibidas sobre o mapa.

Cada overlay é um layer GeoJSON independente que o frontend consome via
Server-Sent Events (SSE) ou polling em /overlay/stream e /overlay/snapshot.

Módulos externos (AIS, NMEA, radio, etc.) inserem dados em `shared_state.active_overlays`
usando a função helper `push_overlay()` definida aqui.

Exemplo de uso por um módulo futuro (ex: modules/ais.py):
    from modules.overlay import push_overlay
    push_overlay("vessels", {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-43.17, -22.90]},
                "properties": {
                    "mmsi": "123456789",
                    "name": "BARCO EXEMPLO",
                    "speed": 5.2,
                    "heading": 90,
                    "source": "AIS VHF"
                }
            }
        ]
    })
"""

import asyncio
import json
from typing import AsyncGenerator

from fastapi import APIRouter
from fastapi.responses import JSONResponse, StreamingResponse

from modules import shared_state

router = APIRouter()


# ── API pública para módulos externos ─────────────────────────────────────────

def push_overlay(layer_id: str, geojson: dict, label: str = "", icon: str = "📍"):
    """
    Registra ou atualiza um overlay na HUD.
    Chamado por módulos externos (AIS, GPS, etc.).

    Args:
        layer_id: identificador único do layer (ex: "vessels", "gps_track")
        geojson:  FeatureCollection GeoJSON com os dados
        label:    nome legível para exibir na HUD
        icon:     emoji ou código de ícone para o toggle da HUD
    """
    shared_state.active_overlays[layer_id] = {
        "label":   label or layer_id,
        "icon":    icon,
        "visible": True,
        "data":    geojson,
    }


def remove_overlay(layer_id: str):
    """Remove um overlay da HUD."""
    shared_state.active_overlays.pop(layer_id, None)


def register_module(module_id: str, label: str, status: str = "ok", icon: str = "🔌"):
    """
    Registra um módulo de dados na HUD para exibição de status.
    Chamado pelo __init__ de cada módulo ao iniciar.
    """
    shared_state.registered_modules[module_id] = {
        "label":  label,
        "status": status,
        "icon":   icon,
    }


# ── Endpoints HTTP ─────────────────────────────────────────────────────────────

@router.get("/snapshot")
def snapshot():
    """
    Retorna todos os overlays ativos em um único JSON.
    Usado pelo frontend para polling periódico (ex: a cada 5s).
    """
    return JSONResponse(shared_state.active_overlays)


@router.get("/modules")
def list_modules():
    """
    Lista os módulos registrados e seus status.
    O frontend exibe isso como indicadores na HUD.
    """
    return JSONResponse(shared_state.registered_modules)


@router.get("/stream")
async def stream():
    """
    Server-Sent Events (SSE) — envia atualizações de overlays em tempo real.
    O frontend se conecta uma vez e recebe push a cada mudança.
    Ideal para dados de posição de embarcações com alta frequência.
    """
    async def event_generator() -> AsyncGenerator[str, None]:
        last_snapshot = ""
        while True:
            current = json.dumps(shared_state.active_overlays, default=str)
            if current != last_snapshot:
                last_snapshot = current
                yield f"data: {current}\n\n"
            await asyncio.sleep(1)   # verifica mudanças a cada 1s

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":               "no-cache",
            "X-Accel-Buffering":           "no",
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.post("/toggle/{layer_id}")
def toggle_layer(layer_id: str):
    """Alterna visibilidade de um layer na HUD."""
    if layer_id in shared_state.active_overlays:
        overlay = shared_state.active_overlays[layer_id]
        overlay["visible"] = not overlay["visible"]
        return {"layer_id": layer_id, "visible": overlay["visible"]}
    return JSONResponse({"error": "Layer não encontrado"}, status_code=404)
