package com.smarttravel.recommendation.external;

import com.smarttravel.recommendation.model.Recommendation;
import com.smarttravel.recommendation.model.RecommendationType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger LOGGER =
            LoggerFactory.getLogger(GeoapifyPlacesClient.class);

    private static final String PROVIDER_NAME = "Geoapify Places API";

    private final RestClient restClient;
    private final boolean enabled;
    private final String apiKey;
    private final String geocodingUrl;
    private final String placesUrl;
    private final int radiusMeters;
    private final int defaultLimit;

    public GeoapifyPlacesClient(
            RestClient.Builder restClientBuilder,
            @Value("${external.geoapify.enabled:false}") boolean enabled,
            @Value("${external.geoapify.api-key:}") String apiKey,
            @Value("${external.geoapify.geocoding-url}") String geocodingUrl,
            @Value("${external.geoapify.places-url}") String placesUrl,
            @Value("${external.geoapify.radius-meters:5000}") int radiusMeters,
            @Value("${external.geoapify.limit:10}") int defaultLimit) {

        this.restClient = restClientBuilder.build();
        this.enabled = enabled;
        this.apiKey = apiKey;
        this.geocodingUrl = geocodingUrl;
        this.placesUrl = placesUrl;
        this.radiusMeters = Math.max(1, radiusMeters);
        this.defaultLimit = Math.max(1, defaultLimit);
    }

    public boolean isEnabled() {
        return enabled;
    }

    public boolean isApiKeyConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String getProviderName() {
        return PROVIDER_NAME;
    }

    public List<Recommendation> searchRecommendations(
            String destination,
            RecommendationType type,
            BigDecimal maxBudget) {

        if (!enabled || !isApiKeyConfigured()) {
            return List.of();
        }

        if (destination == null || destination.isBlank() || type == null) {
            return List.of();
        }

        try {
            Optional<GeoapifyCoordinates> coordinates =
                    geocodeDestination(destination.trim());

            if (coordinates.isEmpty()) {
                return List.of();
            }

            GeoapifyFeatureCollection response =
                    findPlaces(coordinates.get(), type, defaultLimit);

            if (response == null || response.features() == null) {
                return List.of();
            }

            return response.features()
                    .stream()
                    .filter(feature -> feature != null && feature.properties() != null)
                    .map(feature ->
                            mapToRecommendation(destination.trim(), type, feature))
                    .filter(recommendation ->
                            maxBudget == null
                                    || recommendation.getEstimatedPrice()
                                    .compareTo(maxBudget) <= 0)
                    .toList();

        } catch (RuntimeException exception) {
            LOGGER.warn(
                    "Geoapify request failed for destination={} and type={}",
                    destination,
                    type,
                    exception
            );

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
                .encode()
                .toUri();

        GeoapifyFeatureCollection response = restClient.get()
                .uri(uri)
                .retrieve()
                .body(GeoapifyFeatureCollection.class);

        if (response == null
                || response.features() == null
                || response.features().isEmpty()) {
            return Optional.empty();
        }

        GeoapifyFeature feature = response.features().getFirst();

        if (feature == null || feature.properties() == null) {
            return Optional.empty();
        }

        GeoapifyProperties properties = feature.properties();

        if (properties.lat() == null || properties.lon() == null) {
            return Optional.empty();
        }

        return Optional.of(
                new GeoapifyCoordinates(
                        properties.lat(),
                        properties.lon()
                )
        );
    }

    private GeoapifyFeatureCollection findPlaces(
            GeoapifyCoordinates coordinates,
            RecommendationType type,
            int limit) {

        String category = mapTypeToGeoapifyCategory(type);

        URI uri = UriComponentsBuilder
                .fromUriString(placesUrl)
                .queryParam("categories", category)
                .queryParam(
                        "filter",
                        "circle:"
                                + coordinates.lon()
                                + ","
                                + coordinates.lat()
                                + ","
                                + radiusMeters
                )
                .queryParam(
                        "bias",
                        "proximity:"
                                + coordinates.lon()
                                + ","
                                + coordinates.lat()
                )
                .queryParam("limit", limit)
                .queryParam("apiKey", apiKey)
                .build()
                .encode()
                .toUri();

        return restClient.get()
                .uri(uri)
                .retrieve()
                .body(GeoapifyFeatureCollection.class);
    }

    private Recommendation mapToRecommendation(
            String destination,
            RecommendationType type,
            GeoapifyFeature feature) {

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
        recommendation.setSource(PROVIDER_NAME);
        recommendation.setExternalPlaceId(properties.placeId());

        return recommendation;
    }

    private String mapTypeToGeoapifyCategory(RecommendationType type) {
        return switch (type) {
            case HOTEL -> "accommodation.hotel";
            case RESTAURANT -> "catering.restaurant";
            case ATTRACTION -> "tourism.sights";
        };
    }

    private BigDecimal estimatePrice(RecommendationType type) {
        return switch (type) {
            case HOTEL -> BigDecimal.valueOf(100);
            case RESTAURANT -> BigDecimal.valueOf(35);
            case ATTRACTION -> BigDecimal.valueOf(20);
        };
    }

    private Double estimateRating(RecommendationType type) {
        return switch (type) {
            case HOTEL -> 4.3;
            case RESTAURANT -> 4.5;
            case ATTRACTION -> 4.6;
        };
    }

    private String firstNonBlank(
            String first,
            String second,
            String fallback) {

        if (first != null && !first.isBlank()) {
            return first;
        }

        if (second != null && !second.isBlank()) {
            return second;
        }

        return fallback;
    }
}