package com.smarttravel.trip.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;

public record CreateTripRequest (
    @NotBlank String userId,
    @NotBlank String destination,
    @NotNull LocalDate startDate,
    @NotNull LocalDate endDate,
    @NotNull @Positive float budget,
    String currency
){}