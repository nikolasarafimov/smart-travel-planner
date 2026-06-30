package com.smarttravel.trip.pact;

import au.com.dius.pact.consumer.MockServer;
import au.com.dius.pact.consumer.dsl.DslPart;
import au.com.dius.pact.consumer.dsl.LambdaDsl;
import au.com.dius.pact.consumer.dsl.PactDslWithProvider;
import au.com.dius.pact.consumer.junit5.PactConsumerTest;
import au.com.dius.pact.consumer.junit5.PactTestFor;
import au.com.dius.pact.core.model.PactSpecVersion;
import au.com.dius.pact.core.model.V4Pact;
import au.com.dius.pact.core.model.annotations.Pact;
import com.smarttravel.trip.dto.RecommendationResponse;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@PactConsumerTest
@PactTestFor(providerName = "recommendation-service", pactVersion = PactSpecVersion.V4)
class TripRecommendationConsumerPactTest {

    @Pact(consumer = "trip-service", provider = "recommendation-service")
    public V4Pact getRecommendationsForParis(PactDslWithProvider builder) {
        DslPart responseBody = LambdaDsl.newJsonArrayMinLike(1, array -> array.object(object -> {
            object.numberType("id", 1);
            object.stringType("destination", "Paris");
            object.stringType("name", "Eiffel Tower");
            object.stringType("type", "ATTRACTION");
            object.stringType("description", "One of the most famous landmarks in Paris.");
            object.numberType("estimatedPrice", 30);
            object.numberType("rating", 4.8);
            object.stringType("source", "Seed Data");
        })).build();

        return builder
                .given("Paris recommendations exist")
                .uponReceiving("a request for recommendations for Paris")
                .path("/api/recommendations")
                .method("GET")
                .query("destination=Paris")
                .willRespondWith()
                .status(200)
                .headers(Map.of("Content-Type", "application/json"))
                .body(responseBody)
                .toPact(V4Pact.class);
    }

    @Test
    @PactTestFor(pactMethod = "getRecommendationsForParis")
    void shouldGetRecommendationsForParis(MockServer mockServer) {
        RestClient restClient = RestClient.builder()
                .baseUrl(mockServer.getUrl())
                .build();

        RecommendationResponse[] response = restClient.get()
                .uri("/api/recommendations?destination=Paris")
                .retrieve()
                .body(RecommendationResponse[].class);

        assertNotNull(response);
        assertTrue(response.length >= 1);
        assertEquals("Paris", response[0].destination());
        assertNotNull(response[0].name());
        assertNotNull(response[0].type());
    }
}