package com.smarttravel.trip.service;

import com.smarttravel.trip.client.RecommendationClient;
import com.smarttravel.trip.dto.CreateTripRequest;
import com.smarttravel.trip.dto.RecommendationResponse;
import com.smarttravel.trip.dto.TripResponse;
import com.smarttravel.trip.dto.UpdateTripRequest;
import com.smarttravel.trip.event.TripCreatedEvent;
import com.smarttravel.trip.event.TripEventProducer;
import com.smarttravel.trip.exceptions.TripNotFoundException;
import com.smarttravel.trip.model.Trip;
import com.smarttravel.trip.model.TripStatus;
import com.smarttravel.trip.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TripService {

    private static final String DEFAULT_CURRENCY = "EUR";

    private final TripRepository tripRepository;
    private final RecommendationClient recommendationClient;
    private final TripEventProducer tripEventProducer;

    public TripResponse createTrip(CreateTripRequest request) {
        Trip trip = Trip.builder()
                .userId(request.userId().trim())
                .destination(request.destination().trim())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .budget(request.budget())
                .currency(normalizeCurrency(request.currency(), DEFAULT_CURRENCY))
                .status(TripStatus.PLANNED)
                .build();

        Trip savedTrip = tripRepository.save(trip);

        tripEventProducer.publishTripCreatedEvent(
                new TripCreatedEvent(
                        savedTrip.getId(),
                        savedTrip.getUserId(),
                        savedTrip.getDestination(),
                        savedTrip.getStartDate(),
                        savedTrip.getEndDate(),
                        savedTrip.getBudget(),
                        savedTrip.getCurrency()
                )
        );

        return mapToResponse(savedTrip);
    }

    public List<TripResponse> getAllTrips() {
        return tripRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<TripResponse> getTripsByUserId(String userId) {
        return tripRepository.findByUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public TripResponse getTripById(Long id) {
        return mapToResponse(findTripById(id));
    }

    public TripResponse updateTrip(Long id, UpdateTripRequest request) {
        Trip trip = findTripById(id);

        trip.setDestination(request.destination().trim());
        trip.setStartDate(request.startDate());
        trip.setEndDate(request.endDate());
        trip.setBudget(request.budget());
        trip.setCurrency(normalizeCurrency(request.currency(), trip.getCurrency()));

        if (request.status() != null) {
            trip.setStatus(request.status());
        }

        return mapToResponse(tripRepository.save(trip));
    }

    public void deleteTrip(Long id) {
        tripRepository.delete(findTripById(id));
    }

    public List<RecommendationResponse> getRecommendationsForTrip(Long id) {
        Trip trip = findTripById(id);

        return recommendationClient.getRecommendationsByDestination(
                trip.getDestination()
        );
    }

    public float getEstimatedCostForTrip(Long id) {
        findTripById(id);
        return recommendationClient.estimateTripCost(id);
    }

    private Trip findTripById(Long id) {
        return tripRepository.findById(id)
                .orElseThrow(() -> new TripNotFoundException(id));
    }

    private String normalizeCurrency(String currency, String fallback) {
        if (currency == null || currency.isBlank()) {
            return fallback;
        }

        return currency.trim().toUpperCase();
    }

    private TripResponse mapToResponse(Trip trip) {
        return new TripResponse(
                trip.getId(),
                trip.getUserId(),
                trip.getDestination(),
                trip.getStartDate(),
                trip.getEndDate(),
                trip.getBudget(),
                trip.getCurrency(),
                trip.getStatus(),
                trip.getCreatedAt()
        );
    }
}