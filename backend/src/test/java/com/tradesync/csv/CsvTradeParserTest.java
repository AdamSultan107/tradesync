package com.tradesync.csv;

import com.tradesync.trade.TradeRecord;
import com.tradesync.trade.TradeSource;
import org.junit.jupiter.api.Test;

import java.io.StringReader;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class CsvTradeParserTest {

    private final CsvTradeParser parser = new CsvTradeParser();

    @Test
    void parsesValidTradesAndNormalizesTextFields() {
        String csv = """
                trade_id,symbol,quantity,price,currency,trade_date
                T001,aapl,100,225.40,usd,2026-08-18
                """;

        CsvTradeParseResult result = parser.parse(new StringReader(csv), TradeSource.INTERNAL);

        assertThat(result.errors()).isEmpty();
        assertThat(result.trades()).hasSize(1);

        TradeRecord trade = result.trades().get(0);
        assertThat(trade.source()).isEqualTo(TradeSource.INTERNAL);
        assertThat(trade.tradeId()).isEqualTo("T001");
        assertThat(trade.symbol()).isEqualTo("AAPL");
        assertThat(trade.quantity()).isEqualByComparingTo("100");
        assertThat(trade.price()).isEqualByComparingTo("225.40");
        assertThat(trade.currency()).isEqualTo("USD");
        assertThat(trade.tradeDate()).isEqualTo(LocalDate.of(2026, 8, 18));
    }

    @Test
    void returnsValidationErrorsForInvalidRows() {
        String csv = """
                trade_id,symbol,quantity,price,currency,trade_date
                , ,0,not-a-number,not-currency,not-a-date
                """;

        CsvTradeParseResult result = parser.parse(new StringReader(csv), TradeSource.EXTERNAL);

        assertThat(result.trades()).isEmpty();
        assertThat(result.errors())
                .extracting(CsvTradeValidationError::field)
                .containsExactlyInAnyOrder("trade_id", "symbol", "quantity", "price", "currency", "trade_date");
        assertThat(result.hasErrors()).isTrue();
    }

    @Test
    void allowsDuplicateTradeIdsForReconciliationReview() {
        String csv = """
                trade_id,symbol,quantity,price,currency,trade_date
                T001,AAPL,100,225.40,USD,2026-08-18
                T001,MSFT,50,510.25,USD,2026-08-18
                """;

        CsvTradeParseResult result = parser.parse(new StringReader(csv), TradeSource.INTERNAL);

        assertThat(result.errors()).isEmpty();
        assertThat(result.trades())
                .extracting(TradeRecord::tradeId)
                .containsExactly("T001", "T001");
    }

    @Test
    void rejectsFilesWithMissingRequiredHeaders() {
        String csv = """
                trade_id,symbol,quantity,price,currency
                T001,AAPL,100,225.40,USD
                """;

        CsvTradeParseResult result = parser.parse(new StringReader(csv), TradeSource.INTERNAL);

        assertThat(result.trades()).isEmpty();
        assertThat(result.errors())
                .anySatisfy(error -> {
                    assertThat(error.lineNumber()).isEqualTo(1);
                    assertThat(error.field()).isEqualTo("header");
                    assertThat(error.message()).contains("trade_date");
                });
    }
}
