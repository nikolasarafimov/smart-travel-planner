package com.smarttravel.trip.config;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Configuration
public class FeignConfig {

    @Bean
    public RequestInterceptor bearerTokenRequestInterceptor() {
        return requestTemplate -> {
            if (RequestContextHolder.getRequestAttributes()
                    instanceof ServletRequestAttributes attributes) {

                String authorizationHeader =
                        attributes.getRequest().getHeader(HttpHeaders.AUTHORIZATION);

                if (authorizationHeader != null && !authorizationHeader.isBlank()) {
                    requestTemplate.header(HttpHeaders.AUTHORIZATION, authorizationHeader);
                }
            }
        };
    }
}