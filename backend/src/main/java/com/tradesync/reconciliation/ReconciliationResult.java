package com.tradesync.reconciliation;

import com.tradesync.trade.TradeRecord;

import java.util.List;

public record ReconciliationResult(
        String tradeId,
        ReconciliationStatus status,
        List<TradeRecord> internalTrades,
        List<TradeRecord> externalTrades,
        String description
) {

    public ReconciliationResult {
        internalTrades = List.copyOf(internalTrades);
        externalTrades = List.copyOf(externalTrades);
    }
}
