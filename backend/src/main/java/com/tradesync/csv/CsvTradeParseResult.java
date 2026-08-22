package com.tradesync.csv;

import com.tradesync.trade.TradeRecord;

import java.util.List;

public record CsvTradeParseResult(
        List<TradeRecord> trades,
        List<CsvTradeValidationError> errors
) {

    public CsvTradeParseResult {
        trades = List.copyOf(trades);
        errors = List.copyOf(errors);
    }

    public boolean hasErrors() {
        return !errors.isEmpty();
    }
}
