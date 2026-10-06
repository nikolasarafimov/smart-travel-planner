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

    private static final long DEFAULT_EXPIRATION_SECONDS = 300;
    private static final long REFRESH_BUFFER_SECONDS = 30;

    private final RestClient restClient;
    private final String tokenUrl;
    private final String clientId;
    private final String clientSecret;

    private String cachedToken;
    private long refreshAtMillis;

    public KeycloakTokenService(
            RestClient.Builder restClientBuilder,
            @Value("${keycloak.token-url}") String tokenUrl,
            @Value("${keycloak.client-id}") String clientId,
            @Value("${keycloak.client-secret}") String clientSecret) {

        this.restClient = restClientBuilder.build();
        this.tokenUrl = tokenUrl;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    public synchronized String getAccessToken() {
        long now = System.currentTimeMillis();

        if (cachedToken != null && now < refreshAtMillis) {
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
            throw new IllegalStateException("Keycloak returned an empty access token");
        }

        cachedToken = response.accessToken();

        long expiresInSeconds = response.expiresIn() != null
                ? response.expiresIn()
                : DEFAULT_EXPIRATION_SECONDS;

        long cacheLifetimeSeconds = Math.max(
                0,
                expiresInSeconds - REFRESH_BUFFER_SECONDS
        );

        refreshAtMillis = now + cacheLifetimeSeconds * 1000L;

        return cachedToken;
    }
}