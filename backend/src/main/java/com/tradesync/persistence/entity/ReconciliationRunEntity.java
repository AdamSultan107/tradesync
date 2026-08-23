package com.tradesync.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "reconciliation_runs")
public class ReconciliationRunEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 32)
    private ReconciliationRunStatus status;

    @Column(nullable = false)
    private Instant startedAt;

    private Instant completedAt;

    @Column(nullable = false)
    private int internalTradeCount;

    @Column(nullable = false)
    private int externalTradeCount;

    @Column(nullable = false)
    private int matchedCount;

    @Column(nullable = false)
    private int exceptionCount;

    protected ReconciliationRunEntity() {
    }

    public ReconciliationRunEntity(ReconciliationRunStatus status, Instant startedAt) {
        this.status = status;
        this.startedAt = startedAt;
    }

    public void markCompleted(
            Instant completedAt,
            int internalTradeCount,
            int externalTradeCount,
            int matchedCount,
            int exceptionCount
    ) {
        this.status = ReconciliationRunStatus.COMPLETED;
        this.completedAt = completedAt;
        this.internalTradeCount = internalTradeCount;
        this.externalTradeCount = externalTradeCount;
        this.matchedCount = matchedCount;
        this.exceptionCount = exceptionCount;
    }

    public void markFailed(Instant completedAt) {
        this.status = ReconciliationRunStatus.FAILED;
        this.completedAt = completedAt;
    }

    public Long getId() {
        return id;
    }

    public ReconciliationRunStatus getStatus() {
        return status;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public int getInternalTradeCount() {
        return internalTradeCount;
    }

    public int getExternalTradeCount() {
        return externalTradeCount;
    }

    public int getMatchedCount() {
        return matchedCount;
    }

    public int getExceptionCount() {
        return exceptionCount;
    }
}
