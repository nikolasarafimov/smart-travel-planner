package com.smarttravel.mcp.tools;

import com.smarttravel.mcp.client.SmartTravelApiClient;
import com.smarttravel.mcp.dto.RecommendationResponse;
import com.smarttravel.mcp.dto.SavedRecommendationResponse;
import com.smarttravel.mcp.dto.TripResponse;
import org.springframework.ai.mcp.annotation.McpTool;
import org.springframework.ai.mcp.annotation.McpToolParam;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class SmartTravelMcpTools {

    private static final int DEFAULT_LIMIT = 10;
    private static final int MAX_LIMIT = 50;

    private final SmartTravelApiClient smartTravelApiClient;

    public SmartTravelMcpTools(SmartTravelApiClient smartTravelApiClient) {
        this.smartTravelApiClient = smartTravelApiClient;
    }

    @McpTool(
            name = "recommend_places",
            description = "Recommend hotels, restaurants, or attractions for a travel destination."
    )
    public List<RecommendationResponse> recommendPlaces(
            @McpToolParam(
                    description = "Destination city, for example Paris.",
                    required = true
            )
            String destination,

            @McpToolParam(
                    description = "Recommendation type: ATTRACTION, HOTEL, or RESTAURANT. Leave empty to return all types.",
                    required = false
            )
            String type,

            @McpToolParam(
                    description = "Maximum number of results to return. Defaults to 10 and cannot exceed 50.",
                    required = false
            )
            Integer limit
    ) {
        if (destination == null || destination.isBlank()) {
            throw new IllegalArgumentException("Destination must not be blank");
        }

        int requestedLimit = limit == null ? DEFAULT_LIMIT : limit;

        if (requestedLimit <= 0) {
            throw new IllegalArgumentException("Limit must be greater than zero");
        }

        int effectiveLimit = Math.min(requestedLimit, MAX_LIMIT);

        return smartTravelApiClient
                .getRecommendations(destination.trim(), type)
                .stream()
                .limit(effectiveLimit)
                .toList();
    }

    @McpTool(
            name = "get_trip_details",
            description = "Get details for a specific trip by trip id."
    )
    public TripResponse getTripDetails(
            @McpToolParam(description = "Trip id.", required = true)
            Long tripId
    ) {
        validateTripId(tripId);
        return smartTravelApiClient.getTripDetails(tripId);
    }

    @McpTool(
            name = "get_saved_attractions",
            description = "Get saved attractions for a specific trip."
    )
    public List<SavedRecommendationResponse> getSavedAttractions(
            @McpToolParam(description = "Trip id.", required = true)
            Long tripId
    ) {
        validateTripId(tripId);

        return smartTravelApiClient
                .getSavedRecommendations(tripId)
                .stream()
                .filter(item -> item.recommendation() != null)
                .filter(item -> "ATTRACTION".equalsIgnoreCase(item.recommendation().type()))
                .toList();
    }

    @McpTool(
            name = "estimate_trip_cost",
            description = "Estimate the total cost of saved recommendations for a trip."
    )
    public float estimateTripCost(
            @McpToolParam(description = "Trip id.", required = true)
            Long tripId
    ) {
        validateTripId(tripId);
        return smartTravelApiClient.estimateTripCost(tripId);
    }

    private static void validateTripId(Long tripId) {
        if (tripId == null || tripId <= 0) {
            throw new IllegalArgumentException("Trip id must be greater than zero");
        }
    }
}