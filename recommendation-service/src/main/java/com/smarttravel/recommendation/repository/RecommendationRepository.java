package com.smarttravel.recommendation.repository;

import com.smarttravel.recommendation.model.Recommendation;
import com.smarttravel.recommendation.model.RecommendationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {

    List<Recommendation> findByDestinationIgnoreCase(String destination);

    List<Recommendation> findByDestinationIgnoreCaseAndType(String destination, RecommendationType type);

    List<Recommendation> findByDestinationIgnoreCaseAndTypeAndEstimatedPriceLessThanEqual(
            String destination,
            RecommendationType type,
            java.math.BigDecimal estimatedPrice
    );
}