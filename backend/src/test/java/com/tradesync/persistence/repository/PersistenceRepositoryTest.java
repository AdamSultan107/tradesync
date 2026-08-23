package com.tradesync.persistence.repository;

import com.tradesync.persistence.entity.ExceptionResolutionEntity;
import com.tradesync.persistence.entity.ReconciliationResultEntity;
import com.tradesync.persistence.entity.ReconciliationRunEntity;
import com.tradesync.persistence.entity.ReconciliationRunStatus;
import com.tradesync.persistence.entity.ResolutionStatus;
import com.tradesync.persistence.entity.TradeEntity;
import com.tradesync.reconciliation.ReconciliationStatus;
import com.tradesync.trade.TradeSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(showSql = false)
class PersistenceRepositoryTest {

    @Autowired
    private ReconciliationRunRepository runRepository;

    @Autowired
    private TradeRepository tradeRepository;

    @Autowired
    private ReconciliationResultRepository resultRepository;

    @Autowired
    private ExceptionResolutionRepository resolutionRepository;

    @Test
    void persistsReconciliationRunTradesResultsAndResolutionHistory() {
        Instant startedAt = Instant.parse("2026-08-18T14:00:00Z");
        ReconciliationRunEntity run = runRepository.save(
                new ReconciliationRunEntity(ReconciliationRunStatus.PROCESSING, startedAt)
        );

        TradeEntity internalTrade = tradeRepository.save(trade(run, TradeSource.INTERNAL, "T001", "225.40"));
        TradeEntity externalTrade = tradeRepository.save(trade(run, TradeSource.EXTERNAL, "T001", "225.41"));

        ReconciliationResultEntity result = resultRepository.save(new ReconciliationResultEntity(
                run,
                "T001",
                ReconciliationStatus.PRICE_MISMATCH,
                "Trade prices differ.",
                Instant.parse("2026-08-18T14:01:00Z")
        ));

        ExceptionResolutionEntity resolution = resolutionRepository.save(new ExceptionResolutionEntity(
                result,
                ResolutionStatus.RESOLVED,
                "Confirmed external price is correct.",
                Instant.parse("2026-08-18T14:05:00Z")
        ));

        run.markCompleted(Instant.parse("2026-08-18T14:06:00Z"), 1, 1, 0, 1);
        runRepository.save(run);

        assertThat(runRepository.findById(run.getId()))
                .get()
                .extracting(ReconciliationRunEntity::getStatus)
                .isEqualTo(ReconciliationRunStatus.COMPLETED);

        assertThat(tradeRepository.findByRunIdAndTradeIdOrderById(run.getId(), "T001"))
                .extracting(TradeEntity::getId)
                .containsExactly(internalTrade.getId(), externalTrade.getId());

        assertThat(resultRepository.findByRunIdAndStatusOrderById(run.getId(), ReconciliationStatus.PRICE_MISMATCH))
                .extracting(ReconciliationResultEntity::getTradeId)
                .containsExactly("T001");

        assertThat(resolutionRepository.findByResultIdOrderByResolvedAtDesc(result.getId()))
                .extracting(ExceptionResolutionEntity::getId)
                .containsExactly(resolution.getId());
    }

    @Test
    void queriesDuplicateTradesByRunAndTradeId() {
        ReconciliationRunEntity run = runRepository.save(new ReconciliationRunEntity(
                ReconciliationRunStatus.PROCESSING,
                Instant.parse("2026-08-18T14:00:00Z")
        ));

        tradeRepository.save(trade(run, TradeSource.INTERNAL, "T001", "225.40"));
        tradeRepository.save(trade(run, TradeSource.INTERNAL, "T001", "225.40"));
        tradeRepository.save(trade(run, TradeSource.EXTERNAL, "T001", "225.40"));

        List<TradeEntity> trades = tradeRepository.findByRunIdAndTradeIdOrderById(run.getId(), "T001");

        assertThat(trades)
                .extracting(TradeEntity::getSource)
                .containsExactly(TradeSource.INTERNAL, TradeSource.INTERNAL, TradeSource.EXTERNAL);
    }

    @Test
    void filtersExceptionResultsByStatusSet() {
        ReconciliationRunEntity run = runRepository.save(new ReconciliationRunEntity(
                ReconciliationRunStatus.PROCESSING,
                Instant.parse("2026-08-18T14:00:00Z")
        ));

        resultRepository.save(result(run, "T001", ReconciliationStatus.MATCHED));
        resultRepository.save(result(run, "T002", ReconciliationStatus.MISSING_EXTERNAL));
        resultRepository.save(result(run, "T003", ReconciliationStatus.DUPLICATE));

        assertThat(resultRepository.findByRunIdAndStatusInOrderById(
                run.getId(),
                List.of(ReconciliationStatus.MISSING_EXTERNAL, ReconciliationStatus.DUPLICATE)
        ))
                .extracting(ReconciliationResultEntity::getTradeId)
                .containsExactly("T002", "T003");
    }

    private TradeEntity trade(
            ReconciliationRunEntity run,
            TradeSource source,
            String tradeId,
            String price
    ) {
        return new TradeEntity(
                run,
                source,
                tradeId,
                "AAPL",
                new BigDecimal("100"),
                new BigDecimal(price),
                "USD",
                LocalDate.of(2026, 8, 18),
                Instant.parse("2026-08-18T14:00:00Z")
        );
    }

    private ReconciliationResultEntity result(
            ReconciliationRunEntity run,
            String tradeId,
            ReconciliationStatus status
    ) {
        return new ReconciliationResultEntity(
                run,
                tradeId,
                status,
                "Test result",
                Instant.parse("2026-08-18T14:01:00Z")
        );
    }
}
