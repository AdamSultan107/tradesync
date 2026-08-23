package com.tradesync.api.dto;

import com.tradesync.reconciliation.ReconciliationResult;
import com.tradesync.reconciliation.ReconciliationStatus;

import java.util.List;

public record ReconciliationResultResponse(
        String tradeId,
        ReconciliationStatus status,
        String description,
        List<TradeResponse> internalTrades,
        List<TradeResponse> externalTrades
) {

    public ReconciliationResultResponse {
        internalTrades = List.copyOf(internalTrades);
        externalTrades = List.copyOf(externalTrades);
    }

    public static ReconciliationResultResponse from(ReconciliationResult result) {
        return new ReconciliationResultResponse(
                result.tradeId(),
                result.status(),
                result.description(),
                result.internalTrades().stream()
                        .map(TradeResponse::from)
                        .toList(),
                result.externalTrades().stream()
                        .map(TradeResponse::from)
                        .toList()
        );
    }
}
