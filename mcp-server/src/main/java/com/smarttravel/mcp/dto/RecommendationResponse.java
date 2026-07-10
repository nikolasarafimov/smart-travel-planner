package com.smarttravel.mcp.dto;

public record RecommendationResponse(
        Long id,
        String destination,
        String name,
        String type,
        String description,
        float estimatedPrice,
        Double rating,
        String source,
        String externalPlaceId
) {
}