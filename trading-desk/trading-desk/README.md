# Trading desk (zero costi)

Cosa fa: ogni 15 minuti un worker su GitHub Actions scarica le candele, calcola i segnali (con SL/TP in ATR),
li filtra con notizie RSS e calendario macro, registra ogni segnale come operazione virtuale (paper trading)
e scrive tutto in data/state.json. La webapp (index.html) mostra segnali e statistiche. Ogni domenica il
workflow "retest" rivaluta le strategie e disattiva quelle che non reggono più.
Nessun ordine viene eseguito: sono solo segnali.

## Setup (10 minuti)
1. Crea un repository **pubblico** su GitHub e carica tutto il contenuto di questa cartella (anche la cartella .github).
2. Repository > Settings > Actions > General > Workflow permissions: **Read and write**.
3. Tab Actions > workflow **retest** > Run workflow (cerca le strategie per BTC, ETH, XRP, SOL).
4. Tab Actions > workflow **signals** > Run workflow. Poi parte da solo ogni 15 minuti.
5. Vercel: New Project > importa il repository (nessuna configurazione). vercel.json evita di rifare il deploy a ogni aggiornamento dei dati.
6. Apri la webapp, scrivi `utente/nome-repo` nella sezione Trading desk e premi Collega.

## Note
- Per cambiare asset, timeframe, rischio per trade o costi modifica config.json.
- Se Binance risponde 451 dai server GitHub (blocco geografico), serve una fonte dati alternativa.
- GitHub può sospendere i workflow pianificati dopo un lungo periodo senza attività nel repository: se i segnali si fermano, riattivali dalla tab Actions.
- Le news sono un filtro semplice per parole chiave, non un'analisi. Il calendario macro usa una fonte non ufficiale: se non risponde, il filtro non blocca nulla.
