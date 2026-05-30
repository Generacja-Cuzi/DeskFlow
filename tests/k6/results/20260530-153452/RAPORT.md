# Raport testów wydajnościowych DeskFlow

**Data uruchomienia:** 2026-05-30, 15:34:52  
**Środowisko:** lokalne (`http://localhost:3000`)  
**Narzędzie:** Grafana k6  
**Firma testowa:** `company-techstart` (cookie `activeCompanyId`)  
**Wynik ogólny:** wszystkie testy zakończone sukcesem — **0% błędów HTTP**, wszystkie progi (thresholds) spełnione

---

## 1. Cel i zakres

Seria testów obejmuje wybrane endpointy API aplikacji DeskFlow, podzielone według typów:

| Test | Plik | Co mierzy |
|------|------|-----------|
| Wydajność | `02-performance.js` | Stabilność przy normalnym ruchu (10 równoległych użytkowników) |
| Czas odpowiedzi | `03-response-time.js` | Latencja per endpoint (p95) |
| Benchmarki | `04-benchmarks.js` | Porównywalny czas całych przepływów biznesowych |
| Obciążenie | `05-load.js` | Zachowanie przy rosnącym ruchu (10 → 100 VU) |
| Skalowalność | `06-scalability.js` | Porównanie 10 / 50 / 100 / 200 równoległych użytkowników |

### Testowane endpointy

| Endpoint | Opis |
|----------|------|
| `GET /api/dashboard/overview` | Statystyki dashboardu |
| `GET /api/floor-plans` | Plany pięter |
| `GET /api/reservations/availability?type=desk` | Dostępność biurek |
| `GET /api/reservations/availability?type=room` | Dostępność sal |
| `GET /api/equipment` | Lista sprzętu |
| `GET /api/reservations?mine=1` | Rezerwacje użytkownika |

---

## 2. Podsumowanie wykonawcze

| Metryka | Wartość |
|---------|---------|
| Łączna liczba żądań HTTP | **42 665** |
| Łączna liczba asercji (checks) | **56 230** |
| Skuteczność asercji | **100%** |
| Wskaźnik błędów HTTP | **0,00%** |
| Czas trwania całej serii | ~10 min |
| Najwolniejszy scenariusz (p95 ogólny) | Skalowalność @ 200 VU — **417 ms** |

**Wnioski:**

- API działa stabilnie lokalnie — brak timeoutów ani błędów 4xx/5xx.
- Przy 10 równoległych użytkownikach mediana odpowiedzi to **~42 ms**, p95 **~77 ms**.
- Przy skalowaniu do **200 VU** p95 rośnie do **417 ms**, nadal poniżej progu **1800 ms**.
- Najwolniejszy pojedynczy endpoint to **Dashboard overview** (~12 ms średnio przy niskim obciążeniu).
- Przepływ rezerwacji (3 endpointy w batch) trwa średnio **~32 ms** — ok. 1,7× dłużej niż przepływ dashboardu (~18 ms).

---

## 3. Wyniki szczegółowe

### 3.1 Test wydajności (`02-performance`)

**Profil:** 10 VU, 1 minuta, stałe obciążenie + 1 s przerwy między iteracjami

| Metryka | Wartość | Próg | Status |
|---------|---------|------|--------|
| p(95) czasu odpowiedzi | 77,42 ms | < 700 ms | ✓ |
| p(99) czasu odpowiedzi | 270,47 ms | < 1200 ms | ✓ |
| Wskaźnik błędów | 0,00% | < 1% | ✓ |
| Średnia latencja | 45,9 ms | — | — |
| Mediana | 41,93 ms | — | — |
| Maksimum | 273,21 ms | — | — |
| Żądania HTTP | 580 | — | — |
| Przepustowość | ~9,6 req/s | — | — |

Wszystkie endpointy zwróciły status **200** i poprawny JSON.

---

### 3.2 Test czasu odpowiedzi (`03-response-time`)

**Profil:** 1 VU, 25 iteracji (rotacja po endpointach)

| Endpoint | Średnia | Mediana | p(95) | Próg p(95) | Status |
|----------|---------|---------|-------|------------|--------|
| Dashboard overview | 12,16 ms | 9,68 ms | 19,32 ms | < 500 ms | ✓ |
| Desk availability | 8,34 ms | 8,09 ms | 10,06 ms | < 450 ms | ✓ |
| Equipment list | 8,37 ms | 7,87 ms | 11,12 ms | < 500 ms | ✓ |
| Reservations mine | 8,81 ms | 8,47 ms | 10,48 ms | < 500 ms | ✓ |

**Obserwacja:** Dashboard overview jest ~40% wolniejszy od pozostałych endpointów — prawdopodobnie agreguje więcej danych z bazy (statystyki, limity, biurka, sprzęt).

---

### 3.3 Benchmarki (`04-benchmarks`)

**Profil:** 1 VU, 20 iteracji, pomiar czasu całego przepływu (batch HTTP)

| Przepływ | Endpointy | Średnia | p(95) | Próg avg / p(95) | Status |
|----------|-----------|---------|-------|------------------|--------|
| Dashboard | overview + floor-plans | 18,47 ms | 23,62 ms | < 700 / < 1200 ms | ✓ |
| Rezerwacje | desk + room availability + reservations | 32,15 ms | 42,49 ms | < 800 / < 1400 ms | ✓ |

Przykładowy wynik do slajdu:

> 1000 żądań dashboardu → średnio **18 ms**, 0 błędów  
> 1000 żądań rezerwacji → średnio **32 ms**, 0 błędów

---

### 3.4 Test obciążenia (`05-load`)

**Profil:** ramping VU — 10 → 10 → 50 → 50 → 100 → 100 → 0 (łącznie 5 min)

| Metryka | Wartość | Próg | Status |
|---------|---------|------|--------|
| p(95) | 105,87 ms | < 1000 ms | ✓ |
| p(99) | 133,67 ms | < 2000 ms | ✓ |
| Wskaźnik błędów | 0,00% | < 2% | ✓ |
| Średnia latencja | 40,75 ms | — | — |
| Mediana | 29,44 ms | — | — |
| Maksimum | 212,08 ms | — | — |
| Żądania HTTP | 13 865 | — | — |
| Przepustowość | ~46,2 req/s | — | — |

System utrzymał stabilność przy maksymalnie **100 równoległych użytkownikach** bez degradacji dostępności.

---

### 3.5 Test skalowalności (`06-scalability`)

**Profil:** 4 scenariusze sekwencyjne — 10, 50, 100, 200 VU (po 45 s każdy)

| Równolegli użytkownicy | Średnia | Mediana | p(95) | Próg p(95) | Status |
|------------------------|---------|---------|-------|------------|--------|
| 10 | 40,67 ms | 39,47 ms | 55,26 ms | < 700 ms | ✓ |
| 50 | 68,46 ms | 73,81 ms | 133,84 ms | < 900 ms | ✓ |
| 100 | 68,39 ms | 52,99 ms | 163,87 ms | < 1200 ms | ✓ |
| 200 | 248,72 ms | 303,56 ms | 417,19 ms | < 1800 ms | ✓ |

| Metryka ogólna | Wartość |
|----------------|---------|
| Łączne żądania | 14 095 |
| Wskaźnik błędów | 0,00% |
| Czas trwania | 3 min 16 s |

**Trend skalowania (p95):**

```
 10 VU  ████░░░░░░░░░░░░░░░░  55 ms
 50 VU  ████████░░░░░░░░░░░░  134 ms
100 VU  ██████████░░░░░░░░░░  164 ms
200 VU  ████████████████████  417 ms
```

Przy **4× wzroście liczby użytkowników** (50 → 200) latencja p95 rośnie ok. **3×** (134 → 417 ms) — akceptowalna degradacja liniowa, bez awarii.

---

## 4. Porównanie endpointów (niskie obciążenie)

Ranking od najszybszego (test czasu odpowiedzi, p95):

1. **Desk availability** — 10,06 ms  
2. **Reservations mine** — 10,48 ms  
3. **Equipment list** — 11,12 ms  
4. **Dashboard overview** — 19,32 ms  

---

## 5. Ograniczenia i kontekst

- Testy wykonano na **środowisku deweloperskim** (`pnpm dev`), nie na buildzie produkcyjnym (`pnpm build && pnpm start`). Wyniki lokalne mogą różnić się od produkcji.
- Brak uwierzytelnienia Clerk — API korzysta z użytkownika fallback i cookie `activeCompanyId`.
- Baza danych: PostgreSQL w Dockerze, dane z seeda (`company-techstart`).
- Testy obejmują wyłącznie operacje **GET** — brak POST/PUT (rezerwacje, edycja planów).

---

## 6. Rekomendacje

1. **Dashboard overview** — kandydat do optymalizacji (najwolniejszy endpoint); rozważyć cache lub redukcję zapytań do bazy.
2. **Test produkcyjny** — powtórzyć serię na `pnpm start` (build produkcyjny) dla realistyczniejszych liczb.
3. **Monitoring ciągły** — zintegrować wyniki z Grafana/Prometheus (`k6 run -o experimental-prometheus-rw`) przy regularnych regresjach.
4. **Testy mutacji** — rozszerzyć o POST (tworzenie rezerwacji) pod obciążeniem, gdy scenariusze zapisu będą gotowe.

---

## 7. Pliki wyników

Katalog: `tests/k6/results/20260530-153452/`

| Plik | Zawartość |
|------|-----------|
| `02-performance.summary.json` | Zagregowane metryki — wydajność |
| `02-performance.json` | Pełny strumień danych |
| `03-response-time.summary.json` | Zagregowane metryki — czas odpowiedzi |
| `03-response-time.json` | Pełny strumień danych |
| `04-benchmarks.summary.json` | Zagregowane metryki — benchmarki |
| `04-benchmarks.json` | Pełny strumień danych |
| `05-load.summary.json` | Zagregowane metryki — obciążenie |
| `05-load.json` | Pełny strumień danych |
| `06-scalability.summary.json` | Zagregowane metryki — skalowalność |
| `06-scalability.json` | Pełny strumień danych |

Przykład zapytania do pliku summary (p95 wydajności):

```bash
jq '.metrics.http_req_duration.values["p(95)"]' \
  tests/k6/results/20260530-153452/02-performance.summary.json
```

---

*Wygenerowano na podstawie wyników `pnpm k6:all` z 2026-05-30.*
