package com.smarttravel.recommendation.pact;

import au.com.dius.pact.provider.junit5.HttpTestTarget;
import au.com.dius.pact.provider.junit5.PactVerificationContext;
import au.com.dius.pact.provider.junit5.PactVerificationInvocationContextProvider;
import au.com.dius.pact.provider.junitsupport.Provider;
import au.com.dius.pact.provider.junitsupport.State;
import au.com.dius.pact.provider.junitsupport.loader.PactFolder;
import com.smarttravel.recommendation.external.GeoapifyPlacesClient;
import com.smarttravel.recommendation.model.Recommendation;
import com.smarttravel.recommendation.model.RecommendationType;
import com.smarttravel.recommendation.repository.RecommendationRepository;
import com.smarttravel.recommendation.repository.SavedRecommendationRepository;
import org.apache.hc.core5.http.HttpRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestTemplate;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.mockito.Mockito.when;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
                "spring.cloud.consul.enabled=false",
                "spring.cloud.consul.discovery.enabled=false",
                "spring.cloud.consul.discovery.register=false",
                "spring.kafka.listener.auto-startup=false",
                "external.geoapify.enabled=false",
                "spring.autoconfigure.exclude="
                        + "org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration,"
                        + "org.springframework.boot.hibernate.autoconfigure.HibernateJpaAutoConfiguration,"
                        + "org.springframework.boot.data.jpa.autoconfigure.DataJpaRepositoriesAutoConfiguration"
        }
)
@Provider("recommendation-service")
@PactFolder("src/test/resources/pacts")
class RecommendationProviderPactVerificationTest {

    @LocalServerPort
    private int port;

    @MockitoBean
    private RecommendationRepository recommendationRepository;

    @MockitoBean
    private SavedRecommendationRepository savedRecommendationRepository;

    @MockitoBean
    private GeoapifyPlacesClient geoapifyPlacesClient;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @BeforeEach
    void setUp(PactVerificationContext context) {
        context.setTarget(new HttpTestTarget("localhost", port, "/"));

        Jwt jwt = Jwt.withTokenValue("pact-test-token")
                .header("alg", "none")
                .claim("sub", "pact-test-user")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();

        when(jwtDecoder.decode("pact-test-token")).thenReturn(jwt);
    }

    @State("Paris recommendations exist")
    void parisRecommendationsExist() {
        Recommendation recommendation = new Recommendation(
                1L,
                "Paris",
                "Eiffel Tower",
                RecommendationType.ATTRACTION,
                "One of the most famous landmarks in Paris.",
                new BigDecimal("30"),
                4.8,
                "Seed Data",
                null
        );

        when(recommendationRepository.findByDestinationIgnoreCase("Paris"))
                .thenReturn(List.of(recommendation));
    }

    @TestTemplate
    @ExtendWith(PactVerificationInvocationContextProvider.class)
    void verifyPact(
            PactVerificationContext context,
            HttpRequest request) {

        request.addHeader(
                "Authorization",
                "Bearer pact-test-token"
        );

        context.verifyInteraction();
    }
}