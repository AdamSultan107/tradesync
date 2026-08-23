package com.tradesync.api.dto;

import com.tradesync.csv.CsvTradeValidationError;
import com.tradesync.trade.TradeSource;

public record CsvValidationErrorResponse(
        TradeSource source,
        long lineNumber,
        String field,
        String message
) {

    public static CsvValidationErrorResponse from(
            TradeSource source,
            CsvTradeValidationError error
    ) {
        return new CsvValidationErrorResponse(
                source,
                error.lineNumber(),
                error.field(),
                error.message()
        );
    }
}
