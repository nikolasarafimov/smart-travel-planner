package com.smarttravel.recommendation.external;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GeoapifyProperties(
        @JsonProperty("place_id")
        String placeId,

        String name,
        String formatted,
        String address_line1,
        String address_line2,
        String city,
        String country,
        Double lat,
        Double lon,
        List<String> categories
) {
}