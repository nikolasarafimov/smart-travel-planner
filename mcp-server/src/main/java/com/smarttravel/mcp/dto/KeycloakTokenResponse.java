package com.smarttravel.mcp.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record KeycloakTokenResponse(
        @JsonProperty("access_token")
        String accessToken,

        @JsonProperty("expires_in")
        Long expiresIn,

        @JsonProperty("token_type")
        String tokenType
) {
}