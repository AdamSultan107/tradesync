package com.tradesync.reconciliation;

import com.tradesync.trade.TradeRecord;
import com.tradesync.trade.TradeSource;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ReconciliationEngineTest {

    private final ReconciliationEngine engine = new ReconciliationEngine();

    @Test
    void returnsMatchedWhenTradeEconomicsAgree() {
        List<ReconciliationResult> results = engine.reconcile(
                List.of(trade(TradeSource.INTERNAL, "T001", "100", "225.40", "USD")),
                List.of(trade(TradeSource.EXTERNAL, "T001", "100.0", "225.400", "USD"))
        );

        assertThat(results).hasSize(1);
        assertThat(results.get(0).status()).isEqualTo(ReconciliationStatus.MATCHED);
    }

    @Test
    void returnsPriceMismatchWhenPricesDiffer() {
        List<ReconciliationResult> results = engine.reconcile(
                List.of(trade(TradeSource.INTERNAL, "T001", "100", "225.40", "USD")),
                List.of(trade(TradeSource.EXTERNAL, "T001", "100", "225.41", "USD"))
        );

        assertThat(results.get(0).status()).isEqualTo(ReconciliationStatus.PRICE_MISMATCH);
    }

    @Test
    void returnsQuantityMismatchWhenQuantitiesDiffer() {
        List<ReconciliationResult> results = engine.reconcile(
                List.of(trade(TradeSource.INTERNAL, "T001", "100", "225.40", "USD")),
                List.of(trade(TradeSource.EXTERNAL, "T001", "101", "225.40", "USD"))
        );

        assertThat(results.get(0).status()).isEqualTo(ReconciliationStatus.QUANTITY_MISMATCH);
    }

    @Test
    void returnsCurrencyMismatchWhenCurrenciesDiffer() {
        List<ReconciliationResult> results = engine.reconcile(
                List.of(trade(TradeSource.INTERNAL, "T001", "100", "225.40", "USD")),
                List.of(trade(TradeSource.EXTERNAL, "T001", "100", "225.40", "EUR"))
        );

        assertThat(results.get(0).status()).isEqualTo(ReconciliationStatus.CURRENCY_MISMATCH);
    }

    @Test
    void returnsMissingExternalWhenOnlyInternalTradeExists() {
        List<ReconciliationResult> results = engine.reconcile(
                List.of(trade(TradeSource.INTERNAL, "T001", "100", "225.40", "USD")),
                List.of()
        );

        assertThat(results.get(0).status()).isEqualTo(ReconciliationStatus.MISSING_EXTERNAL);
    }

    @Test
    void returnsMissingInternalWhenOnlyExternalTradeExists() {
        List<ReconciliationResult> results = engine.reconcile(
                List.of(),
                List.of(trade(TradeSource.EXTERNAL, "T001", "100", "225.40", "USD"))
        );

        assertThat(results.get(0).status()).isEqualTo(ReconciliationStatus.MISSING_INTERNAL);
    }

    @Test
    void returnsDuplicateWhenInternalSourceHasRepeatedTradeId() {
        List<ReconciliationResult> results = engine.reconcile(
                List.of(
                        trade(TradeSource.INTERNAL, "T001", "100", "225.40", "USD"),
                        trade(TradeSource.INTERNAL, "T001", "100", "225.40", "USD")
                ),
                List.of(trade(TradeSource.EXTERNAL, "T001", "100", "225.40", "USD"))
        );

        ReconciliationResult result = results.get(0);
        assertThat(result.status()).isEqualTo(ReconciliationStatus.DUPLICATE);
        assertThat(result.internalTrades()).hasSize(2);
        assertThat(result.externalTrades()).hasSize(1);
    }

    @Test
    void returnsDuplicateWhenExternalSourceHasRepeatedTradeId() {
        List<ReconciliationResult> results = engine.reconcile(
                List.of(trade(TradeSource.INTERNAL, "T001", "100", "225.40", "USD")),
                List.of(
                        trade(TradeSource.EXTERNAL, "T001", "100", "225.40", "USD"),
                        trade(TradeSource.EXTERNAL, "T001", "100", "225.40", "USD")
                )
        );

        ReconciliationResult result = results.get(0);
        assertThat(result.status()).isEqualTo(ReconciliationStatus.DUPLICATE);
        assertThat(result.internalTrades()).hasSize(1);
        assertThat(result.externalTrades()).hasSize(2);
    }

    @Test
    void preservesInternalTradeOrderThenAppendsExternalOnlyTrades() {
        List<ReconciliationResult> results = engine.reconcile(
                List.of(
                        trade(TradeSource.INTERNAL, "T002", "100", "225.40", "USD"),
                        trade(TradeSource.INTERNAL, "T001", "100", "225.40", "USD")
                ),
                List.of(
                        trade(TradeSource.EXTERNAL, "T001", "100", "225.40", "USD"),
                        trade(TradeSource.EXTERNAL, "T003", "100", "225.40", "USD")
                )
        );

        assertThat(results)
                .extracting(ReconciliationResult::tradeId)
                .containsExactly("T002", "T001", "T003");
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
