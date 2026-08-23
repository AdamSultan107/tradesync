package com.tradesync.persistence.repository;

import com.tradesync.persistence.entity.TradeEntity;
import com.tradesync.trade.TradeSource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TradeRepository extends JpaRepository<TradeEntity, Long> {

    List<TradeEntity> findByRunIdOrderById(Long runId);

    List<TradeEntity> findByRunIdAndTradeIdOrderById(Long runId, String tradeId);

    List<TradeEntity> findByRunIdAndSourceOrderById(Long runId, TradeSource source);
}
