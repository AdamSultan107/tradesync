package com.tradesync.persistence.entity;

import com.tradesync.trade.TradeSource;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
        name = "trades",
        indexes = {
                @Index(name = "idx_trades_run_trade_id", columnList = "reconciliation_run_id, trade_id"),
                @Index(name = "idx_trades_run_source", columnList = "reconciliation_run_id, source")
        }
)
public class TradeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reconciliation_run_id", nullable = false)
    private ReconciliationRunEntity run;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 16)
    private TradeSource source;

    @Column(nullable = false, length = 64)
    private String tradeId;

    @Column(nullable = false, length = 32)
    private String symbol;

    @Column(nullable = false, precision = 19, scale = 6)
    private BigDecimal quantity;

    @Column(nullable = false, precision = 19, scale = 6)
    private BigDecimal price;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(nullable = false)
    private LocalDate tradeDate;

    @Column(nullable = false)
    private Instant createdAt;

    protected TradeEntity() {
    }

    public TradeEntity(
            ReconciliationRunEntity run,
            TradeSource source,
            String tradeId,
            String symbol,
            BigDecimal quantity,
            BigDecimal price,
            String currency,
            LocalDate tradeDate,
            Instant createdAt
    ) {
        this.run = run;
        this.source = source;
        this.tradeId = tradeId;
        this.symbol = symbol;
        this.quantity = quantity;
        this.price = price;
        this.currency = currency;
        this.tradeDate = tradeDate;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public ReconciliationRunEntity getRun() {
        return run;
    }

    public TradeSource getSource() {
        return source;
    }

    public String getTradeId() {
        return tradeId;
    }

    public String getSymbol() {
        return symbol;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public String getCurrency() {
        return currency;
    }

    public LocalDate getTradeDate() {
        return tradeDate;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
