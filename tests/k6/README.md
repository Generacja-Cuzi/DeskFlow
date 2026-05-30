# Testy k6 dla DeskFlow

Skrypty sa podzielone zgodnie z typami testow:

- `02-performance.js` - testy wydajnosci: stabilnosc i czas odpowiedzi przy normalnym ruchu.
- `03-response-time.js` - testy czasu odpowiedzi: progi p95 dla wybranych endpointow.
- `04-benchmarks.js` - benchmarki: porownywalne wyniki dla przeplywu dashboardu i rezerwacji.
- `05-load.js` - testy obciazenia: stopniowy wzrost liczby VU.
- `06-scalability.js` - testy skalowalnosci: porownanie 10, 50, 100 i 200 uzytkownikow.

## Uruchamianie (lokalnie)

Najpierw uruchom aplikacje lokalnie:

```bash
pnpm dev
```

Potem uruchom wybrany test:

```bash
k6 run tests/k6/02-performance.js
k6 run tests/k6/03-response-time.js
k6 run tests/k6/04-benchmarks.js
k6 run tests/k6/05-load.js
k6 run tests/k6/06-scalability.js
```

Nie trzeba nic dodatkowo ustawiac. Bez sesji Clerk API lokalnie uzywa uzytkownika fallback, a cookie `activeCompanyId=company-techstart` jest dokladane automatycznie, wiec endpointy zwracaja `200`.

Domyslny adres to `http://localhost:3000`. Mozesz go zmienic przez `BASE_URL`, a firme przez `ACTIVE_COMPANY_ID`:

```bash
ACTIVE_COMPANY_ID=company-demo k6 run tests/k6/03-response-time.js
```

## Wszystkie testy + zapis wynikow

Aby uruchomic cala serie po kolei i zapisac wyniki do plikow (wynik nadal jest drukowany w terminalu):

```bash
pnpm k6:all
```

Kazdy uruchomienie tworzy katalog `tests/k6/results/<timestamp>/` z dwoma plikami na test:

- `<test>.summary.json` - zagregowane metryki (percentyle, liczniki, progi) - najwygodniejsze do prezentacji.
- `<test>.json` - pelny strumien danych (kazdy request) do szczegolowej analizy (np. `jq`).

Katalog `tests/k6/results/` jest ignorowany przez git.

Przyklad wyciagniecia p95 czasu odpowiedzi dla endpointu z `summary.json`:

```bash
jq '.metrics.http_req_duration.values["p(95)"]' tests/k6/results/<timestamp>/02-performance.summary.json
```

## Eksport do Grafana Cloud

Przy skonfigurowanym k6 Cloud:

```bash
k6 cloud tests/k6/05-load.js
```

Lokalnie z outputem do Prometheusa remote write:

```bash
K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write \
k6 run -o experimental-prometheus-rw tests/k6/05-load.js
```
