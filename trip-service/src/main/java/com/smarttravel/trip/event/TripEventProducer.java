package com.smarttravel.trip.event;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
public class TripEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final String tripCreatedTopic;

    public TripEventProducer(
            KafkaTemplate<String, String> kafkaTemplate,
            ObjectMapper objectMapper,
            @Value("${app.kafka.topics.trip-created}") String tripCreatedTopic) {

        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.tripCreatedTopic = tripCreatedTopic;
    }

    public void publishTripCreatedEvent(TripCreatedEvent event) {
        String message;

        try {
            message = objectMapper.writeValueAsString(event);
        } catch (RuntimeException e) {
            throw new IllegalStateException(
                    "Failed to serialize TripCreatedEvent",
                    e
            );
        }

        kafkaTemplate.send(
                tripCreatedTopic,
                event.tripId().toString(),
                message
        );
    }
}