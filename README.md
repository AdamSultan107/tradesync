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

## Technology

- Java
- Spring Boot
- Spring Web
- Spring Data JPA
- PostgreSQL
- Maven
- JUnit
- React
- TypeScript
- Vite
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

## Testing

Run backend tests from the `backend/` directory:

```bash
cd backend
mvn test
```

Backend tests use an in-memory database and do not require Docker.
