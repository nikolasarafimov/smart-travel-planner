package com.smarttravel.recommendation.dto;

public record SaveRecommendationRequest(
        Long tripId,
        String userId
) {
}