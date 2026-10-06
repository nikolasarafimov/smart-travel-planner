package com.smarttravel.mcp.client;

import com.smarttravel.mcp.dto.RecommendationResponse;
import com.smarttravel.mcp.dto.SavedRecommendationResponse;
import com.smarttravel.mcp.dto.TripResponse;
import com.smarttravel.mcp.security.KeycloakTokenService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Component
public class SmartTravelApiClient {

    private final RestClient restClient;
    private final KeycloakTokenService keycloakTokenService;

    public SmartTravelApiClient(
            RestClient.Builder restClientBuilder,
            KeycloakTokenService keycloakTokenService,
            @Value("${smart-travel.gateway-url}") String gatewayUrl) {

        this.restClient = restClientBuilder
                .baseUrl(gatewayUrl)
                .build();
        this.keycloakTokenService = keycloakTokenService;
    }

    public List<RecommendationResponse> getRecommendations(String destination, String type) {
        String token = keycloakTokenService.getAccessToken();

        List<RecommendationResponse> response;

        if (type != null && !type.isBlank()) {
            response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/recommendations")
                            .queryParam("destination", destination)
                            .queryParam("type", type.trim().toUpperCase(Locale.ROOT))
                            .build())
                    .headers(headers -> headers.setBearerAuth(token))
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    });
        } else {
            response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/recommendations")
                            .queryParam("destination", destination)
                            .build())
                    .headers(headers -> headers.setBearerAuth(token))
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    });
        }

        return response != null ? response : List.of();
    }

    public TripResponse getTripDetails(Long tripId) {
        String token = keycloakTokenService.getAccessToken();

        TripResponse response = restClient.get()
                .uri("/api/trips/{tripId}", tripId)
                .headers(headers -> headers.setBearerAuth(token))
                .retrieve()
                .body(TripResponse.class);

        return Objects.requireNonNull(
                response,
                "Trip Service returned an empty response"
        );
    }

    public List<SavedRecommendationResponse> getSavedRecommendations(Long tripId) {
        String token = keycloakTokenService.getAccessToken();

        List<SavedRecommendationResponse> response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/recommendations/saved")
                        .queryParam("tripId", tripId)
                        .build())
                .headers(headers -> headers.setBearerAuth(token))
                .retrieve()
                .body(new ParameterizedTypeReference<>() {
                });

        return response != null ? response : List.of();
    }

    public float estimateTripCost(Long tripId) {
        String token = keycloakTokenService.getAccessToken();

        Float response = restClient.get()
                .uri("/api/trips/{tripId}/estimated-cost", tripId)
                .headers(headers -> headers.setBearerAuth(token))
                .retrieve()
                .body(Float.class);

        return Objects.requireNonNull(
                response,
                "Trip Service returned an empty estimated-cost response"
        );
    }
}