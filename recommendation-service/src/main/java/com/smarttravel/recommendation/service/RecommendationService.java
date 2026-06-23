package com.smarttravel.recommendation.service;

import com.smarttravel.recommendation.dto.SaveRecommendationRequest;
import com.smarttravel.recommendation.model.Recommendation;
import com.smarttravel.recommendation.model.RecommendationType;
import com.smarttravel.recommendation.model.SavedRecommendation;
import com.smarttravel.recommendation.repository.RecommendationRepository;
import com.smarttravel.recommendation.repository.SavedRecommendationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final RecommendationRepository recommendationRepository;
    private final SavedRecommendationRepository savedRecommendationRepository;

    public List<Recommendation> getRecommendations(String destination, RecommendationType type) {
        if (type == null) {
            return recommendationRepository.findByDestinationIgnoreCase(destination);
        }

        return recommendationRepository.findByDestinationIgnoreCaseAndType(destination, type);
    }

    public List<Recommendation> getHotels(String destination, BigDecimal budget) {
        if (budget == null) {
            return recommendationRepository.findByDestinationIgnoreCaseAndType(destination, RecommendationType.HOTEL);
        }

        return recommendationRepository
                .findByDestinationIgnoreCaseAndTypeAndEstimatedPriceLessThanEqual(
                        destination,
                        RecommendationType.HOTEL,
                        budget
                );
    }

    public List<Recommendation> getRestaurants(String destination) {
        return recommendationRepository.findByDestinationIgnoreCaseAndType(
                destination,
                RecommendationType.RESTAURANT
        );
    }

    public List<Recommendation> getAttractions(String destination) {
        return recommendationRepository.findByDestinationIgnoreCaseAndType(
                destination,
                RecommendationType.ATTRACTION
        );
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