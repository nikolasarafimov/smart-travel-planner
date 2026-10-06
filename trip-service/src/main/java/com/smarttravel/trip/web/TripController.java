package com.smarttravel.trip.web;

import com.smarttravel.trip.dto.CreateTripRequest;
import com.smarttravel.trip.dto.RecommendationResponse;
import com.smarttravel.trip.dto.TripResponse;
import com.smarttravel.trip.dto.UpdateTripRequest;
import com.smarttravel.trip.service.TripService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TripResponse createTrip(@Valid @RequestBody CreateTripRequest request) {
        return tripService.createTrip(request);
    }

    @GetMapping
    public List<TripResponse> getAllTrips(
            @RequestParam(required = false) String userId) {

        if (userId != null && !userId.isBlank()) {
            return tripService.getTripsByUserId(userId.trim());
        }

        return tripService.getAllTrips();
    }

    @GetMapping("/{id}")
    public TripResponse getTripById(@PathVariable Long id) {
        return tripService.getTripById(id);
    }

    @PutMapping("/{id}")
    public TripResponse updateTrip(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTripRequest request) {

        return tripService.updateTrip(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTrip(@PathVariable Long id) {
        tripService.deleteTrip(id);
    }

    @GetMapping("/{id}/recommendations")
    public List<RecommendationResponse> getRecommendationsForTrip(
            @PathVariable Long id) {

        return tripService.getRecommendationsForTrip(id);
    }

    @GetMapping("/{id}/estimated-cost")
    public float getEstimatedCostForTrip(@PathVariable Long id) {
        return tripService.getEstimatedCostForTrip(id);
    }
}