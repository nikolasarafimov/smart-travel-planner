package com.smarttravel.recommendation.config;

import com.smarttravel.recommendation.model.Recommendation;
import com.smarttravel.recommendation.model.RecommendationType;
import com.smarttravel.recommendation.repository.RecommendationRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.List;

@Configuration
public class DataSeeder implements CommandLineRunner {

    private final RecommendationRepository recommendationRepository;

    public DataSeeder(RecommendationRepository recommendationRepository) {
        this.recommendationRepository = recommendationRepository;
    }

    @Override
    public void run(String... args) {
        if (recommendationRepository.count() > 0) {
            return;
        }

        List<Recommendation> recommendations = List.of(
                createRecommendation(
                        "Paris",
                        "Eiffel Tower",
                        RecommendationType.ATTRACTION,
                        "One of the most famous landmarks in Paris.",
                        "30",
                        4.8,
                        "Seed Data"
                ),
                createRecommendation(
                        "Paris",
                        "Louvre Museum",
                        RecommendationType.ATTRACTION,
                        "World-famous museum known for the Mona Lisa and historical art collections.",
                        "22",
                        4.7,
                        "Seed Data"
                ),
                createRecommendation(
                        "Paris",
                        "Montmartre",
                        RecommendationType.ATTRACTION,
                        "Historic artistic district with beautiful views over Paris.",
                        "0",
                        4.6,
                        "Seed Data"
                ),
                createRecommendation(
                        "Paris",
                        "Hotel Lumiere",
                        RecommendationType.HOTEL,
                        "Comfortable mid-range hotel close to the city center.",
                        "150",
                        4.4,
                        "Seed Data"
                ),
                createRecommendation(
                        "Paris",
                        "Paris Budget Stay",
                        RecommendationType.HOTEL,
                        "Affordable accommodation for travelers on a smaller budget.",
                        "80",
                        4.1,
                        "Seed Data"
                ),
                createRecommendation(
                        "Paris",
                        "Le Petit Bistro",
                        RecommendationType.RESTAURANT,
                        "Traditional French restaurant with local dishes.",
                        "45",
                        4.5,
                        "Seed Data"
                ),
                createRecommendation(
                        "Paris",
                        "Cafe Seine",
                        RecommendationType.RESTAURANT,
                        "Cozy cafe near the Seine river.",
                        "25",
                        4.3,
                        "Seed Data"
                )
        );

        recommendationRepository.saveAll(recommendations);
    }

    private Recommendation createRecommendation(
            String destination,
            String name,
            RecommendationType type,
            String description,
            String estimatedPrice,
            Double rating,
            String source
    ) {
        Recommendation recommendation = new Recommendation();
        recommendation.setDestination(destination);
        recommendation.setName(name);
        recommendation.setType(type);
        recommendation.setDescription(description);
        recommendation.setEstimatedPrice(new BigDecimal(estimatedPrice));
        recommendation.setRating(rating);
        recommendation.setSource(source);
        return recommendation;
    }
}