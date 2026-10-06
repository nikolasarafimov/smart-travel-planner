package com.smarttravel.recommendation.dto;

import com.smarttravel.recommendation.model.SavedRecommendation;

import java.time.LocalDateTime;

public record SavedRecommendationResponse(
        Long id,
        Long tripId,
        String userId,
        RecommendationResponse recommendation,
        LocalDateTime savedAt
) {

    public static SavedRecommendationResponse from(
            SavedRecommendation savedRecommendation) {

        return new SavedRecommendationResponse(
                savedRecommendation.getId(),
                savedRecommendation.getTripId(),
                savedRecommendation.getUserId(),
                RecommendationResponse.from(
                        savedRecommendation.getRecommendation()
                ),
                savedRecommendation.getSavedAt()
        );
    }
}