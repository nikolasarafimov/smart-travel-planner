package com.smarttravel.recommendation.external;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GeoapifyFeatureCollection(
        List<GeoapifyFeature> features
) {
}