package com.tradesync.csv;

public record CsvTradeValidationError(
        long lineNumber,
        String field,
        String message
) {
}
