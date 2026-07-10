package com.smarttravel.trip.event;

import java.time.LocalDate;

public record TripCreatedEvent(
        Long tripId,
        String userId,
        String destination,
        LocalDate startDate,
        LocalDate endDate,
        float budget,
        String currency
){}