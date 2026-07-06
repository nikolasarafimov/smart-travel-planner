package com.smarttravel.recommendation.service;

import com.smarttravel.recommendation.dto.SaveRecommendationRequest;
import com.smarttravel.recommendation.model.Recommendation;
import com.smarttravel.recommendation.model.RecommendationType;
import com.smarttravel.recommendation.model.SavedRecommendation;
import com.smarttravel.recommendation.repository.RecommendationRepository;
import com.smarttravel.recommendation.repository.SavedRecommendationRepository;
import com.smarttravel.recommendation.external.GeoapifyPlacesClient;
import com.smarttravel.recommendation.dto.ExternalApiStatusResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final RecommendationRepository recommendationRepository;
    private final SavedRecommendationRepository savedRecommendationRepository;
    private final GeoapifyPlacesClient geoapifyPlacesClient;

    public ExternalApiStatusResponse getExternalApiStatus() {
        return new ExternalApiStatusResponse(
                geoapifyPlacesClient.getProviderName(),
                geoapifyPlacesClient.isEnabled(),
                geoapifyPlacesClient.isApiKeyConfigured(),
                "Seed Data first, Live API fallback",
                "externalPlaceId",
                "Frontend -> API Gateway -> Recommendation Service -> Geoapify"
        );
    }

    private List<Recommendation> seedOnly(List<Recommendation> recommendations) {
        if (recommendations == null || recommendations.isEmpty()) {
            return List.of();
        }

        return recommendations.stream()
                .filter(this::isSeedRecommendation)
                .toList();
    }

    private boolean isSeedRecommendation(Recommendation recommendation) {
        String source = recommendation.getSource();

        return source == null ||
                source.isBlank() ||
                !source.toLowerCase().contains("geoapify");
    }

    private List<Recommendation> persistLiveRecommendations(List<Recommendation> recommendations) {
        if (recommendations == null || recommendations.isEmpty()) {
            return List.of();
        }

        Map<String, Recommendation> uniqueRecommendations = new LinkedHashMap<>();

        for (Recommendation recommendation : recommendations) {
            String key = recommendation.getExternalPlaceId();

            if (key == null || key.isBlank()) {
                key = recommendation.getDestination() + "|" + recommendation.getType() + "|" + recommendation.getName();
            }

            uniqueRecommendations.putIfAbsent(key, recommendation);
        }

        return uniqueRecommendations.values()
                .stream()
                .map(this::findExistingOrSaveLiveRecommendation)
                .toList();
    }

    private Recommendation findExistingOrSaveLiveRecommendation(Recommendation recommendation) {
        if (recommendation.getExternalPlaceId() == null || recommendation.getExternalPlaceId().isBlank()) {
            return recommendationRepository.save(recommendation);
        }

        return recommendationRepository
                .findByExternalPlaceId(recommendation.getExternalPlaceId())
                .orElseGet(() -> recommendationRepository.save(recommendation));
    }

    public List<Recommendation> getRecommendations(String destination, RecommendationType type) {
        if (type != null) {
            List<Recommendation> localRecommendations =
                    recommendationRepository.findByDestinationIgnoreCaseAndType(destination, type);

            List<Recommendation> seedRecommendations = seedOnly(localRecommendations);

            if (!seedRecommendations.isEmpty()) {
                return seedRecommendations;
            }

            List<Recommendation> liveRecommendations =
                    geoapifyPlacesClient.searchRecommendations(destination, type, null);

            if (!liveRecommendations.isEmpty()) {
                return persistLiveRecommendations(liveRecommendations);
            }

            return localRecommendations;
        }

        List<Recommendation> localRecommendations =
                recommendationRepository.findByDestinationIgnoreCase(destination);

        List<Recommendation> seedRecommendations = seedOnly(localRecommendations);

        if (!seedRecommendations.isEmpty()) {
            return seedRecommendations;
        }

        return localRecommendations;
    }

    public List<Recommendation> getHotels(String destination, BigDecimal budget) {
        List<Recommendation> localRecommendations =
                recommendationRepository.findByDestinationIgnoreCaseAndTypeAndEstimatedPriceLessThanEqual(
                        destination,
                        RecommendationType.HOTEL,
                        budget
                );

        List<Recommendation> seedRecommendations = seedOnly(localRecommendations);

        if (!seedRecommendations.isEmpty()) {
            return seedRecommendations;
        }

        List<Recommendation> liveRecommendations =
                geoapifyPlacesClient.searchRecommendations(destination, RecommendationType.HOTEL, budget);

        if (!liveRecommendations.isEmpty()) {
            return persistLiveRecommendations(liveRecommendations);
        }

        return localRecommendations;
    }

    public List<Recommendation> getRestaurants(String destination) {
        List<Recommendation> localRecommendations =
                recommendationRepository.findByDestinationIgnoreCaseAndType(
                        destination,
                        RecommendationType.RESTAURANT
                );

        List<Recommendation> seedRecommendations = seedOnly(localRecommendations);

        if (!seedRecommendations.isEmpty()) {
            return seedRecommendations;
        }

        List<Recommendation> liveRecommendations =
                geoapifyPlacesClient.searchRecommendations(destination, RecommendationType.RESTAURANT, null);

        if (!liveRecommendations.isEmpty()) {
            return persistLiveRecommendations(liveRecommendations);
        }

        return localRecommendations;
    }

    public List<Recommendation> getAttractions(String destination) {
        List<Recommendation> localRecommendations =
                recommendationRepository.findByDestinationIgnoreCaseAndType(
                        destination,
                        RecommendationType.ATTRACTION
                );

        List<Recommendation> seedRecommendations = seedOnly(localRecommendations);

        if (!seedRecommendations.isEmpty()) {
            return seedRecommendations;
        }

        List<Recommendation> liveRecommendations =
                geoapifyPlacesClient.searchRecommendations(destination, RecommendationType.ATTRACTION, null);

        if (!liveRecommendations.isEmpty()) {
            return persistLiveRecommendations(liveRecommendations);
        }

        return localRecommendations;
    }

    public SavedRecommendation saveRecommendation(Long recommendationId, SaveRecommendationRequest request) {
        Recommendation recommendation = recommendationRepository.findById(recommendationId)
                .orElseThrow(() -> new RuntimeException("Recommendation not found"));

        SavedRecommendation savedRecommendation = SavedRecommendation.builder()
                .tripId(request.tripId())
                .userId(request.userId())
                .recommendation(recommendation)
                .savedAt(LocalDateTime.now())
                .build();

        return savedRecommendationRepository.save(savedRecommendation);
    }

    public List<SavedRecommendation> getSavedRecommendations(Long tripId) {
        return savedRecommendationRepository.findByTripId(tripId);
    }

    public BigDecimal estimateTripCost(Long tripId) {
        return savedRecommendationRepository.findByTripId(tripId)
                .stream()
                .map(saved -> saved.getRecommendation().getEstimatedPrice())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}