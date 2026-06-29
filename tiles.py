"""
modules/config_api.py
Endpoints de configuração acessíveis pelo frontend em tempo de execução.
Permite que a UI saiba quais arquivos estão carregados, versão, etc.
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from modules import shared_state

router = APIRouter()


@router.get("/info")
def get_info():
    """Retorna informações gerais da instância em execução."""
    return JSONResponse({
        "app":      "mapa-offline",
        "version":  "1.0.0",
        "mbtiles":  shared_state.MBTILES_PATH,
        "host":     shared_state.HOST,
        "port":     shared_state.PORT,
    })
