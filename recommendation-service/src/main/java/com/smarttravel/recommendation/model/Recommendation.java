package com.smarttravel.recommendation.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "recommendations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Recommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String destination;

    private String name;

    @Enumerated(EnumType.STRING)
    private RecommendationType type;

    @Column(length = 1000)
    private String description;

    private BigDecimal estimatedPrice;

    private Double rating;

    private String source;
}