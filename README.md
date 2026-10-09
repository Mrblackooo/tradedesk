# Trading desk autonomo (zero costi, nessuna API key)

Tutto parte e continua da solo, senza pulsanti:
- **Scansione automatica**: al primo avvio e poi ogni domenica il worker prova 3 strategie con decine di parametri e 7 combinazioni SL/TP su 8 asset e 2 timeframe (config.json > universe), scarta quelle che non reggono sul test e tiene le migliori (max 4, una per asset). Se non ne trova, non propone segnali.
- **Segnali ogni 15 minuti** con entry, SL, TP e size in base al rischio per trade.
- **Filtro news**: RSS + calendario macro + modello linguistico locale (FinBERT) che valuta il sentiment dei titoli. Gira dentro GitHub Actions: niente chiavi, niente costi. Se non riesce a scaricarlo, il desk continua col filtro a parole chiave.
- **Paper trading e promozione**: ogni segnale è un'operazione virtuale. Dopo `minPaper` trade chiusi (10 di default) la strategia diventa "promossa" se il R medio è positivo, "sospesa" se è negativo.
- La webapp mostra tutto da sola.

## Aggiornare un repository già esistente
Carica nella radice i file di questa cartella (compresa .github/workflows/signals.yml e package.json). Il push fa partire tutto da solo.

## Note
- Il primo avvio scarica il modello (~100 MB) da Hugging Face e lo mette in cache; l'installazione può richiedere qualche minuto.
- Il sentiment per parole chiave e FinBERT sono strumenti grezzi sui titoli crypto: servono come filtro di rischio, non come previsione.
- Se Binance risponde 451 dai server GitHub, serve una fonte dati alternativa.
- GitHub può sospendere i workflow pianificati dopo molto tempo senza attività nel repository.
