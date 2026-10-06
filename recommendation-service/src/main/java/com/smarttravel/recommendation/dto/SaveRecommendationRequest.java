package com.smarttravel.recommendation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record SaveRecommendationRequest(
        @NotNull @Positive Long tripId,
        @NotBlank String userId
) {}