package com.tradesync.persistence.repository;

import com.tradesync.persistence.entity.ReconciliationRunEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReconciliationRunRepository extends JpaRepository<ReconciliationRunEntity, Long> {
}
