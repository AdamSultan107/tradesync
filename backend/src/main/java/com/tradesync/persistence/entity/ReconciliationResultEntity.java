package com.tradesync.persistence.entity;

import com.tradesync.reconciliation.ReconciliationStatus;
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

import java.time.Instant;

@Entity
@Table(
        name = "reconciliation_results",
        indexes = {
                @Index(name = "idx_results_run_status", columnList = "reconciliation_run_id, status"),
                @Index(name = "idx_results_run_trade_id", columnList = "reconciliation_run_id, trade_id")
        }
)
public class ReconciliationResultEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reconciliation_run_id", nullable = false)
    private ReconciliationRunEntity run;

    @Column(nullable = false, length = 64)
    private String tradeId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 32)
    private ReconciliationStatus status;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false)
    private Instant createdAt;

    protected ReconciliationResultEntity() {
    }

    public ReconciliationResultEntity(
            ReconciliationRunEntity run,
            String tradeId,
            ReconciliationStatus status,
            String description,
            Instant createdAt
    ) {
        this.run = run;
        this.tradeId = tradeId;
        this.status = status;
        this.description = description;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public ReconciliationRunEntity getRun() {
        return run;
    }

    public String getTradeId() {
        return tradeId;
    }

    public ReconciliationStatus getStatus() {
        return status;
    }

    public String getDescription() {
        return description;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
