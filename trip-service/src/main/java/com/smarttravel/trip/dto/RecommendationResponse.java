package com.smarttravel.trip.dto;

import com.smarttravel.trip.model.TripStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record RecommendationResponse(
        Long id,
        String destination,
        String name,
        String type,
        String description,
        float estimatedPrice,
        Double rating,
        String source
) {
}
