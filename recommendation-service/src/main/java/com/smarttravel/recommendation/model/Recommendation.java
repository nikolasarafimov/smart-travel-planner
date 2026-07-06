package com.smarttravel.recommendation.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "recommendations")
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

    @Column(name = "external_place_id", unique = true)
    private String externalPlaceId;

    public Recommendation() {
    }

    public Recommendation(Long id, String destination, String name, RecommendationType type,
                          String description, BigDecimal estimatedPrice, Double rating, String source, String externalPlaceId) {
        this.id = id;
        this.destination = destination;
        this.name = name;
        this.type = type;
        this.description = description;
        this.estimatedPrice = estimatedPrice;
        this.rating = rating;
        this.source = source;
        this.externalPlaceId = externalPlaceId;
    }

    public Long getId() {
        return id;
    }

    public String getDestination() {
        return destination;
    }

    public String getName() {
        return name;
    }

    public RecommendationType getType() {
        return type;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getEstimatedPrice() {
        return estimatedPrice;
    }

    public Double getRating() {
        return rating;
    }

    public String getSource() {
        return source;
    }

    public String getExternalPlaceId() {return externalPlaceId;}

    public void setId(Long id) {
        this.id = id;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setType(RecommendationType type) {
        this.type = type;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setEstimatedPrice(BigDecimal estimatedPrice) {
        this.estimatedPrice = estimatedPrice;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public void setExternalPlaceId(String externalPlaceId) {this.externalPlaceId = externalPlaceId;}
}