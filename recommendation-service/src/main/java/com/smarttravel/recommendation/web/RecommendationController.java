package com.smarttravel.recommendation.web;

import com.smarttravel.recommendation.dto.ExternalApiStatusResponse;
import com.smarttravel.recommendation.dto.SaveRecommendationRequest;
import com.smarttravel.recommendation.model.Recommendation;
import com.smarttravel.recommendation.model.RecommendationType;
import com.smarttravel.recommendation.dto.SavedRecommendationResponse;
import com.smarttravel.recommendation.service.RecommendationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@Validated
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(
            RecommendationService recommendationService) {

        this.recommendationService = recommendationService;
    }

    @GetMapping("/external/status")
    public ExternalApiStatusResponse getExternalApiStatus() {
        return recommendationService.getExternalApiStatus();
    }

    @GetMapping
    public List<Recommendation> getRecommendations(
            @RequestParam @NotBlank String destination,
            @RequestParam(required = false) RecommendationType type) {

        return recommendationService.getRecommendations(destination, type);
    }

    @GetMapping("/hotels")
    public List<Recommendation> getHotels(
            @RequestParam @NotBlank String destination,
            @RequestParam(required = false) @PositiveOrZero BigDecimal budget) {

        return recommendationService.getHotels(destination, budget);
    }

    @GetMapping("/restaurants")
    public List<Recommendation> getRestaurants(
            @RequestParam @NotBlank String destination) {

        return recommendationService.getRestaurants(destination);
    }

    @GetMapping("/attractions")
    public List<Recommendation> getAttractions(
            @RequestParam @NotBlank String destination) {

        return recommendationService.getAttractions(destination);
    }

    @PostMapping("/{id}/save")
    public SavedRecommendationResponse saveRecommendation(
            @PathVariable @Positive Long id,
            @Valid @RequestBody SaveRecommendationRequest request) {

        return recommendationService.saveRecommendation(id, request);
    }

    @GetMapping("/saved")
    public List<SavedRecommendationResponse> getSavedRecommendations(
            @RequestParam @Positive Long tripId) {

        return recommendationService.getSavedRecommendations(tripId);
    }

    @GetMapping("/estimate")
    public BigDecimal estimateTripCost(
            @RequestParam @Positive Long tripId) {

        return recommendationService.estimateTripCost(tripId);
    }
}