package com.tradesync.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.tradesync.csv.CsvTradeValidationError;
import com.tradesync.trade.TradeSource;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiErrorDetailResponse(
        String field,
        String message,
        TradeSource source,
        Long lineNumber
) {

    public static ApiErrorDetailResponse of(String field, String message) {
        return new ApiErrorDetailResponse(field, message, null, null);
    }

    public static ApiErrorDetailResponse from(
            TradeSource source,
            CsvTradeValidationError error
    ) {
        return new ApiErrorDetailResponse(
                error.field(),
                error.message(),
                source,
                error.lineNumber()
        );
    }
}
