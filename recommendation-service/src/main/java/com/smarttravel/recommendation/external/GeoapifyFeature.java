package com.smarttravel.recommendation.external;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GeoapifyFeature(
        GeoapifyProperties properties
) {
}