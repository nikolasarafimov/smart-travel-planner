package com.smarttravel.trip.exceptions;

public class TripNotFoundException extends RuntimeException{
        public TripNotFoundException(Long tripId) {
        super("Trip with id "+tripId +" not found.");
    }
}
