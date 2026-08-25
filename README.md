# TradeSync

TradeSync is a trade reconciliation and exception-management platform for
comparing trade records from independent sources, identifying discrepancies, and
tracking exception resolution.

## Overview

Financial institutions and trading operations often receive trade records from
multiple systems, such as an internal order platform and an external broker or
clearing provider. Those records must be reconciled so teams can identify missing
records, mismatched economics, duplicate entries, and other operational breaks.

TradeSync provides a structured workflow for ingesting trade files, validating
records, running reconciliation rules, reviewing exceptions, and recording
resolution notes.

Database schema changes are managed with Flyway migrations.

## Features

- CSV trade ingestion
- Trade record validation and normalization
- Trade matching by trade identifier
- Missing-trade detection
- Price, quantity, and currency discrepancy detection
- Duplicate trade detection
- Reconciliation run summaries
- Exception review and resolution workflow
- Resolution notes for auditability
- Health endpoint for service monitoring
- Automated tests for reconciliation logic

## Reconciliation Results

TradeSync classifies reconciliation output with the following result statuses:

- `MATCHED`
- `MISSING_INTERNAL`
- `MISSING_EXTERNAL`
- `PRICE_MISMATCH`
- `QUANTITY_MISMATCH`
- `CURRENCY_MISMATCH`
- `DUPLICATE`

## Architecture

```text
CSV files
   |
Spring Boot REST API
   |
CSV parsing and validation
   |
Reconciliation engine
   |
PostgreSQL
   |
Results and exception workflow
```

The reconciliation engine compares validated internal and external trade records.
Records are grouped by trade identifier, checked for duplicates, and compared
across supported fields such as quantity, price, and currency.

Financial values are represented with decimal types suitable for monetary data.

## CSV Format

TradeSync expects both input files to use the same CSV format:

```csv
trade_id,symbol,quantity,price,currency,trade_date
T001,AAPL,100,225.40,USD,2026-08-18
T002,MSFT,50,510.25,USD,2026-08-18
```

## Sample Data

Sample CSV files are available under `sample-data/`:

- `valid-trades.csv` - valid trade records
- `invalid-trades.csv` - records with validation failures
- `duplicate-trades.csv` - duplicate trade identifiers

## API

Available API endpoints:

- `POST /api/reconciliations` - upload internal and external trade files
- `GET /api/reconciliations/{id}` - get a reconciliation run summary
- `GET /api/reconciliations/{id}/results` - list reconciliation results
- `GET /api/reconciliations/{id}/exceptions` - list exception results
- `PATCH /api/exceptions/{id}/resolve` - resolve an exception with a note
- `GET /actuator/health` - service health check

Upload two trade files:

```bash
curl -X POST http://localhost:8080/api/reconciliations \
  -F "internalFile=@sample-data/valid-trades.csv" \
  -F "externalFile=@sample-data/duplicate-trades.csv"
```

Get a reconciliation run:

```bash
curl http://localhost:8080/api/reconciliations/RUN_ID
```

List reconciliation results:

```bash
curl http://localhost:8080/api/reconciliations/RUN_ID/results
```

List exception results:

```bash
curl http://localhost:8080/api/reconciliations/RUN_ID/exceptions
```

Resolve an exception:

```bash
curl -X PATCH http://localhost:8080/api/exceptions/RESULT_ID/resolve \
  -H "Content-Type: application/json" \
  -d '{"resolutionStatus":"RESOLVED","note":"Reviewed and resolved."}'
```

API errors use a consistent response body:

```json
{
  "message": "Request validation failed.",
  "errors": [
    {
      "field": "note",
      "message": "must not be blank"
    }
  ]
}
```

## Technology

- Java
- Spring Boot
- Spring Web
- Spring Data JPA
- Flyway
- PostgreSQL
- Maven
- JUnit
- React
- TypeScript
- Vite
- Tailwind CSS
- Docker Compose

## Running Locally

Start PostgreSQL from the repository root:

```bash
docker compose up -d
```

Run the backend:

```bash
cd backend
mvn spring-boot:run
```

The health endpoint is available at:

```text
http://localhost:8080/actuator/health
```

Flyway applies database migrations when the backend starts.

Run the frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend is available at:

```text
http://localhost:5173
```

During local development, the Vite server proxies `/api` requests to the backend
at `http://localhost:8080`.

## Testing

Run backend tests from the `backend/` directory:

```bash
cd backend
mvn test
```

Backend tests use an in-memory database and do not require Docker.
