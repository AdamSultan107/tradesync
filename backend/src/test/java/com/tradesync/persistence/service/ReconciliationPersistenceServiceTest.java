package com.tradesync.persistence.service;

import com.tradesync.persistence.entity.ReconciliationRunStatus;
import com.tradesync.persistence.repository.ReconciliationResultRepository;
import com.tradesync.persistence.repository.ReconciliationRunRepository;
import com.tradesync.persistence.repository.TradeRepository;
import com.tradesync.reconciliation.ReconciliationEngine;
import com.tradesync.reconciliation.ReconciliationResult;
import com.tradesync.reconciliation.ReconciliationStatus;
import com.tradesync.trade.TradeRecord;
import com.tradesync.trade.TradeSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(showSql = false)
@Import(ReconciliationPersistenceService.class)
class ReconciliationPersistenceServiceTest {

    @Autowired
    private ReconciliationPersistenceService persistenceService;

    @Autowired
    private ReconciliationRunRepository runRepository;

    @Autowired
    private TradeRepository tradeRepository;

    @Autowired
    private ReconciliationResultRepository resultRepository;

    private final ReconciliationEngine reconciliationEngine = new ReconciliationEngine();

    @Test
    void savesCompletedReconciliationRunWithTradesAndResults() {
        List<TradeRecord> internalTrades = List.of(
                trade(TradeSource.INTERNAL, "T001", "100", "225.40", "USD"),
                trade(TradeSource.INTERNAL, "T002", "50", "510.25", "USD")
        );
        List<TradeRecord> externalTrades = List.of(
                trade(TradeSource.EXTERNAL, "T001", "100", "225.40", "USD"),
                trade(TradeSource.EXTERNAL, "T002", "50", "511.00", "USD")
        );
        List<ReconciliationResult> results = reconciliationEngine.reconcile(internalTrades, externalTrades);

        var savedRun = persistenceService.saveCompletedRun(internalTrades, externalTrades, results);

        assertThat(runRepository.findById(savedRun.getId()))
                .get()
                .satisfies(run -> {
                    assertThat(run.getStatus()).isEqualTo(ReconciliationRunStatus.COMPLETED);
                    assertThat(run.getInternalTradeCount()).isEqualTo(2);
                    assertThat(run.getExternalTradeCount()).isEqualTo(2);
                    assertThat(run.getMatchedCount()).isEqualTo(1);
                    assertThat(run.getExceptionCount()).isEqualTo(1);
                    assertThat(run.getCompletedAt()).isNotNull();
                });

        assertThat(tradeRepository.findByRunIdOrderById(savedRun.getId())).hasSize(4);
        assertThat(resultRepository.findByRunIdOrderById(savedRun.getId()))
                .extracting(result -> result.getStatus())
                .containsExactly(ReconciliationStatus.MATCHED, ReconciliationStatus.PRICE_MISMATCH);
    }

    private TradeRecord trade(
            TradeSource source,
            String tradeId,
            String quantity,
            String price,
            String currency
    ) {
        return new TradeRecord(
                source,
                tradeId,
                "AAPL",
                new BigDecimal(quantity),
                new BigDecimal(price),
                currency,
                LocalDate.of(2026, 8, 18)
        );
    }
}
