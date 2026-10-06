package com.smarttravel.recommendation.dto;

import com.smarttravel.recommendation.model.Recommendation;
import com.smarttravel.recommendation.model.RecommendationType;

import java.math.BigDecimal;

public record RecommendationResponse(
        Long id,
        String destination,
        String name,
        RecommendationType type,
        String description,
        BigDecimal estimatedPrice,
        Double rating,
        String source,
        String externalPlaceId
) {

    public static RecommendationResponse from(
            Recommendation recommendation) {

        return new RecommendationResponse(
                recommendation.getId(),
                recommendation.getDestination(),
                recommendation.getName(),
                recommendation.getType(),
                recommendation.getDescription(),
                recommendation.getEstimatedPrice(),
                recommendation.getRating(),
                recommendation.getSource(),
                recommendation.getExternalPlaceId()
        );
    }
}