package com.tradesync.persistence.repository;

import com.tradesync.persistence.entity.ReconciliationResultEntity;
import com.tradesync.reconciliation.ReconciliationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ReconciliationResultRepository extends JpaRepository<ReconciliationResultEntity, Long> {

    List<ReconciliationResultEntity> findByRunIdOrderById(Long runId);

    List<ReconciliationResultEntity> findByRunIdAndStatusOrderById(Long runId, ReconciliationStatus status);

    List<ReconciliationResultEntity> findByRunIdAndStatusInOrderById(
            Long runId,
            Collection<ReconciliationStatus> statuses
    );
}
