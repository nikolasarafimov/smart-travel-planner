package com.smarttravel.mcp.dto;

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
        String status,
        LocalDateTime createdAt
) {
}
