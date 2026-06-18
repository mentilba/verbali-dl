#!/usr/bin/env bash
# Setup ambiente Sister su macOS
set -e

echo ""
echo "======================================================"
echo "  Setup Sister Automation - Studio Tecnico"
echo "======================================================"

# ── verifica Python ────────────────────────────────────────
echo ""
echo "[1/4] Verifica Python..."

PYTHON=""
for cmd in python3.12 python3.11 python3.10 python3; do
    if command -v "$cmd" &>/dev/null; then
        VER=$("$cmd" -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
        MAJOR=$(echo "$VER" | cut -d. -f1)
        MINOR=$(echo "$VER" | cut -d. -f2)
        if [ "$MAJOR" -ge 3 ] && [ "$MINOR" -ge 10 ]; then
            PYTHON="$cmd"
            echo "    Trovato: $cmd ($VER) - OK"
            break
        fi
    fi
done

if [ -z "$PYTHON" ]; then
    echo ""
    echo "  Python 3.10+ non trovato. Installa con:"
    echo ""
    echo "    Opzione A (Homebrew):"
    echo "      /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    echo "      brew install python@3.12"
    echo ""
    echo "    Opzione B (installer ufficiale):"
    echo "      Scarica da https://www.python.org/downloads/macos/"
    echo ""
    exit 1
fi

# ── virtual environment ────────────────────────────────────
echo ""
echo "[2/4] Creazione virtual environment..."

VENV_DIR="$(dirname "$0")/.venv"
if [ -d "$VENV_DIR" ]; then
    echo "    .venv già esistente - saltato"
else
    "$PYTHON" -m venv "$VENV_DIR"
    echo "    Creato: $VENV_DIR"
fi

source "$VENV_DIR/bin/activate"

# ── dipendenze Python ──────────────────────────────────────
echo ""
echo "[3/4] Installazione dipendenze Python..."
pip install --quiet --upgrade pip
pip install --quiet -r "$(dirname "$0")/requirements.txt"
echo "    playwright installato"

# ── browser Playwright ────────────────────────────────────
echo ""
echo "[4/4] Download browser Chromium (solo prima volta, ~150MB)..."
python -m playwright install chromium
echo "    Chromium pronto"

# ── messaggio finale ───────────────────────────────────────
echo ""
echo "======================================================"
echo "  Setup completato."
echo ""
echo "  Per avviare l'agente:"
echo ""
echo "    source sister/.venv/bin/activate"
echo "    python sister/sister_agent.py sister/sample_input.csv"
echo ""
echo "  Per usare il tuo CSV:"
echo "    python sister/sister_agent.py percorso/al/tuo/file.csv"
echo ""
echo "  Output PDF/screenshot in:  sister/output/"
echo "  Log operazioni in:         sister/logs/"
echo "======================================================"
