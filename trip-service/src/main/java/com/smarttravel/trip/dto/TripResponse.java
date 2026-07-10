package com.smarttravel.trip.dto;

import com.smarttravel.trip.model.TripStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TripResponse(
        Long id,
        String userId,
        String destination,
        LocalDate startDate,
        LocalDate endDate,
        float budget,
        String currency,
        TripStatus status,
        LocalDateTime createdAt
){}