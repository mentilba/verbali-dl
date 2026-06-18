"""
Agente automazione visure catastali su Sister (Agenzia delle Entrate).

Uso:
    python sister_agent.py [percorso_csv]

CSV atteso (colonne):
    tipo_ricerca  : "soggetto" oppure "immobile"
    codice_fiscale: per tipo soggetto
    comune        : per tipo immobile
    foglio        : per tipo immobile
    particella    : per tipo immobile
    subalterno    : per tipo immobile (opzionale)

Output:
    sister/output/<nome>.pdf  oppure  sister/output/<nome>.png
    sister/logs/sister_<timestamp>.log
"""

import asyncio
import csv
import logging
import sys
from datetime import datetime
from pathlib import Path

from playwright.async_api import (
    BrowserContext,
    Page,
    async_playwright,
    TimeoutError as PlaywrightTimeout,
)

# ── URL e percorsi ─────────────────────────────────────────────────────────────
SISTER_URL = "https://servizi.agenziaentrate.gov.it/servizi/Sister/"

BASE_DIR   = Path(__file__).parent
OUTPUT_DIR = BASE_DIR / "output"
LOG_DIR    = BASE_DIR / "logs"


# ── logging ────────────────────────────────────────────────────────────────────
def _setup_logging() -> logging.Logger:
    LOG_DIR.mkdir(exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = LOG_DIR / f"sister_{ts}.log"

    fmt = "%(asctime)s [%(levelname)s] %(message)s"
    logging.basicConfig(
        level=logging.INFO,
        format=fmt,
        handlers=[
            logging.FileHandler(log_file, encoding="utf-8"),
            logging.StreamHandler(sys.stdout),
        ],
    )
    logger = logging.getLogger("sister")
    logger.info(f"Log: {log_file}")
    return logger


# ── CSV ────────────────────────────────────────────────────────────────────────
def _load_csv(path: str) -> list[dict]:
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = [{k.strip().lower(): v.strip() for k, v in row.items()} for row in reader]
    return rows


# ── helpers selettori ──────────────────────────────────────────────────────────
async def _click_first(page: Page, selectors: list[str], timeout: int = 5000) -> bool:
    """Clicca il primo selettore trovato. Ritorna True se trovato."""
    for sel in selectors:
        try:
            el = page.locator(sel).first
            if await el.count() > 0:
                await el.click(timeout=timeout)
                return True
        except Exception:
            continue
    return False


async def _fill_first(page: Page, selectors: list[str], value: str) -> bool:
    """Compila il primo campo trovato. Ritorna True se trovato."""
    for sel in selectors:
        try:
            el = page.locator(sel).first
            if await el.count() > 0:
                await el.fill(value)
                return True
        except Exception:
            continue
    return False


async def _screenshot_error(page: Page, label: str):
    """Salva screenshot in caso di errore per debug."""
    try:
        LOG_DIR.mkdir(exist_ok=True)
        path = LOG_DIR / f"errore_{label}_{datetime.now():%H%M%S}.png"
        await page.screenshot(path=str(path), full_page=True)
    except Exception:
        pass


# ── autenticazione SPID ────────────────────────────────────────────────────────
async def _attendi_autenticazione(page: Page, logger: logging.Logger) -> None:
    """
    Pausa interattiva: l'utente completa l'autenticazione SPID nel browser,
    poi preme INVIO qui per continuare.
    """
    print()
    print("╔══════════════════════════════════════════════════════════╗")
    print("║                                                          ║")
    print("║  AZIONE RICHIESTA NEL BROWSER:                          ║")
    print("║                                                          ║")
    print("║  1. Clicca «Entra con SPID» (o CIE/CNS)                 ║")
    print("║  2. Scegli il tuo provider SPID                          ║")
    print("║  3. Completa l'autenticazione (credenziali / OTP)        ║")
    print("║  4. Aspetta di essere reindirizzato su Sister            ║")
    print("║                                                          ║")
    print("║  Poi torna qui e premi INVIO per continuare...           ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print()

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, input, ">>> Premi INVIO quando autenticato: ")

    logger.info("Utente ha confermato autenticazione. Verifica sessione...")

    # Verifica che la sessione sia attiva: l'URL non deve essere su pagine SPID
    try:
        await page.wait_for_function(
            """() => {
                const url  = window.location.href.toLowerCase();
                const title = document.title.toLowerCase();
                const noSpid = !url.includes('spid') && !url.includes('idp') &&
                               !title.includes('spid') && !title.includes('accedi');
                const onSister = url.includes('agenziaentrate') || url.includes('sister');
                return noSpid && onSister;
            }""",
            timeout=20_000,
        )
        logger.info("Sessione Sister attiva.")
    except PlaywrightTimeout:
        logger.warning("Timeout verifica sessione (procedo comunque - verifica il browser).")


# ── ricerca per soggetto (codice fiscale) ──────────────────────────────────────
async def _ricerca_soggetto(page: Page, record: dict, logger: logging.Logger) -> bool:
    cf = record.get("codice_fiscale", "").strip().upper()
    if not cf:
        logger.error("Codice fiscale mancante nel record.")
        return False

    logger.info(f"  Ricerca per soggetto: CF={cf}")

    # Tab / link "Per soggetto"
    await _click_first(page, [
        'a:has-text("Per soggetto")',
        'a:has-text("Soggetto")',
        'button:has-text("Soggetto")',
        'label:has-text("Soggetto")',
        '#tabSoggetto',
        'input[value="S"]',
        'input[id*="soggetto"]',
    ])
    await page.wait_for_timeout(800)

    # Campo codice fiscale
    ok = await _fill_first(page, [
        'input[name*="codiceFiscale"]',
        'input[name*="codice_fiscale"]',
        'input[name*="CodiceFiscale"]',
        'input[id*="codiceFiscale"]',
        'input[id*="codice_fiscale"]',
        'input[placeholder*="fiscale" i]',
        'input[placeholder*="codice" i]',
        'input[maxlength="16"]',
    ], cf)

    if not ok:
        logger.error("  Campo codice fiscale non trovato.")
        await _screenshot_error(page, f"no_cf_{cf}")
        return False

    logger.info(f"  Compilato CF: {cf}")

    # Submit
    submitted = await _click_first(page, [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Cerca")',
        'button:has-text("Ricerca")',
        'input[value="Cerca"]',
        'a:has-text("Cerca")',
    ])
    if not submitted:
        logger.error("  Pulsante di ricerca non trovato.")
        return False

    await page.wait_for_load_state("networkidle", timeout=30_000)
    return True


# ── ricerca per immobile (foglio/particella) ───────────────────────────────────
async def _ricerca_immobile(page: Page, record: dict, logger: logging.Logger) -> bool:
    comune     = record.get("comune", "").strip()
    foglio     = record.get("foglio", "").strip()
    particella = record.get("particella", "").strip()
    subalterno = record.get("subalterno", "").strip()

    if not (comune and foglio and particella):
        logger.error(f"  Dati immobile incompleti: comune='{comune}' foglio='{foglio}' particella='{particella}'")
        return False

    logger.info(f"  Ricerca immobile: {comune} fg.{foglio} part.{particella}" + (f" sub.{subalterno}" if subalterno else ""))

    # Tab "Per immobile"
    await _click_first(page, [
        'a:has-text("Per immobile")',
        'a:has-text("Immobile")',
        'button:has-text("Immobile")',
        'label:has-text("Immobile")',
        '#tabImmobile',
        'input[value="I"]',
        'input[id*="immobile"]',
    ])
    await page.wait_for_timeout(800)

    # Campo comune (può essere input con autocomplete o select)
    comune_filled = False
    for sel in ['select[name*="comune" i]', 'select[id*="comune" i]']:
        el = page.locator(sel).first
        if await el.count() > 0:
            try:
                await el.select_option(label=comune)
                comune_filled = True
                break
            except Exception:
                pass

    if not comune_filled:
        comune_filled = await _fill_first(page, [
            'input[name*="comune" i]',
            'input[id*="comune" i]',
            'input[placeholder*="comune" i]',
        ], comune)
        if comune_filled:
            await page.wait_for_timeout(1200)
            # seleziona primo suggerimento autocomplete se appare
            suggestion = page.locator(
                f'li:has-text("{comune}"), div[role="option"]:has-text("{comune}")'
            ).first
            if await suggestion.count() > 0:
                await suggestion.click()
                await page.wait_for_timeout(500)

    if not comune_filled:
        logger.error("  Campo comune non trovato.")
        await _screenshot_error(page, f"no_comune_{comune}")
        return False

    # Foglio
    ok_foglio = await _fill_first(page, [
        'input[name*="foglio" i]',
        'input[id*="foglio" i]',
        'input[placeholder*="foglio" i]',
    ], foglio)
    if not ok_foglio:
        logger.error("  Campo foglio non trovato.")
        return False

    # Particella
    ok_part = await _fill_first(page, [
        'input[name*="particella" i]',
        'input[id*="particella" i]',
        'input[name*="mappale" i]',
        'input[placeholder*="particella" i]',
        'input[placeholder*="mappale" i]',
    ], particella)
    if not ok_part:
        logger.error("  Campo particella non trovato.")
        return False

    # Subalterno (opzionale)
    if subalterno:
        await _fill_first(page, [
            'input[name*="subalterno" i]',
            'input[id*="subalterno" i]',
            'input[name*="sub" i]',
            'input[placeholder*="subalterno" i]',
        ], subalterno)

    logger.info(f"  Form compilato.")

    # Submit
    submitted = await _click_first(page, [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Cerca")',
        'button:has-text("Ricerca")',
        'input[value="Cerca"]',
        'a:has-text("Cerca")',
    ])
    if not submitted:
        logger.error("  Pulsante di ricerca non trovato.")
        return False

    await page.wait_for_load_state("networkidle", timeout=30_000)
    return True


# ── salvataggio risultato ──────────────────────────────────────────────────────
async def _salva_risultato(page: Page, record: dict, logger: logging.Logger) -> Path | None:
    OUTPUT_DIR.mkdir(exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")

    cf         = record.get("codice_fiscale", "").replace(" ", "")
    comune     = record.get("comune", "").replace(" ", "_")
    foglio     = record.get("foglio", "")
    particella = record.get("particella", "")

    if cf:
        stem = f"visura_CF_{cf}_{ts}"
    else:
        stem = f"visura_{comune}_fg{foglio}_p{particella}_{ts}"

    # 1) Prova scaricamento PDF diretto
    pdf_selectors = [
        'a[href$=".pdf"]',
        'a[href*="pdf" i]',
        'a:has-text("PDF")',
        'button:has-text("PDF")',
        'a:has-text("Scarica")',
        'button:has-text("Scarica")',
        'input[value*="PDF" i]',
    ]
    for sel in pdf_selectors:
        el = page.locator(sel).first
        if await el.count() > 0:
            try:
                async with page.expect_download(timeout=30_000) as dl_info:
                    await el.click()
                download = await dl_info.value
                out_path = OUTPUT_DIR / f"{stem}.pdf"
                await download.save_as(str(out_path))
                logger.info(f"  PDF scaricato: {out_path.name}")
                return out_path
            except Exception as e:
                logger.warning(f"  Download PDF non riuscito ({e})")
                break

    # 2) Fallback: screenshot dell'intera pagina
    out_path = OUTPUT_DIR / f"{stem}.png"
    try:
        await page.screenshot(path=str(out_path), full_page=True)
        logger.info(f"  Screenshot salvato: {out_path.name}")
        return out_path
    except Exception as e:
        logger.error(f"  Screenshot fallito: {e}")
        return None


# ── navigazione alla pagina di ricerca ────────────────────────────────────────
async def _vai_a_ricerca(page: Page, logger: logging.Logger) -> bool:
    """Naviga alla pagina di ricerca visure dopo il login."""
    await page.goto(SISTER_URL, timeout=30_000)
    await page.wait_for_load_state("networkidle", timeout=20_000)

    # Clicca su un link visure/consultazione/ricerca se presente in home
    found = await _click_first(page, [
        'a:has-text("Visure")',
        'a:has-text("Consultazione")',
        'a:has-text("Ricerca immobili")',
        'a:has-text("Ricerca soggetti")',
        'a[href*="visura" i]',
        'a[href*="consultazione" i]',
        'a[href*="ricerca" i]',
        'a[href*="Visura" i]',
    ])
    if found:
        try:
            await page.wait_for_load_state("networkidle", timeout=15_000)
        except PlaywrightTimeout:
            pass

    return True


# ── processamento singolo record ───────────────────────────────────────────────
async def _processa_record(
    page: Page, record: dict, idx: int, logger: logging.Logger
) -> bool:
    tipo = record.get("tipo_ricerca", "soggetto").strip().lower()

    logger.info(f"\n{'─' * 55}")
    logger.info(f"Record {idx + 1}: tipo={tipo}")

    try:
        ok_nav = await _vai_a_ricerca(page, logger)
        if not ok_nav:
            return False

        # scegli flusso in base al tipo
        if tipo in ("soggetto", "cf", "codice_fiscale", "persona"):
            ok = await _ricerca_soggetto(page, record, logger)
        elif tipo in ("immobile", "fg", "foglio", "particella", "immobile"):
            ok = await _ricerca_immobile(page, record, logger)
        else:
            logger.error(f"  Tipo ricerca sconosciuto: '{tipo}' (usa 'soggetto' o 'immobile')")
            return False

        if not ok:
            await _screenshot_error(page, f"record_{idx + 1}_form")
            return False

        # verifica che ci sia qualcosa di utile nella pagina risultati
        await page.wait_for_timeout(1500)

        result = await _salva_risultato(page, record, logger)
        return result is not None

    except PlaywrightTimeout as e:
        logger.error(f"  Timeout record {idx + 1}: {e}")
        await _screenshot_error(page, f"timeout_record_{idx + 1}")
        return False
    except Exception as e:
        logger.error(f"  Errore inatteso record {idx + 1}: {e}", exc_info=True)
        await _screenshot_error(page, f"errore_record_{idx + 1}")
        return False


# ── main ───────────────────────────────────────────────────────────────────────
async def main():
    logger = _setup_logging()

    csv_path = sys.argv[1] if len(sys.argv) > 1 else str(BASE_DIR / "sample_input.csv")
    if not Path(csv_path).exists():
        logger.error(f"File CSV non trovato: {csv_path}")
        sys.exit(1)

    records = _load_csv(csv_path)
    logger.info(f"Caricati {len(records)} record da '{csv_path}'")

    if not records:
        logger.error("Il CSV è vuoto.")
        sys.exit(1)

    stats = {"ok": 0, "fail": 0}

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=False,
            args=["--start-maximized"],
        )
        context: BrowserContext = await browser.new_context(
            viewport=None,
            accept_downloads=True,
            locale="it-IT",
        )
        page: Page = await context.new_page()

        # apre Sister
        logger.info(f"Apertura: {SISTER_URL}")
        try:
            await page.goto(SISTER_URL, timeout=30_000)
            await page.wait_for_load_state("domcontentloaded", timeout=20_000)
        except Exception as e:
            logger.error(f"Impossibile aprire Sister: {e}")
            await browser.close()
            sys.exit(1)

        # pausa autenticazione SPID (una sola volta per tutta la sessione)
        await _attendi_autenticazione(page, logger)

        # loop principale
        for idx, record in enumerate(records):
            success = await _processa_record(page, record, idx, logger)

            if success:
                stats["ok"] += 1
                logger.info(f"  [OK] Record {idx + 1} completato")
            else:
                stats["fail"] += 1
                logger.warning(f"  [FAIL] Record {idx + 1} - proseguo col successivo")

            # pausa tra visure per non sovraccaricare il portale
            if idx < len(records) - 1:
                await page.wait_for_timeout(2_500)

        await browser.close()

    # riepilogo
    print()
    print("╔══════════════════════════════════════════════════════════╗")
    print(f"║  COMPLETATO: {stats['ok']} OK  |  {stats['fail']} FALLITI  |  {len(records)} totali")
    print(f"║  Output: {str(OUTPUT_DIR.resolve())}")
    print(f"║  Log:    {str(LOG_DIR.resolve())}")
    print("╚══════════════════════════════════════════════════════════╝")

    logger.info(
        f"FINE: {stats['ok']} ok, {stats['fail']} falliti su {len(records)} totali"
    )


if __name__ == "__main__":
    asyncio.run(main())
