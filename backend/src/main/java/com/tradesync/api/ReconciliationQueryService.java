package com.tradesync.api;

import com.tradesync.api.dto.ReconciliationRunResponse;
import com.tradesync.api.dto.StoredReconciliationResultResponse;
import com.tradesync.persistence.entity.ReconciliationResultEntity;
import com.tradesync.persistence.entity.ReconciliationRunEntity;
import com.tradesync.persistence.entity.TradeEntity;
import com.tradesync.persistence.repository.ReconciliationResultRepository;
import com.tradesync.persistence.repository.ReconciliationRunRepository;
import com.tradesync.persistence.repository.TradeRepository;
import com.tradesync.reconciliation.ReconciliationStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReconciliationQueryService {

    private static final List<ReconciliationStatus> EXCEPTION_STATUSES = Arrays.stream(ReconciliationStatus.values())
            .filter(status -> status != ReconciliationStatus.MATCHED)
            .toList();

    private final ReconciliationRunRepository runRepository;
    private final ReconciliationResultRepository resultRepository;
    private final TradeRepository tradeRepository;

    public ReconciliationQueryService(
            ReconciliationRunRepository runRepository,
            ReconciliationResultRepository resultRepository,
            TradeRepository tradeRepository
    ) {
        this.runRepository = runRepository;
        this.resultRepository = resultRepository;
        this.tradeRepository = tradeRepository;
    }

    @Transactional(readOnly = true)
    public ReconciliationRunResponse getRun(Long runId) {
        return ReconciliationRunResponse.from(findRun(runId));
    }

    @Transactional(readOnly = true)
    public List<StoredReconciliationResultResponse> getResults(Long runId) {
        findRun(runId);
        List<ReconciliationResultEntity> results = resultRepository.findByRunIdOrderById(runId);
        return toResultResponses(runId, results);
    }

    @Transactional(readOnly = true)
    public List<StoredReconciliationResultResponse> getExceptions(Long runId) {
        findRun(runId);
        List<ReconciliationResultEntity> results = resultRepository.findByRunIdAndStatusInOrderById(
                runId,
                EXCEPTION_STATUSES
        );
        return toResultResponses(runId, results);
    }

    private ReconciliationRunEntity findRun(Long runId) {
        return runRepository.findById(runId)
                .orElseThrow(() -> new ReconciliationNotFoundException(runId));
    }

    private List<StoredReconciliationResultResponse> toResultResponses(
            Long runId,
            List<ReconciliationResultEntity> results
    ) {
        Map<String, List<TradeEntity>> tradesByTradeId = tradeRepository.findByRunIdOrderById(runId).stream()
                .collect(Collectors.groupingBy(TradeEntity::getTradeId));

        return results.stream()
                .map(result -> StoredReconciliationResultResponse.from(
                        result,
                        tradesByTradeId.getOrDefault(result.getTradeId(), List.of())
                ))
                .toList();
    }
}
