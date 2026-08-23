package com.tradesync.persistence.service;

import com.tradesync.persistence.entity.ReconciliationResultEntity;
import com.tradesync.persistence.entity.ReconciliationRunEntity;
import com.tradesync.persistence.entity.ReconciliationRunStatus;
import com.tradesync.persistence.entity.TradeEntity;
import com.tradesync.persistence.repository.ReconciliationResultRepository;
import com.tradesync.persistence.repository.ReconciliationRunRepository;
import com.tradesync.persistence.repository.TradeRepository;
import com.tradesync.reconciliation.ReconciliationResult;
import com.tradesync.reconciliation.ReconciliationStatus;
import com.tradesync.trade.TradeRecord;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReconciliationPersistenceService {

    private final ReconciliationRunRepository runRepository;
    private final TradeRepository tradeRepository;
    private final ReconciliationResultRepository resultRepository;

    public ReconciliationPersistenceService(
            ReconciliationRunRepository runRepository,
            TradeRepository tradeRepository,
            ReconciliationResultRepository resultRepository
    ) {
        this.runRepository = runRepository;
        this.tradeRepository = tradeRepository;
        this.resultRepository = resultRepository;
    }

    @Transactional
    public ReconciliationRunEntity saveCompletedRun(
            List<TradeRecord> internalTrades,
            List<TradeRecord> externalTrades,
            List<ReconciliationResult> results
    ) {
        Instant startedAt = Instant.now();
        ReconciliationRunEntity run = runRepository.save(
                new ReconciliationRunEntity(ReconciliationRunStatus.PROCESSING, startedAt)
        );

        saveTrades(run, internalTrades);
        saveTrades(run, externalTrades);
        saveResults(run, results);

        int matchedCount = matchedCount(results);
        int exceptionCount = results.size() - matchedCount;
        run.markCompleted(Instant.now(), internalTrades.size(), externalTrades.size(), matchedCount, exceptionCount);

        return runRepository.save(run);
    }

    private void saveTrades(ReconciliationRunEntity run, List<TradeRecord> trades) {
        Instant createdAt = Instant.now();
        List<TradeEntity> tradeEntities = new ArrayList<>();

        for (TradeRecord trade : trades) {
            tradeEntities.add(new TradeEntity(
                    run,
                    trade.source(),
                    trade.tradeId(),
                    trade.symbol(),
                    trade.quantity(),
                    trade.price(),
                    trade.currency(),
                    trade.tradeDate(),
                    createdAt
            ));
        }

        tradeRepository.saveAll(tradeEntities);
    }

    private void saveResults(ReconciliationRunEntity run, List<ReconciliationResult> results) {
        Instant createdAt = Instant.now();
        List<ReconciliationResultEntity> resultEntities = new ArrayList<>();

        for (ReconciliationResult result : results) {
            resultEntities.add(new ReconciliationResultEntity(
                    run,
                    result.tradeId(),
                    result.status(),
                    result.description(),
                    createdAt
            ));
        }

        resultRepository.saveAll(resultEntities);
    }

    private int matchedCount(List<ReconciliationResult> results) {
        int matchedCount = 0;
        for (ReconciliationResult result : results) {
            if (result.status() == ReconciliationStatus.MATCHED) {
                matchedCount++;
            }
        }
        return matchedCount;
    }
}
