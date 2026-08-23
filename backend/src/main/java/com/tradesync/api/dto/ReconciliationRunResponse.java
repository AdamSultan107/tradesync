package com.tradesync.api.dto;

import com.tradesync.persistence.entity.ReconciliationRunEntity;
import com.tradesync.persistence.entity.ReconciliationRunStatus;

import java.time.Instant;

public record ReconciliationRunResponse(
        Long runId,
        ReconciliationRunStatus status,
        Instant startedAt,
        Instant completedAt,
        int internalTradeCount,
        int externalTradeCount,
        int matchedCount,
        int exceptionCount
) {

    public static ReconciliationRunResponse from(ReconciliationRunEntity run) {
        return new ReconciliationRunResponse(
                run.getId(),
                run.getStatus(),
                run.getStartedAt(),
                run.getCompletedAt(),
                run.getInternalTradeCount(),
                run.getExternalTradeCount(),
                run.getMatchedCount(),
                run.getExceptionCount()
        );
    }
}
