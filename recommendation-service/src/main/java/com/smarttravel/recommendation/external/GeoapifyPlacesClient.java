package com.smarttravel.recommendation.external;

import com.smarttravel.recommendation.model.Recommendation;
import com.smarttravel.recommendation.model.RecommendationType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.net.URI;
import java.util.List;
import java.util.Optional;

@Component
public class GeoapifyPlacesClient {
    private final RestClient restClient;

    @Value("${external.geoapify.enabled:false}")
    private boolean enabled;

    @Value("${external.geoapify.api-key:}")
    private String apiKey;

    @Value("${external.geoapify.geocoding-url}")
    private String geocodingUrl;

    @Value("${external.geoapify.places-url}")
    private String placesUrl;

    @Value("${external.geoapify.radius-meters:5000}")
    private int radiusMeters;

    @Value("${external.geoapify.limit:10}")
    private int defaultLimit;

    public GeoapifyPlacesClient(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder.build();
    }

    public boolean isEnabled() {
        return enabled;
    }

    public boolean isApiKeyConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String getProviderName() {
        return "Geoapify Places API";
    }

    public List<Recommendation> searchRecommendations(
            String destination,
            RecommendationType type,
            BigDecimal maxBudget
    ) {
        if (!enabled || apiKey == null || apiKey.isBlank()) {
            return List.of();
        }

        try {
            Optional<GeoapifyCoordinates> coordinates = geocodeDestination(destination);

            if (coordinates.isEmpty()) {
                return List.of();
            }

            GeoapifyFeatureCollection response = findPlaces(
                    coordinates.get(),
                    type,
                    defaultLimit
            );

            if (response == null || response.features() == null) {
                return List.of();
            }

            return response.features()
                    .stream()
                    .filter(feature -> feature.properties() != null)
                    .map(feature -> mapToRecommendation(destination, type, feature))
                    .filter(recommendation -> maxBudget == null ||
                            recommendation.getEstimatedPrice().compareTo(maxBudget) <= 0)
                    .toList();

        } catch (Exception exception) {
            return List.of();
        }
    }

    private Optional<GeoapifyCoordinates> geocodeDestination(String destination) {
        URI uri = UriComponentsBuilder
                .fromUriString(geocodingUrl)
                .queryParam("text", destination)
                .queryParam("limit", 1)
                .queryParam("apiKey", apiKey)
                .build()
                .toUri();

        GeoapifyFeatureCollection response = restClient.get()
                .uri(uri)
                .retrieve()
                .body(GeoapifyFeatureCollection.class);

        if (response == null || response.features() == null || response.features().isEmpty()) {
            return Optional.empty();
        }

        GeoapifyProperties properties = response.features().get(0).properties();

        if (properties == null || properties.lat() == null || properties.lon() == null) {
            return Optional.empty();
        }

        return Optional.of(new GeoapifyCoordinates(properties.lat(), properties.lon()));
    }

    private GeoapifyFeatureCollection findPlaces(
            GeoapifyCoordinates coordinates,
            RecommendationType type,
            int limit
    ) {
        String category = mapTypeToGeoapifyCategory(type);

        URI uri = UriComponentsBuilder
                .fromUriString(placesUrl)
                .queryParam("categories", category)
                .queryParam("filter", "circle:" + coordinates.lon() + "," + coordinates.lat() + "," + radiusMeters)
                .queryParam("bias", "proximity:" + coordinates.lon() + "," + coordinates.lat())
                .queryParam("limit", limit)
                .queryParam("apiKey", apiKey)
                .build()
                .toUri();

        return restClient.get()
                .uri(uri)
                .retrieve()
                .body(GeoapifyFeatureCollection.class);
    }

    private Recommendation mapToRecommendation(
            String destination,
            RecommendationType type,
            GeoapifyFeature feature
    ) {
        GeoapifyProperties properties = feature.properties();

        String name = firstNonBlank(
                properties.name(),
                properties.address_line1(),
                type.name() + " in " + destination
        );

        String description = firstNonBlank(
                properties.formatted(),
                properties.address_line2(),
                "Live place recommendation from Geoapify Places API."
        );

        Recommendation recommendation = new Recommendation();
        recommendation.setDestination(destination);
        recommendation.setName(name);
        recommendation.setType(type);
        recommendation.setDescription(description);
        recommendation.setEstimatedPrice(estimatePrice(type));
        recommendation.setRating(estimateRating(type));
        recommendation.setSource("Geoapify Places API");
        recommendation.setExternalPlaceId(properties.placeId());

        return recommendation;
    }

    private String mapTypeToGeoapifyCategory(RecommendationType type) {
        if (type == null) {
            return "tourism";
        }

        return switch (type) {
            case HOTEL -> "accommodation.hotel";
            case RESTAURANT -> "catering.restaurant";
            case ATTRACTION -> "tourism.sights";
        };
    }

    private BigDecimal estimatePrice(RecommendationType type) {
        if (type == null) {
            return BigDecimal.valueOf(25);
        }

        return switch (type) {
            case HOTEL -> BigDecimal.valueOf(100);
            case RESTAURANT -> BigDecimal.valueOf(35);
            case ATTRACTION -> BigDecimal.valueOf(20);
        };
    }

    private Double estimateRating(RecommendationType type) {
        if (type == null) {
            return 4.4;
        }

        return switch (type) {
            case HOTEL -> 4.3;
            case RESTAURANT -> 4.5;
            case ATTRACTION -> 4.6;
        };
    }

    private String firstNonBlank(String first, String second, String fallback) {
        if (first != null && !first.isBlank()) {
            return first;
        }

        if (second != null && !second.isBlank()) {
            return second;
        }

        return fallback;
    }
}