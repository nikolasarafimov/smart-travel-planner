package com.smarttravel.mcp;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.cloud.consul.enabled=false",
        "spring.cloud.consul.discovery.enabled=false",
        "spring.cloud.consul.discovery.register=false",
        "spring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://localhost:9999/jwks",
        "keycloak.client-secret=test-secret"
})
@AutoConfigureMockMvc
class McpServerApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void contextLoads() {
    }

    @Test
    void healthEndpointIsPubliclyAccessible() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }

    @Test
    void mcpTestEndpointRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/mcp-test/recommend-places")
                        .param("destination", "Paris"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unknownEndpointIsNotPubliclyAccessible() throws Exception {
        mockMvc.perform(get("/unknown"))
                .andExpect(status().isUnauthorized());
    }
}