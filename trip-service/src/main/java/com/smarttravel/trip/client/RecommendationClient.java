package com.smarttravel.trip.client;

import com.smarttravel.trip.dto.RecommendationResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "recommendation-service", path = "/api/recommendations")
public interface RecommendationClient {
    @GetMapping
    List<RecommendationResponse> getRecommendationsByDestinations(@RequestParam("destination") String destination);
    @GetMapping("/estimate")
    float estimateTripCost(@RequestParam("tripId") Long tripId);
}
