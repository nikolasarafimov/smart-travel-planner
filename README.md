# Smart Travel Planner

Smart Travel Planner is a **Dockerized microservice-based travel planning platform** built with Spring Boot and React. It demonstrates modern **Service-Oriented Architecture (SOA)** concepts including API Gateway routing, service discovery, authentication, synchronous and asynchronous service communication, external API integration, contract testing, and MCP tooling.

## Authors

- Nikola Sarafimov
- Klaudija Stamenova

---

## Overview

The application allows users to:

- Create and manage trips
- Search attractions, hotels, and restaurants
- Save recommendations to specific trips
- Estimate the total cost of saved recommendations
- Retrieve live travel data through the **Geoapify Places API**
- Authenticate securely using **Keycloak**
- Test MCP-based travel tools
- Run the complete system through **Docker Compose**

---

## Architecture

```text
React Frontend
      |
      v
API Gateway
      |
      +-------------------------+
      |                         |
      v                         v
Trip Service          Recommendation Service
      |                         |
   Trip DB              Recommendation DB
      |
      +---- Feign ------------>|
      |
      +---- Kafka: trip-created
                                |
                                v
                    Recommendation Consumer

MCP Server -> API Gateway -> Backend Services

Keycloak -> Authentication
Consul   -> Service Discovery
Kafka    -> Event Communication
```

The system is divided into independent services with separate responsibilities and databases.

---

## Technology Stack

### Backend

- Java 21
- Spring Boot
- Spring Cloud
- Spring Security
- Spring Cloud Gateway
- OpenFeign
- Spring Kafka
- Spring Data JPA
- PostgreSQL
- Keycloak
- Consul
- Pact
- Spring AI MCP Server
- Swagger / OpenAPI

### Frontend

- React
- Vite
- Axios
- Keycloak JS
- Nginx

### Infrastructure

- Docker
- Docker Compose
- Apache Kafka
- Kafka UI
- PostgreSQL
- Consul
- Keycloak

---

## Microservices

### Trip Service

Responsible for trip management.

Main capabilities:

- Create, update, delete, and retrieve trips
- Retrieve trips by user
- Publish `trip-created` Kafka events
- Communicate with Recommendation Service through Feign
- Retrieve recommendations and estimated trip costs

```http
POST   /api/trips
GET    /api/trips
GET    /api/trips/{id}
PUT    /api/trips/{id}
DELETE /api/trips/{id}
GET    /api/trips/{id}/recommendations
GET    /api/trips/{id}/estimated-cost
```

### Recommendation Service

Responsible for travel recommendations and saved places.

Main capabilities:

- Search attractions, hotels, and restaurants
- Return local seed data
- Retrieve live recommendations from Geoapify
- Save recommendations to trips
- Estimate total recommendation costs
- Consume `trip-created` Kafka events
- Prevent duplicate external records using `externalPlaceId`

```http
GET  /api/recommendations
GET  /api/recommendations/hotels
GET  /api/recommendations/restaurants
GET  /api/recommendations/attractions
POST /api/recommendations/{id}/save
GET  /api/recommendations/saved
GET  /api/recommendations/estimate
```

### API Gateway

Provides a single entry point for backend communication.

```text
/api/trips/**           -> Trip Service
/api/recommendations/** -> Recommendation Service
/mcp/**                 -> MCP Server
```

It also validates **Keycloak JWT tokens** and uses **Consul service discovery**.

### MCP Server

Exposes Smart Travel Planner functionality through MCP tools.

Available tools:

```text
recommend_places
get_trip_details
get_saved_attractions
estimate_trip_cost
```

The MCP Server authenticates using the OAuth2 **client credentials flow** and communicates with backend services through the API Gateway.

---

## SOA Concepts

| Concept | Implementation |
|---|---|
| Microservices | Independent Trip and Recommendation services |
| Domain-Driven Design | Separate Trip and Recommendation bounded contexts |
| API Gateway | Spring Cloud Gateway |
| Service Discovery | Consul |
| Authentication | Keycloak + JWT |
| Synchronous Communication | OpenFeign |
| Asynchronous Communication | Kafka |
| External API Integration | Geoapify Places API |
| Contract Testing | Pact |
| MCP Integration | Spring AI MCP Server |
| Persistence | Separate PostgreSQL databases |
| Containerization | Docker Compose |

---

## External API Integration

The Recommendation Service integrates with the **Geoapify Places API**.

Recommendation strategy:

```text
1. Search local seed data
2. Return seed data when available
3. Otherwise request live data from Geoapify
4. Persist external recommendations
5. Prevent duplicates using externalPlaceId
```

This provides predictable local data for testing while still supporting live travel recommendations.

---

## Security

Authentication and authorization are handled by **Keycloak**.

```text
User
  |
  v
Keycloak Login
  |
  v
JWT Access Token
  |
  v
React Frontend
  |
  v
API Gateway
  |
  v
Backend Services
```

Protected API endpoints require a valid JWT.

The MCP Server uses a dedicated confidential Keycloak client and obtains its own service token.

---

## Running the Project

### Requirements

- Docker Desktop
- Git

Java 21 and Node.js are only required when running services outside Docker.

### Environment Variables

Create a `.env` file in the project root:

```env
MCP_CLIENT_SECRET=YOUR_KEYCLOAK_CLIENT_SECRET
GEOAPIFY_API_KEY=YOUR_GEOAPIFY_API_KEY
```

> Never commit `.env` files or API secrets to GitHub.

### Start the Application

```bash
docker compose up -d --build
```

Check running containers:

```bash
docker compose ps
```

Open the frontend:

```text
http://localhost:3000
```

---

## Service URLs

| Component | URL |
|---|---|
| Frontend | `http://localhost:3000` |
| API Gateway | `http://localhost:8080` |
| Trip Service | `http://localhost:8081` |
| Recommendation Service | `http://localhost:8082` |
| Kafka UI | `http://localhost:8085` |
| Keycloak | `http://localhost:8086` |
| MCP Server | `http://localhost:8087` |
| Consul UI | `http://localhost:8500` |

---

## Testing

The project includes integration and architecture-focused testing for:

- Keycloak authentication
- Protected API endpoints
- Trip CRUD operations
- Seed and live recommendations
- Kafka event publishing and consumption
- Feign communication
- Recommendation saving
- Cost estimation
- MCP tools
- Pact consumer/provider contracts

### Pact Contract Tests

```bash
./mvnw -f trip-service/pom.xml -Dtest=TripRecommendationConsumerPactTest test
```

```bash
./mvnw -f recommendation-service/pom.xml -Dtest=RecommendationProviderPactVerificationTest test
```

---

## Project Highlights

- Microservice architecture with isolated bounded contexts
- Secure JWT authentication with Keycloak
- Service discovery through Consul
- Kafka-based event-driven communication
- Feign-based synchronous service communication
- Live travel data from Geoapify
- Consumer-driven contract testing with Pact
- MCP Server integration
- Separate PostgreSQL databases per service
- Fully containerized environment with Docker Compose
- React frontend for demonstrating the complete system