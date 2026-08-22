package com.tradesync.trade;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TradeRecord(
        TradeSource source,
        String tradeId,
        String symbol,
        BigDecimal quantity,
        BigDecimal price,
        String currency,
        LocalDate tradeDate
) {
}
