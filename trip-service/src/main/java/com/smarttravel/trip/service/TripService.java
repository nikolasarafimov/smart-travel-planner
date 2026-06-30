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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;
    private final RecommendationClient recommendationClient;
    private final TripEventProducer tripEventProducer;

    public TripResponse createTrip(CreateTripRequest request) {
        Trip trip = Trip.builder()
                .userId(request.userId())
                .destination(request.destination())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .budget(request.budget())
                .currency(request.currency() == null ? "EURO" : request.currency())
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
        Trip trip = findTripById(id);
        return mapToResponse(trip);
    }

    public TripResponse updateTrip(Long id, UpdateTripRequest request) {
        Trip trip = findTripById(id);

        trip.setDestination(request.destination());
        trip.setStartDate(request.startDate());
        trip.setEndDate(request.endDate());
        trip.setBudget(request.budget());
        trip.setCurrency(request.currency() == null ? trip.getCurrency() : request.currency());
        trip.setStatus(request.status() == null ? trip.getStatus() : request.status());

        Trip updatedTrip = tripRepository.save(trip);

        return mapToResponse(updatedTrip);
    }

    public void deleteTrip(Long id) {
        Trip trip = findTripById(id);
        tripRepository.delete(trip);
    }

    public List<RecommendationResponse> getRecommendationsForTrip(Long id) {
        Trip trip = findTripById(id);
        return recommendationClient.getRecommendationsByDestinations(trip.getDestination());
    }

    public float getEstimatedCostForTrip(Long id) {
        findTripById(id);
        return recommendationClient.estimateTripCost(id);
    }

    private Trip findTripById(Long id) {
        return tripRepository.findById(id)
                .orElseThrow(() -> new TripNotFoundException (id));
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