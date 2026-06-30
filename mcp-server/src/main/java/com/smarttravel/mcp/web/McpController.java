package com.smarttravel.mcp.web;


import com.smarttravel.mcp.dto.RecommendationResponse;
import com.smarttravel.mcp.dto.SavedRecommendationResponse;
import com.smarttravel.mcp.dto.TripResponse;
import com.smarttravel.mcp.tools.SmartTravelMcpTools;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/mcp-test")
public class McpController {

    private final SmartTravelMcpTools tools;

    public McpController(SmartTravelMcpTools tools) {
        this.tools = tools;
    }

    @GetMapping("/recommend-places")
    public List<RecommendationResponse> recommendPlaces(
            @RequestParam String destination,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer limit
    ) {
        return tools.recommendPlaces(destination, type, limit);
    }

    @GetMapping("/trip/{tripId}")
    public TripResponse getTripDetails(@PathVariable Long tripId) {
        return tools.getTripDetails(tripId);
    }

    @GetMapping("/saved-attractions")
    public List<SavedRecommendationResponse> getSavedAttractions(@RequestParam Long tripId) {
        return tools.getSavedAttractions(tripId);
    }

    @GetMapping("/estimate")
    public float estimateTripCost(@RequestParam Long tripId) {
        return tools.estimateTripCost(tripId);
    }
}
