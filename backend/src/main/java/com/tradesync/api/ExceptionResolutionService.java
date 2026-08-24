package com.tradesync.api;

import com.tradesync.api.dto.ExceptionResolutionRequest;
import com.tradesync.api.dto.ExceptionResolutionResponse;
import com.tradesync.persistence.entity.ExceptionResolutionEntity;
import com.tradesync.persistence.entity.ReconciliationResultEntity;
import com.tradesync.persistence.entity.ResolutionStatus;
import com.tradesync.persistence.repository.ExceptionResolutionRepository;
import com.tradesync.persistence.repository.ReconciliationResultRepository;
import com.tradesync.reconciliation.ReconciliationStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class ExceptionResolutionService {

    private final ReconciliationResultRepository resultRepository;
    private final ExceptionResolutionRepository resolutionRepository;

    public ExceptionResolutionService(
            ReconciliationResultRepository resultRepository,
            ExceptionResolutionRepository resolutionRepository
    ) {
        this.resultRepository = resultRepository;
        this.resolutionRepository = resolutionRepository;
    }

    @Transactional
    public ExceptionResolutionResponse resolveException(
            Long resultId,
            ExceptionResolutionRequest request
    ) {
        ReconciliationResultEntity result = resultRepository.findById(resultId)
                .orElseThrow(() -> new ReconciliationResultNotFoundException(resultId));

        validateResolvable(result, request.resolutionStatus());

        ExceptionResolutionEntity resolution = resolutionRepository.save(new ExceptionResolutionEntity(
                result,
                request.resolutionStatus(),
                request.note(),
                Instant.now()
        ));

        return ExceptionResolutionResponse.from(resolution);
    }

    private void validateResolvable(
            ReconciliationResultEntity result,
            ResolutionStatus resolutionStatus
    ) {
        if (result.getStatus() == ReconciliationStatus.MATCHED) {
            throw new ExceptionResolutionRejectedException("Matched reconciliation results cannot be resolved.");
        }

        if (resolutionStatus == ResolutionStatus.OPEN) {
            throw new ExceptionResolutionRejectedException("Resolution status must be RESOLVED or IGNORED.");
        }
    }
}
