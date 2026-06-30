package com.smarttravel.recommendation.pact;

import au.com.dius.pact.provider.junit5.HttpTestTarget;
import au.com.dius.pact.provider.junit5.PactVerificationContext;
import au.com.dius.pact.provider.junit5.PactVerificationInvocationContextProvider;
import au.com.dius.pact.provider.junitsupport.Provider;
import au.com.dius.pact.provider.junitsupport.State;
import au.com.dius.pact.provider.junitsupport.loader.PactFolder;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.apache.hc.core5.http.HttpRequest;
import org.junit.jupiter.api.TestTemplate;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

@Provider("recommendation-service")
@PactFolder("src/test/resources/pacts")
class RecommendationProviderPactVerificationTest {

    private final RestClient restClient = RestClient.builder().build();

    @State("Paris recommendations exist")
    void parisRecommendationsExist() {
    }

    @TestTemplate
    @ExtendWith(PactVerificationInvocationContextProvider.class)
    void verifyPact(PactVerificationContext context, HttpRequest request) {
        context.setTarget(new HttpTestTarget("localhost", 8082, "/"));

        String token = getAccessToken();

        request.addHeader("Authorization", "Bearer " + token);

        context.verifyInteraction();
    }

    private String getAccessToken() {
        KeycloakTokenResponse response = restClient.post()
                .uri("http://localhost:8086/realms/smart-travel/protocol/openid-connect/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body("client_id=smart-travel-client"
                        + "&username=demo-user"
                        + "&password=demo-pass"
                        + "&grant_type=password")
                .retrieve()
                .body(KeycloakTokenResponse.class);

        if (response == null || response.accessToken() == null) {
            throw new RuntimeException("Could not get Keycloak access token");
        }

        return response.accessToken();
    }

    record KeycloakTokenResponse(
            @JsonProperty("access_token")
            String accessToken
    ) {
    }
}