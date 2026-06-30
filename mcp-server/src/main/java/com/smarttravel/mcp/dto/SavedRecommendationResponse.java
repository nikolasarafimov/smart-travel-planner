package com.smarttravel.mcp.dto;

import java.time.LocalDateTime;

public record SavedRecommendationResponse(
        Long id,
        Long tripId,
        String userId,
        RecommendationResponse recommendation,
        LocalDateTime savedAt
) {
}