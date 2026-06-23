package com.smarttravel.recommendation.config;

import com.smarttravel.recommendation.model.Recommendation;
import com.smarttravel.recommendation.model.RecommendationType;
import com.smarttravel.recommendation.repository.RecommendationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RecommendationRepository recommendationRepository;

    @Override
    public void run(String... args) {
        if (recommendationRepository.count() > 0) {
            return;
        }

        List<Recommendation> recommendations = List.of(
                Recommendation.builder()
                        .destination("Paris")
                        .name("Eiffel Tower")
                        .type(RecommendationType.ATTRACTION)
                        .description("One of the most famous landmarks in Paris.")
                        .estimatedPrice(new BigDecimal("30"))
                        .rating(4.8)
                        .source("Seed Data")
                        .build(),

                Recommendation.builder()
                        .destination("Paris")
                        .name("Louvre Museum")
                        .type(RecommendationType.ATTRACTION)
                        .description("World-famous museum known for the Mona Lisa and historical art collections.")
                        .estimatedPrice(new BigDecimal("22"))
                        .rating(4.7)
                        .source("Seed Data")
                        .build(),

                Recommendation.builder()
                        .destination("Paris")
                        .name("Montmartre")
                        .type(RecommendationType.ATTRACTION)
                        .description("Historic artistic district with beautiful views over Paris.")
                        .estimatedPrice(new BigDecimal("0"))
                        .rating(4.6)
                        .source("Seed Data")
                        .build(),

                Recommendation.builder()
                        .destination("Paris")
                        .name("Hotel Lumiere")
                        .type(RecommendationType.HOTEL)
                        .description("Comfortable mid-range hotel close to the city center.")
                        .estimatedPrice(new BigDecimal("150"))
                        .rating(4.4)
                        .source("Seed Data")
                        .build(),

                Recommendation.builder()
                        .destination("Paris")
                        .name("Paris Budget Stay")
                        .type(RecommendationType.HOTEL)
                        .description("Affordable accommodation for travelers on a smaller budget.")
                        .estimatedPrice(new BigDecimal("80"))
                        .rating(4.1)
                        .source("Seed Data")
                        .build(),

                Recommendation.builder()
                        .destination("Paris")
                        .name("Le Petit Bistro")
                        .type(RecommendationType.RESTAURANT)
                        .description("Traditional French restaurant with local dishes.")
                        .estimatedPrice(new BigDecimal("45"))
                        .rating(4.5)
                        .source("Seed Data")
                        .build(),

                Recommendation.builder()
                        .destination("Paris")
                        .name("Cafe Seine")
                        .type(RecommendationType.RESTAURANT)
                        .description("Cozy cafe near the Seine river.")
                        .estimatedPrice(new BigDecimal("25"))
                        .rating(4.3)
                        .source("Seed Data")
                        .build()
        );

        recommendationRepository.saveAll(recommendations);
    }
}