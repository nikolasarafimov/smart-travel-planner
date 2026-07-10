package com.smarttravel.trip.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;


@Entity
@Table(name = "trips")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userId;

    private String destination;

    private LocalDate startDate;

    private LocalDate endDate;

    private float budget;

    private String currency;

    @Enumerated(EnumType.STRING)
    private TripStatus status;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }

        if (status == null) {
            status = TripStatus.PLANNED;
        }

        if (currency == null || currency.isBlank()) {
            currency = "EUR";
        }
    }
}