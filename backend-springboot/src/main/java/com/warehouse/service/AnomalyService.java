package com.warehouse.service;

import com.warehouse.entity.AnomalyEvent;
import com.warehouse.entity.User;
import com.warehouse.exception.ResourceNotFoundException;
import com.warehouse.repository.AnomalyEventRepository;
import com.warehouse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnomalyService {

    private final AnomalyEventRepository anomalyEventRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<AnomalyEvent> findAll(Boolean reviewed, Pageable pageable) {
        boolean reviewedOnly = Boolean.TRUE.equals(reviewed);
        boolean unreviewedOnly = Boolean.FALSE.equals(reviewed);
        return anomalyEventRepository.findFiltered(reviewedOnly, unreviewedOnly, pageable);
    }

    @Transactional
    public AnomalyEvent review(UUID eventId, String outcome, UUID reviewerId) {
        AnomalyEvent event = anomalyEventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Anomaly event not found: " + eventId));

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + reviewerId));

        event.setReviewOutcome(AnomalyEvent.ReviewOutcome.valueOf(outcome));
        event.setReviewedBy(reviewer);
        return anomalyEventRepository.save(event);
    }
}
