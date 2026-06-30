package com.smarttravel.mcp.client;

import com.smarttravel.mcp.dto.RecommendationResponse;
import com.smarttravel.mcp.dto.SavedRecommendationResponse;
import com.smarttravel.mcp.dto.TripResponse;
import com.smarttravel.mcp.security.KeycloakTokenService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import java.util.List;

@Component
public class SmartTravelApiClient {

    private final RestClient restClient;
    private final KeycloakTokenService keycloakTokenService;

    @Value("${smart-travel.gateway-url}")
    private String gatewayUrl;

    public SmartTravelApiClient(RestClient.Builder restClientBuilder,
                                KeycloakTokenService keycloakTokenService) {
        this.restClient = restClientBuilder.build();
        this.keycloakTokenService = keycloakTokenService;
    }

    public List<RecommendationResponse> getRecommendations(String destination, String type) {
        String token = keycloakTokenService.getAccessToken();

        String url = gatewayUrl + "/api/recommendations?destination={destination}";

        if (type != null && !type.isBlank()) {
            url += "&type={type}";
            return restClient.get()
                    .uri(url, destination, type.toUpperCase())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<RecommendationResponse>>() {});
        }

        return restClient.get()
                .uri(url, destination)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .retrieve()
                .body(new ParameterizedTypeReference<List<RecommendationResponse>>() {});
    }

    public TripResponse getTripDetails(Long tripId) {
        String token = keycloakTokenService.getAccessToken();

        return restClient.get()
                .uri(gatewayUrl + "/api/trips/{tripId}", tripId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .retrieve()
                .body(TripResponse.class);
    }

    public List<SavedRecommendationResponse> getSavedRecommendations(Long tripId) {
        String token = keycloakTokenService.getAccessToken();

        return restClient.get()
                .uri(gatewayUrl + "/api/recommendations/saved?tripId={tripId}", tripId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .retrieve()
                .body(new ParameterizedTypeReference<List<SavedRecommendationResponse>>() {});
    }

    public float estimateTripCost(Long tripId) {
        String token = keycloakTokenService.getAccessToken();

        return restClient.get()
                .uri(gatewayUrl + "/api/trips/{tripId}/estimated-cost", tripId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .retrieve()
                .body(float.class);
    }
}