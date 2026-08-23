package com.tradesync.api.dto;

import com.tradesync.trade.TradeRecord;
import com.tradesync.trade.TradeSource;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TradeResponse(
        TradeSource source,
        String tradeId,
        String symbol,
        BigDecimal quantity,
        BigDecimal price,
        String currency,
        LocalDate tradeDate
) {

    public static TradeResponse from(TradeRecord trade) {
        return new TradeResponse(
                trade.source(),
                trade.tradeId(),
                trade.symbol(),
                trade.quantity(),
                trade.price(),
                trade.currency(),
                trade.tradeDate()
        );
    }
}
