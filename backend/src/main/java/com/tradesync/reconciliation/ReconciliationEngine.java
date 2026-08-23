package com.tradesync.reconciliation;

import com.tradesync.trade.TradeRecord;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class ReconciliationEngine {

    public List<ReconciliationResult> reconcile(
            List<TradeRecord> internalTrades,
            List<TradeRecord> externalTrades
    ) {
        Map<String, List<TradeRecord>> internalByTradeId = groupByTradeId(internalTrades);
        Map<String, List<TradeRecord>> externalByTradeId = groupByTradeId(externalTrades);
        Set<String> tradeIds = orderedTradeIds(internalByTradeId, externalByTradeId);

        List<ReconciliationResult> results = new ArrayList<>();
        for (String tradeId : tradeIds) {
            List<TradeRecord> internalMatches = internalByTradeId.getOrDefault(tradeId, List.of());
            List<TradeRecord> externalMatches = externalByTradeId.getOrDefault(tradeId, List.of());
            results.add(reconcileTradeId(tradeId, internalMatches, externalMatches));
        }

        return results;
    }

    private Map<String, List<TradeRecord>> groupByTradeId(List<TradeRecord> trades) {
        Map<String, List<TradeRecord>> groupedTrades = new LinkedHashMap<>();
        for (TradeRecord trade : trades) {
            groupedTrades.computeIfAbsent(trade.tradeId(), ignored -> new ArrayList<>()).add(trade);
        }
        return groupedTrades;
    }

    private Set<String> orderedTradeIds(
            Map<String, List<TradeRecord>> internalByTradeId,
            Map<String, List<TradeRecord>> externalByTradeId
    ) {
        Set<String> tradeIds = new LinkedHashSet<>();
        tradeIds.addAll(internalByTradeId.keySet());
        tradeIds.addAll(externalByTradeId.keySet());
        return tradeIds;
    }

    private ReconciliationResult reconcileTradeId(
            String tradeId,
            List<TradeRecord> internalMatches,
            List<TradeRecord> externalMatches
    ) {
        if (internalMatches.size() > 1 || externalMatches.size() > 1) {
            return result(
                    tradeId,
                    ReconciliationStatus.DUPLICATE,
                    internalMatches,
                    externalMatches,
                    "Duplicate trade ID detected."
            );
        }

        if (internalMatches.isEmpty()) {
            return result(
                    tradeId,
                    ReconciliationStatus.MISSING_INTERNAL,
                    internalMatches,
                    externalMatches,
                    "Trade exists in external source only."
            );
        }

        if (externalMatches.isEmpty()) {
            return result(
                    tradeId,
                    ReconciliationStatus.MISSING_EXTERNAL,
                    internalMatches,
                    externalMatches,
                    "Trade exists in internal source only."
            );
        }

        TradeRecord internalTrade = internalMatches.get(0);
        TradeRecord externalTrade = externalMatches.get(0);
        ReconciliationStatus status = compareTrades(internalTrade, externalTrade);

        return result(tradeId, status, internalMatches, externalMatches, descriptionFor(status));
    }

    private ReconciliationStatus compareTrades(TradeRecord internalTrade, TradeRecord externalTrade) {
        if (internalTrade.price().compareTo(externalTrade.price()) != 0) {
            return ReconciliationStatus.PRICE_MISMATCH;
        }

        if (internalTrade.quantity().compareTo(externalTrade.quantity()) != 0) {
            return ReconciliationStatus.QUANTITY_MISMATCH;
        }

        if (!internalTrade.currency().equals(externalTrade.currency())) {
            return ReconciliationStatus.CURRENCY_MISMATCH;
        }

        return ReconciliationStatus.MATCHED;
    }

    private ReconciliationResult result(
            String tradeId,
            ReconciliationStatus status,
            List<TradeRecord> internalTrades,
            List<TradeRecord> externalTrades,
            String description
    ) {
        return new ReconciliationResult(tradeId, status, internalTrades, externalTrades, description);
    }

    private String descriptionFor(ReconciliationStatus status) {
        return switch (status) {
            case MATCHED -> "Trades match.";
            case PRICE_MISMATCH -> "Trade prices differ.";
            case QUANTITY_MISMATCH -> "Trade quantities differ.";
            case CURRENCY_MISMATCH -> "Trade currencies differ.";
            case MISSING_INTERNAL -> "Trade exists in external source only.";
            case MISSING_EXTERNAL -> "Trade exists in internal source only.";
            case DUPLICATE -> "Duplicate trade ID detected.";
        };
    }
}
