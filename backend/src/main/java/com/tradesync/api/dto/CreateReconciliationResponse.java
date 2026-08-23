package com.tradesync.api.dto;

import com.tradesync.persistence.entity.ReconciliationRunEntity;
import com.tradesync.persistence.entity.ReconciliationRunStatus;
import com.tradesync.reconciliation.ReconciliationResult;

import java.time.Instant;
import java.util.List;

public record CreateReconciliationResponse(
        Long runId,
        ReconciliationRunStatus status,
        Instant startedAt,
        Instant completedAt,
        int internalTradeCount,
        int externalTradeCount,
        int matchedCount,
        int exceptionCount,
        List<ReconciliationResultResponse> results
) {

    public CreateReconciliationResponse {
        results = List.copyOf(results);
    }

    public static CreateReconciliationResponse from(
            ReconciliationRunEntity run,
            List<ReconciliationResult> results
    ) {
        return new CreateReconciliationResponse(
                run.getId(),
                run.getStatus(),
                run.getStartedAt(),
                run.getCompletedAt(),
                run.getInternalTradeCount(),
                run.getExternalTradeCount(),
                run.getMatchedCount(),
                run.getExceptionCount(),
                results.stream()
                        .map(ReconciliationResultResponse::from)
                        .toList()
        );
    }
}
