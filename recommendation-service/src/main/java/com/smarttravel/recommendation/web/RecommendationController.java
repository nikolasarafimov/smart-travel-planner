package com.smarttravel.recommendation.web;

import com.smarttravel.recommendation.dto.SaveRecommendationRequest;
import com.smarttravel.recommendation.model.Recommendation;
import com.smarttravel.recommendation.model.RecommendationType;
import com.smarttravel.recommendation.model.SavedRecommendation;
import com.smarttravel.recommendation.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping
    public List<Recommendation> getRecommendations(
            @RequestParam String destination,
            @RequestParam(required = false) RecommendationType type
    ) {
        return recommendationService.getRecommendations(destination, type);
    }

    @GetMapping("/hotels")
    public List<Recommendation> getHotels(
            @RequestParam String destination,
            @RequestParam(required = false) BigDecimal budget
    ) {
        return recommendationService.getHotels(destination, budget);
    }

    @GetMapping("/restaurants")
    public List<Recommendation> getRestaurants(@RequestParam String destination) {
        return recommendationService.getRestaurants(destination);
    }

    @GetMapping("/attractions")
    public List<Recommendation> getAttractions(@RequestParam String destination) {
        return recommendationService.getAttractions(destination);
    }

    @PostMapping("/{id}/save")
    public SavedRecommendation saveRecommendation(
            @PathVariable Long id,
            @RequestBody SaveRecommendationRequest request
    ) {
        return recommendationService.saveRecommendation(id, request);
    }

    @GetMapping("/saved")
    public List<SavedRecommendation> getSavedRecommendations(@RequestParam Long tripId) {
        return recommendationService.getSavedRecommendations(tripId);
    }

    @GetMapping("/estimate")
    public BigDecimal estimateTripCost(@RequestParam Long tripId) {
        return recommendationService.estimateTripCost(tripId);
    }

    @GetMapping("/health-test")
    public String healthTest() {
        return "Recommendation Service is running";
    }
}