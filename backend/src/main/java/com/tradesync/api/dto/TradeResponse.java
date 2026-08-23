package com.tradesync.api.dto;

import com.tradesync.persistence.entity.TradeEntity;
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

    public static TradeResponse from(TradeEntity trade) {
        return new TradeResponse(
                trade.getSource(),
                trade.getTradeId(),
                trade.getSymbol(),
                trade.getQuantity(),
                trade.getPrice(),
                trade.getCurrency(),
                trade.getTradeDate()
        );
    }
}
