package com.tradesync.api.dto;

import com.tradesync.persistence.entity.ExceptionResolutionEntity;
import com.tradesync.persistence.entity.ReconciliationResultEntity;
import com.tradesync.persistence.entity.TradeEntity;
import com.tradesync.reconciliation.ReconciliationStatus;
import com.tradesync.trade.TradeSource;

import java.time.Instant;
import java.util.List;

public record StoredReconciliationResultResponse(
        Long resultId,
        String tradeId,
        ReconciliationStatus status,
        String description,
        Instant createdAt,
        List<TradeResponse> internalTrades,
        List<TradeResponse> externalTrades,
        ExceptionResolutionResponse latestResolution
) {

    public StoredReconciliationResultResponse {
        internalTrades = List.copyOf(internalTrades);
        externalTrades = List.copyOf(externalTrades);
    }

    public static StoredReconciliationResultResponse from(
            ReconciliationResultEntity result,
            List<TradeEntity> trades,
            ExceptionResolutionEntity latestResolution
    ) {
        return new StoredReconciliationResultResponse(
                result.getId(),
                result.getTradeId(),
                result.getStatus(),
                result.getDescription(),
                result.getCreatedAt(),
                trades.stream()
                        .filter(trade -> trade.getSource() == TradeSource.INTERNAL)
                        .map(TradeResponse::from)
                        .toList(),
                trades.stream()
                        .filter(trade -> trade.getSource() == TradeSource.EXTERNAL)
                        .map(TradeResponse::from)
                        .toList(),
                latestResolution == null ? null : ExceptionResolutionResponse.from(latestResolution)
        );
    }
}
