package com.smarttravel.trip.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class TripNotFoundException extends RuntimeException {

    public TripNotFoundException(Long tripId) {
        super("Trip with id " + tripId + " not found.");
    }
}