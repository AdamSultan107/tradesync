package com.tradesync.persistence.entity;

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
        name = "exception_resolutions",
        indexes = @Index(
                name = "idx_exception_resolutions_result_resolved_at",
                columnList = "reconciliation_result_id, resolved_at"
        )
)
public class ExceptionResolutionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reconciliation_result_id", nullable = false)
    private ReconciliationResultEntity result;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 32)
    private ResolutionStatus resolutionStatus;

    @Column(nullable = false, length = 1000)
    private String note;

    @Column(nullable = false)
    private Instant resolvedAt;

    protected ExceptionResolutionEntity() {
    }

    public ExceptionResolutionEntity(
            ReconciliationResultEntity result,
            ResolutionStatus resolutionStatus,
            String note,
            Instant resolvedAt
    ) {
        this.result = result;
        this.resolutionStatus = resolutionStatus;
        this.note = note;
        this.resolvedAt = resolvedAt;
    }

    public Long getId() {
        return id;
    }

    public ReconciliationResultEntity getResult() {
        return result;
    }

    public ResolutionStatus getResolutionStatus() {
        return resolutionStatus;
    }

    public String getNote() {
        return note;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }
}
