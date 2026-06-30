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

    private final SmartTravelApiClient smartTravelApiClient;

    public SmartTravelMcpTools(SmartTravelApiClient smartTravelApiClient) {
        this.smartTravelApiClient = smartTravelApiClient;
    }

    @McpTool(
            name = "recommend_places",
            description = "Recommend hotels, restaurants, or attractions for a travel destination."
    )
    public List<RecommendationResponse> recommendPlaces(
            @McpToolParam(description = "Destination city, for example Paris", required = true)
            String destination,

            @McpToolParam(description = "Recommendation type: ATTRACTION, HOTEL, RESTAURANT. Can be empty for all types.", required = false)
            String type,

            @McpToolParam(description = "Maximum number of results to return.", required = false)
            Integer limit
    ) {
        List<RecommendationResponse> recommendations =
                smartTravelApiClient.getRecommendations(destination, type);

        if (recommendations == null) {
            return List.of();
        }

        int max = limit == null || limit <= 0 ? recommendations.size() : Math.min(limit, recommendations.size());

        return recommendations.stream()
                .limit(max)
                .toList();
    }

    @McpTool(
            name = "get_trip_details",
            description = "Get details for a specific trip by trip id."
    )
    public TripResponse getTripDetails(
            @McpToolParam(description = "Trip id", required = true)
            Long tripId
    ) {
        return smartTravelApiClient.getTripDetails(tripId);
    }

    @McpTool(
            name = "get_saved_attractions",
            description = "Get saved attractions for a specific trip."
    )
    public List<SavedRecommendationResponse> getSavedAttractions(
            @McpToolParam(description = "Trip id", required = true)
            Long tripId
    ) {
        List<SavedRecommendationResponse> saved =
                smartTravelApiClient.getSavedRecommendations(tripId);

        if (saved == null) {
            return List.of();
        }

        return saved.stream()
                .filter(item -> item.recommendation() != null)
                .filter(item -> "ATTRACTION".equalsIgnoreCase(item.recommendation().type()))
                .toList();
    }

    @McpTool(
            name = "estimate_trip_cost",
            description = "Estimate the total cost of saved recommendations for a trip."
    )
    public float estimateTripCost(
            @McpToolParam(description = "Trip id", required = true)
            Long tripId
    ) {
        return smartTravelApiClient.estimateTripCost(tripId);
    }
}