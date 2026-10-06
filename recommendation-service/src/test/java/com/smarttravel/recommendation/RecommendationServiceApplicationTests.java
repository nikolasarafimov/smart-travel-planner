package com.smarttravel.recommendation;

import com.smarttravel.recommendation.external.GeoapifyPlacesClient;
import com.smarttravel.recommendation.repository.RecommendationRepository;
import com.smarttravel.recommendation.repository.SavedRecommendationRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest(properties = {
        "spring.cloud.consul.enabled=false",
        "spring.cloud.consul.discovery.enabled=false",
        "spring.cloud.consul.discovery.register=false",
        "external.geoapify.enabled=false",
        "spring.autoconfigure.exclude="
                + "org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration,"
                + "org.springframework.boot.hibernate.autoconfigure.HibernateJpaAutoConfiguration,"
                + "org.springframework.boot.data.jpa.autoconfigure.DataJpaRepositoriesAutoConfiguration,"
                + "org.springframework.boot.kafka.autoconfigure.KafkaAutoConfiguration"
})
class RecommendationServiceApplicationTests {

    @MockitoBean
    private RecommendationRepository recommendationRepository;

    @MockitoBean
    private SavedRecommendationRepository savedRecommendationRepository;

    @MockitoBean
    private GeoapifyPlacesClient geoapifyPlacesClient;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    void contextLoads() {
    }
}