package com.smarttravel.trip.dto;

import com.smarttravel.trip.model.TripStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;

public record UpdateTripRequest(
        @NotBlank String destination,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @NotNull @Positive float budget,
        String currency,
        TripStatus status
){}