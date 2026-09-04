package com.tradesync.persistence.repository;

import com.tradesync.persistence.entity.ReconciliationRunEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReconciliationRunRepository extends JpaRepository<ReconciliationRunEntity, Long> {

    List<ReconciliationRunEntity> findTop20ByOrderByStartedAtDescIdDesc();
}
