# Trading desk autonomo (zero costi)

Tutto parte e continua da solo, senza pulsanti:
- **Scansione automatica**: al primo avvio e poi ogni domenica il worker prova 3 strategie con decine di parametri e 7 combinazioni SL/TP su 8 asset e 2 timeframe (config.json > universe), scarta quelle che non reggono sul test e tiene le migliori (max 4, una per asset). Se non ne trova, non propone segnali.
- **Segnali ogni 15 minuti** con entry, SL, TP e size in base al rischio per trade.
- **Filtro news**: RSS + calendario macro + (opzionale) analisi LLM del rischio notizie.
- **Paper trading e promozione**: ogni segnale è un'operazione virtuale. Dopo `minPaper` trade chiusi (10 di default) la strategia diventa "promossa" se il R medio è positivo, "sospesa" (nessun segnale operativo) se è negativo.
- La webapp mostra tutto da sola.

## Aggiornare un repository già esistente
Carica nella radice i file di questa cartella (compresa .github/workflows/signals.yml). Il push fa partire tutto da solo.
Il workflow "retest" resta come rete di sicurezza settimanale.

## LLM (facoltativo, non gratuito)
Repository > Settings > Secrets and variables > Actions > New repository secret: `ANTHROPIC_API_KEY`.
Il modello legge i titoli recenti e valuta solo il rischio delle notizie (non crea segnali). Al massimo una chiamata
all'ora e solo se i titoli cambiano. Senza chiave il desk funziona uguale, con il filtro a parole chiave.

## Note
- Se Binance risponde 451 dai server GitHub, serve una fonte dati alternativa.
- GitHub può sospendere i workflow pianificati dopo molto tempo senza attività nel repository.
- Tante combinazioni testate aumentano il rischio di strategie fortunate: per questo i criteri sono severi e c'è la fase di osservazione col paper trading.
