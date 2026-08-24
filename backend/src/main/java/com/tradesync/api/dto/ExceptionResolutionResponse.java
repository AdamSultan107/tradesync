package com.tradesync.api.dto;

import com.tradesync.persistence.entity.ExceptionResolutionEntity;
import com.tradesync.persistence.entity.ResolutionStatus;

import java.time.Instant;

public record ExceptionResolutionResponse(
        Long resolutionId,
        Long resultId,
        ResolutionStatus resolutionStatus,
        String note,
        Instant resolvedAt
) {

    public static ExceptionResolutionResponse from(ExceptionResolutionEntity resolution) {
        return new ExceptionResolutionResponse(
                resolution.getId(),
                resolution.getResult().getId(),
                resolution.getResolutionStatus(),
                resolution.getNote(),
                resolution.getResolvedAt()
        );
    }
}
