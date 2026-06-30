package com.smarttravel.trip.event;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
@RequiredArgsConstructor
public class TripEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.kafka.topics.trip-created}")
    private String tripCreatedTopic;

    public void publishTripCreatedEvent(TripCreatedEvent event) {
        try {
            String message = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(tripCreatedTopic, event.tripId().toString(), message);
        } catch (RuntimeException e) {
            throw new RuntimeException("Failed to serialize TripCreatedEvent", e);
        }
    }
}