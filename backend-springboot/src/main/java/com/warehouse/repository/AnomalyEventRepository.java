package com.warehouse.repository;

import com.warehouse.entity.AnomalyEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface AnomalyEventRepository extends JpaRepository<AnomalyEvent, UUID> {

    @Query("""
        SELECT ae FROM AnomalyEvent ae
        WHERE (:reviewedOnly = FALSE OR ae.reviewOutcome IS NOT NULL)
          AND (:unreviewedOnly = FALSE OR ae.reviewOutcome IS NULL)
        """)
    Page<AnomalyEvent> findFiltered(
            @Param("reviewedOnly") boolean reviewedOnly,
            @Param("unreviewedOnly") boolean unreviewedOnly,
            Pageable pageable
    );

    Optional<AnomalyEvent> findByMovementId(UUID movementId);
}
