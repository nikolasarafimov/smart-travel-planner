package com.smarttravel.mcp.security;

import com.smarttravel.mcp.dto.KeycloakTokenResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class KeycloakTokenService {

    private final RestClient restClient;

    @Value("${keycloak.token-url}")
    private String tokenUrl;

    @Value("${keycloak.client-id}")
    private String clientId;

    @Value("${keycloak.client-secret}")
    private String clientSecret;

    private String cachedToken;
    private long expiresAtMillis;

    public KeycloakTokenService(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder.build();
    }

    public String getAccessToken() {
        if (cachedToken != null && System.currentTimeMillis() < expiresAtMillis) {
            return cachedToken;
        }

        KeycloakTokenResponse response = restClient.post()
                .uri(tokenUrl)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body("grant_type=client_credentials"
                        + "&client_id=" + clientId
                        + "&client_secret=" + clientSecret)
                .retrieve()
                .body(KeycloakTokenResponse.class);

        if (response == null || response.accessToken() == null) {
            throw new RuntimeException("Failed to get access token from Keycloak");
        }

        cachedToken = response.accessToken();

        long expiresInSeconds = response.expiresIn() == null ? 300 : response.expiresIn();
        expiresAtMillis = System.currentTimeMillis() + ((expiresInSeconds - 30) * 1000);

        return cachedToken;
    }
}