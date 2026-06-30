package com.smarttravel.recommendation.event;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TripCreatedEvent(
        Long tripId,
        String userId,
        String destination,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal budget,
        String currency
) {
}