package com.smarttravel.recommendation.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
public class TripCreatedEventConsumer {

    private static final Logger logger = LoggerFactory.getLogger(TripCreatedEventConsumer.class);

    private final ObjectMapper objectMapper;

    public TripCreatedEventConsumer(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @KafkaListener(
            topics = "${app.kafka.topics.trip-created}",
            groupId = "${spring.kafka.consumer.group-id}"
    )
    public void handleTripCreatedEvent(String message) {
        try {
            TripCreatedEvent event = objectMapper.readValue(message, TripCreatedEvent.class);

            logger.info(
                    "Received TripCreatedEvent: tripId={}, destination={}, budget={} {}",
                    event.tripId(),
                    event.destination(),
                    event.budget(),
                    event.currency()
            );

        } catch (RuntimeException e) {
            throw new RuntimeException("Failed to deserialize TripCreatedEvent", e);
        }
    }
}