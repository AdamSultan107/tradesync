package com.tradesync.persistence.repository;

import com.tradesync.persistence.entity.ExceptionResolutionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ExceptionResolutionRepository extends JpaRepository<ExceptionResolutionEntity, Long> {

    List<ExceptionResolutionEntity> findByResultIdOrderByResolvedAtDesc(Long resultId);

    List<ExceptionResolutionEntity> findByResultIdInOrderByResolvedAtDescIdDesc(Collection<Long> resultIds);
}
