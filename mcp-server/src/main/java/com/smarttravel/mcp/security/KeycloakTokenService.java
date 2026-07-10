package com.smarttravel.mcp.security;

import com.smarttravel.mcp.dto.KeycloakTokenResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
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

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "client_credentials");
        formData.add("client_id", clientId);
        formData.add("client_secret", clientSecret);

        KeycloakTokenResponse response = restClient.post()
                .uri(tokenUrl)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(formData)
                .retrieve()
                .body(KeycloakTokenResponse.class);

        if (response == null || response.accessToken() == null || response.accessToken().isBlank()) {
            throw new IllegalStateException("Failed to get access token from Keycloak");
        }

        cachedToken = response.accessToken();

        long expiresInSeconds = response.expiresIn() == null ? 300 : response.expiresIn();
        expiresAtMillis = System.currentTimeMillis() + Math.max(30, expiresInSeconds - 30) * 1000;

        return cachedToken;
    }
}