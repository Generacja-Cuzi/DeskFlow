# Testy k6 dla DeskFlow

Skrypty sa podzielone zgodnie z typami testow:

- `02-performance.js` - testy wydajnosci: stabilnosc i czas odpowiedzi przy normalnym ruchu.
- `03-response-time.js` - testy czasu odpowiedzi: progi p95 dla wybranych endpointow.
- `04-benchmarks.js` - benchmarki: porownywalne wyniki dla przeplywu dashboardu i rezerwacji.
- `05-load.js` - testy obciazenia: stopniowy wzrost liczby VU.
- `06-scalability.js` - testy skalowalnosci: porownanie 10, 50, 100 i 200 uzytkownikow.

## Uruchamianie

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

Domyslny adres to `http://localhost:3000`. Mozesz go zmienic przez `BASE_URL`:

```bash
BASE_URL=https://twoja-aplikacja.example.com k6 run tests/k6/02-performance.js
```

Endpointy korzystaja z cookie `activeCompanyId`. Domyslnie ustawiany jest `company-techstart`, ale mozna podac inna firme:

```bash
ACTIVE_COMPANY_ID=company-demo k6 run tests/k6/03-response-time.js
```

Dla srodowisk z wymaganym logowaniem przekaż cookie sesji w `AUTH_COOKIE`:

```bash
AUTH_COOKIE="__session=..." BASE_URL=https://twoja-aplikacja.example.com k6 run tests/k6/02-performance.js
```

Jesli chcesz uruchomic test tylko po to, aby sprawdzic dostepnosc endpointow bez sesji, mozna tymczasowo dopuscic odpowiedzi `401` i `403`:

```bash
ALLOW_AUTH_FAILURES=1 k6 run tests/k6/02-performance.js
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
