package com.tradesync.csv;

import com.tradesync.trade.TradeRecord;
import com.tradesync.trade.TradeSource;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.Reader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Currency;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class CsvTradeParser {

    private static final String TRADE_ID = "trade_id";
    private static final String SYMBOL = "symbol";
    private static final String QUANTITY = "quantity";
    private static final String PRICE = "price";
    private static final String CURRENCY = "currency";
    private static final String TRADE_DATE = "trade_date";

    private static final Set<String> REQUIRED_HEADERS = Set.of(
            TRADE_ID,
            SYMBOL,
            QUANTITY,
            PRICE,
            CURRENCY,
            TRADE_DATE
    );

    private static final CSVFormat TRADE_CSV_FORMAT = CSVFormat.DEFAULT.builder()
            .setHeader()
            .setSkipHeaderRecord(true)
            .setTrim(true)
            .setIgnoreEmptyLines(true)
            .get();

    public CsvTradeParseResult parse(Reader reader, TradeSource source) {
        List<RowCandidate> candidates = new ArrayList<>();
        List<CsvTradeValidationError> errors = new ArrayList<>();

        try (CSVParser parser = TRADE_CSV_FORMAT.parse(reader)) {
            if (!validateHeaders(parser, errors)) {
                return new CsvTradeParseResult(List.of(), errors);
            }

            for (CSVRecord record : parser) {
                parseRecord(record, source, candidates, errors);
            }
        } catch (IOException | IllegalArgumentException exception) {
            errors.add(new CsvTradeValidationError(0, "file", "Unable to parse trade CSV file."));
        }

        return rejectDuplicateTradeIds(candidates, errors);
    }

    private boolean validateHeaders(CSVParser parser, List<CsvTradeValidationError> errors) {
        Set<String> actualHeaders = parser.getHeaderMap().keySet();

        for (String requiredHeader : REQUIRED_HEADERS) {
            if (!actualHeaders.contains(requiredHeader)) {
                errors.add(new CsvTradeValidationError(1, "header", "Missing required CSV header: " + requiredHeader));
            }
        }

        return errors.isEmpty();
    }

    private void parseRecord(
            CSVRecord record,
            TradeSource source,
            List<RowCandidate> candidates,
            List<CsvTradeValidationError> errors
    ) {
        long lineNumber = record.getRecordNumber() + 1;
        List<CsvTradeValidationError> rowErrors = new ArrayList<>();

        String tradeId = requiredText(record, TRADE_ID, lineNumber, rowErrors);
        String symbol = normalizeRequiredText(record, SYMBOL, lineNumber, rowErrors);
        BigDecimal quantity = positiveDecimal(record, QUANTITY, lineNumber, rowErrors);
        BigDecimal price = positiveDecimal(record, PRICE, lineNumber, rowErrors);
        String currency = validCurrency(record, lineNumber, rowErrors);
        LocalDate tradeDate = validDate(record, lineNumber, rowErrors);

        if (rowErrors.isEmpty()) {
            TradeRecord trade = new TradeRecord(source, tradeId, symbol, quantity, price, currency, tradeDate);
            candidates.add(new RowCandidate(lineNumber, trade));
        } else {
            errors.addAll(rowErrors);
        }
    }

    private CsvTradeParseResult rejectDuplicateTradeIds(
            List<RowCandidate> candidates,
            List<CsvTradeValidationError> errors
    ) {
        Map<String, Integer> tradeIdCounts = new HashMap<>();
        for (RowCandidate candidate : candidates) {
            tradeIdCounts.merge(candidate.trade.tradeId(), 1, Integer::sum);
        }

        List<TradeRecord> trades = new ArrayList<>();
        for (RowCandidate candidate : candidates) {
            if (tradeIdCounts.get(candidate.trade.tradeId()) > 1) {
                errors.add(new CsvTradeValidationError(
                        candidate.lineNumber,
                        TRADE_ID,
                        "Duplicate trade ID within source: " + candidate.trade.tradeId()
                ));
            } else {
                trades.add(candidate.trade);
            }
        }

        return new CsvTradeParseResult(trades, errors);
    }

    private String requiredText(
            CSVRecord record,
            String field,
            long lineNumber,
            List<CsvTradeValidationError> errors
    ) {
        String value = record.get(field).trim();
        if (value.isBlank()) {
            errors.add(new CsvTradeValidationError(lineNumber, field, "Value is required."));
            return null;
        }
        return value;
    }

    private String normalizeRequiredText(
            CSVRecord record,
            String field,
            long lineNumber,
            List<CsvTradeValidationError> errors
    ) {
        String value = requiredText(record, field, lineNumber, errors);
        return value == null ? null : value.toUpperCase();
    }

    private BigDecimal positiveDecimal(
            CSVRecord record,
            String field,
            long lineNumber,
            List<CsvTradeValidationError> errors
    ) {
        String rawValue = requiredText(record, field, lineNumber, errors);
        if (rawValue == null) {
            return null;
        }

        BigDecimal parsedValue;
        try {
            parsedValue = new BigDecimal(rawValue);
        } catch (NumberFormatException exception) {
            errors.add(new CsvTradeValidationError(lineNumber, field, "Value must be a valid decimal number."));
            return null;
        }

        if (parsedValue.compareTo(BigDecimal.ZERO) <= 0) {
            errors.add(new CsvTradeValidationError(lineNumber, field, "Value must be positive."));
            return null;
        }

        return parsedValue;
    }

    private String validCurrency(
            CSVRecord record,
            long lineNumber,
            List<CsvTradeValidationError> errors
    ) {
        String value = normalizeRequiredText(record, CURRENCY, lineNumber, errors);
        if (value == null) {
            return null;
        }

        try {
            Currency.getInstance(value);
            return value;
        } catch (IllegalArgumentException exception) {
            errors.add(new CsvTradeValidationError(lineNumber, CURRENCY, "Value must be a valid ISO currency code."));
            return null;
        }
    }

    private LocalDate validDate(
            CSVRecord record,
            long lineNumber,
            List<CsvTradeValidationError> errors
    ) {
        String value = requiredText(record, TRADE_DATE, lineNumber, errors);
        if (value == null) {
            return null;
        }

        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException exception) {
            errors.add(new CsvTradeValidationError(lineNumber, TRADE_DATE, "Value must use ISO date format yyyy-MM-dd."));
            return null;
        }
    }

    private record RowCandidate(long lineNumber, TradeRecord trade) {
    }
}
