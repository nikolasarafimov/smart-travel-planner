package com.smarttravel.recommendation.dto;

public record ExternalApiStatusResponse(
        String provider,
        boolean enabled,
        boolean apiKeyConfigured,
        String strategy,
        String deduplicationKey,
        String backendFlow
) {
}