package com.smarttravel.recommendation.repository;

import com.smarttravel.recommendation.model.SavedRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SavedRecommendationRepository extends JpaRepository<SavedRecommendation, Long> {

    List<SavedRecommendation> findByTripId(Long tripId);

    List<SavedRecommendation> findByTripIdAndUserId(Long tripId, String userId);
}