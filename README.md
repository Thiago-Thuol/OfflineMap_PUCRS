# OfflineMap_PUCRS
The application consists of a Python backend built with FastAPI and a plain HTML/JS frontend. The backend reads map tiles directly from a local .mbtiles file (a SQLite database containing PNG images) and serves them over HTTP. The frontend renders these tiles interactively, supporting pan, zoom, coordinate display, and a toggleable layer HUD.

# 🗺️ Mapa Offline — Navegação Náutica Local

Servidor leve de mapas vetoriais offline para hardware limitado (Raspberry Pi 3+).
Exibe arquivos `.mbtiles` com suporte a overlays dinâmicos (embarcações, GPS, etc.).

---

## Estrutura do Projeto

```
mapa-offline/
├── main.py                   # Ponto de entrada — FastAPI + argparse
├── requirements.txt
│
├── modules/                  # Backend modular
│   ├── __init__.py           # shared_state global
│   ├── shared_state.py       # re-export para imports diretos
│   ├── tiles.py              # Serve tiles do .mbtiles via HTTP
│   ├── overlay.py            # HUD: gerencia layers extras (SSE + REST)
│   ├── config_api.py         # Endpoints de configuração
│   └── ais.py                # ESQUELETO: módulo AIS/rádio futuro
│
├── static/                   # Frontend (servido como arquivos estáticos)
│   ├── index.html
│   ├── css/app.css
│   └── js/
│       ├── map.js            # Inicializa MapLibre
│       ├── hud.js            # Painel lateral / toggles / status
│       └── overlay.js        # Consome SSE e renderiza GeoJSON no mapa
│
└── styles/
    └── basic.json            # Estilo vetorial do MapLibre GL JS
```

---

## Instalação

```bash
# 1. Clone / copie o projeto
cd mapa-offline

# 2. Instale as dependências
pip install -r requirements.txt

# 3. Coloque seu arquivo .mbtiles no diretório (ou passe o caminho)
```

### No Raspberry Pi OS (Debian/Ubuntu)

```bash
sudo apt update
sudo apt install python3-pip chromium-browser
pip3 install -r requirements.txt
```

---

## Uso

```bash
# Básico (procura map.mbtiles no diretório atual)
python main.py

# Especificando o arquivo
python main.py --mbtiles /caminho/para/brasil.mbtiles

# Modo kiosk (RPi com display)
python main.py --no-browser
chromium-browser --kiosk --incognito http://localhost:8080
```

---

## Onde Baixar Arquivos .mbtiles Vetoriais

| Fonte | Cobertura | Link |
|---|---|---|
| OpenMapTiles | Mundo / Países | https://openmaptiles.org/downloads/ |
| Protomaps | Mundo inteiro | https://protomaps.com/downloads |
| BBBike | Cidades | https://extract.bbbike.org |

> **Dica para RPi 3:** baixe apenas a região necessária para minimizar tamanho.

---

## Como Adicionar Módulos Externos (ex: AIS, GPS)

O sistema foi projetado para receber dados de embarcações de qualquer fonte.
Para adicionar um novo módulo:

### 1. Crie `modules/meu_modulo.py`

```python
from fastapi import APIRouter
from modules.overlay import push_overlay, register_module

router = APIRouter()

def start():
    register_module("meu_modulo", label="Meu Módulo", status="ok", icon="🚢")
    # inicie sua thread de leitura aqui

@router.get("/status")
def status():
    return {"ok": True}
```

### 2. Injete dados com `push_overlay()`

```python
push_overlay("vessels", {
    "type": "FeatureCollection",
    "features": [{
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [-43.17, -22.90]},
        "properties": {
            "name":    "BARCO 1",
            "mmsi":    "123456789",
            "speed":   5.2,
            "heading": 90,
            "source":  "AIS VHF"
        }
    }]
})
```

### 3. Registre no `main.py`

```python
from modules.meu_modulo import router as meu_router
app.include_router(meu_router, prefix="/meu_modulo", tags=["Meu Módulo"])
```

> O frontend recebe os dados via SSE automaticamente — **sem nenhuma mudança no JS**.

---

## Fontes de Dados de Embarcações Suportadas (futuro)

| Fonte | Protocolo | Biblioteca Python |
|---|---|---|
| RTL-SDR (antena VHF) | AIS via rádio | `pyrtlsdr` + `pyais` |
| Receptor serial | NMEA 0183 | `pyserial` + `pyais` |
| UDP Multicast | AIS estação costeira | `socket` |
| Arquivo NMEA | Replay / desenvolvimento | `pyais` |

---

## Performance no Raspberry Pi 3

| Componente | RAM | CPU |
|---|---|---|
| Python + FastAPI | ~35 MB | baixa |
| Chromium (MapLibre) | ~100 MB | ~20-30% durante zoom |
| **Total estimado** | **~135 MB** | dentro dos 1GB |

**Dicas de otimização:**
- Use `--maxzoom 14` nos tiles para reduzir tamanho
- Prefira regiões pequenas (estado/cidade) a países inteiros
- Habilite swap de 512MB no RPi OS como segurança
