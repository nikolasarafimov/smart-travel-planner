package com.smarttravel.recommendation.service;

import com.smarttravel.recommendation.dto.ExternalApiStatusResponse;
import com.smarttravel.recommendation.dto.SaveRecommendationRequest;
import com.smarttravel.recommendation.external.GeoapifyPlacesClient;
import com.smarttravel.recommendation.model.Recommendation;
import com.smarttravel.recommendation.model.RecommendationType;
import com.smarttravel.recommendation.model.SavedRecommendation;
import com.smarttravel.recommendation.repository.RecommendationRepository;
import com.smarttravel.recommendation.repository.SavedRecommendationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import com.smarttravel.recommendation.dto.SavedRecommendationResponse;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

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

    public List<Recommendation> getRecommendations(
            String destination,
            RecommendationType type) {

        String normalizedDestination = destination.trim();

        if (type != null) {
            return getRecommendationsByType(
                    normalizedDestination,
                    type,
                    null
            );
        }

        List<Recommendation> localRecommendations =
                recommendationRepository.findByDestinationIgnoreCase(
                        normalizedDestination
                );

        List<Recommendation> seedRecommendations =
                seedOnly(localRecommendations);

        if (!seedRecommendations.isEmpty()) {
            return seedRecommendations;
        }

        List<Recommendation> liveRecommendations = Stream.of(
                        RecommendationType.HOTEL,
                        RecommendationType.RESTAURANT,
                        RecommendationType.ATTRACTION
                )
                .flatMap(recommendationType ->
                        geoapifyPlacesClient.searchRecommendations(
                                        normalizedDestination,
                                        recommendationType,
                                        null
                                )
                                .stream())
                .toList();

        if (!liveRecommendations.isEmpty()) {
            return persistLiveRecommendations(liveRecommendations);
        }

        return localRecommendations;
    }

    public List<Recommendation> getHotels(
            String destination,
            BigDecimal budget) {

        return getRecommendationsByType(
                destination.trim(),
                RecommendationType.HOTEL,
                budget
        );
    }

    public List<Recommendation> getRestaurants(String destination) {
        return getRecommendationsByType(
                destination.trim(),
                RecommendationType.RESTAURANT,
                null
        );
    }

    public List<Recommendation> getAttractions(String destination) {
        return getRecommendationsByType(
                destination.trim(),
                RecommendationType.ATTRACTION,
                null
        );
    }

    @Transactional
    public SavedRecommendationResponse saveRecommendation(
            Long recommendationId,
            SaveRecommendationRequest request) {

        Recommendation recommendation = recommendationRepository
                .findById(recommendationId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Recommendation with id "
                                + recommendationId
                                + " not found"
                ));

        SavedRecommendation savedRecommendation =
                SavedRecommendation.builder()
                        .tripId(request.tripId())
                        .userId(request.userId().trim())
                        .recommendation(recommendation)
                        .build();

        SavedRecommendation saved =
                savedRecommendationRepository.save(savedRecommendation);

        return SavedRecommendationResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<SavedRecommendationResponse> getSavedRecommendations(
            Long tripId) {

        return savedRecommendationRepository.findByTripId(tripId)
                .stream()
                .map(SavedRecommendationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public BigDecimal estimateTripCost(Long tripId) {

        return savedRecommendationRepository.findByTripId(tripId)
                .stream()
                .map(SavedRecommendation::getRecommendation)
                .map(Recommendation::getEstimatedPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private List<Recommendation> getRecommendationsByType(
            String destination,
            RecommendationType type,
            BigDecimal maxBudget) {

        List<Recommendation> localRecommendations;

        if (maxBudget == null) {
            localRecommendations =
                    recommendationRepository
                            .findByDestinationIgnoreCaseAndType(
                                    destination,
                                    type
                            );
        } else {
            localRecommendations =
                    recommendationRepository
                            .findByDestinationIgnoreCaseAndTypeAndEstimatedPriceLessThanEqual(
                                    destination,
                                    type,
                                    maxBudget
                            );
        }

        List<Recommendation> seedRecommendations =
                seedOnly(localRecommendations);

        if (!seedRecommendations.isEmpty()) {
            return seedRecommendations;
        }

        List<Recommendation> liveRecommendations =
                geoapifyPlacesClient.searchRecommendations(
                        destination,
                        type,
                        maxBudget
                );

        if (!liveRecommendations.isEmpty()) {
            return persistLiveRecommendations(liveRecommendations);
        }

        return localRecommendations;
    }

    private List<Recommendation> seedOnly(
            List<Recommendation> recommendations) {

        if (recommendations == null || recommendations.isEmpty()) {
            return List.of();
        }

        return recommendations.stream()
                .filter(this::isSeedRecommendation)
                .toList();
    }

    private boolean isSeedRecommendation(
            Recommendation recommendation) {

        String source = recommendation.getSource();

        return source == null
                || source.isBlank()
                || !source.toLowerCase().contains("geoapify");
    }

    private List<Recommendation> persistLiveRecommendations(
            List<Recommendation> recommendations) {

        if (recommendations == null || recommendations.isEmpty()) {
            return List.of();
        }

        Map<String, Recommendation> uniqueRecommendations =
                new LinkedHashMap<>();

        for (Recommendation recommendation : recommendations) {
            String key = recommendation.getExternalPlaceId();

            if (key == null || key.isBlank()) {
                key = recommendation.getDestination()
                        + "|"
                        + recommendation.getType()
                        + "|"
                        + recommendation.getName();
            }

            uniqueRecommendations.putIfAbsent(key, recommendation);
        }

        return uniqueRecommendations.values()
                .stream()
                .map(this::findExistingOrSaveLiveRecommendation)
                .toList();
    }

    private Recommendation findExistingOrSaveLiveRecommendation(
            Recommendation recommendation) {

        String externalPlaceId =
                recommendation.getExternalPlaceId();

        if (externalPlaceId == null || externalPlaceId.isBlank()) {
            return recommendationRepository.save(recommendation);
        }

        return recommendationRepository
                .findByExternalPlaceId(externalPlaceId)
                .orElseGet(() ->
                        recommendationRepository.save(recommendation));
    }
}