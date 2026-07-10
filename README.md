# Smart Travel Planner

Smart Travel Planner is a Dockerized microservice-based SOA project for planning trips, searching travel recommendations, saving places to trips, estimating travel costs, and demonstrating communication between independent services.

The system includes API Gateway routing, Keycloak authentication, Consul service discovery, Kafka event communication, Feign synchronous communication, PostgreSQL persistence, Pact contract testing, a React frontend, Geoapify external API integration, and an MCP Server.

---

## Authors

- Nikola Sarafimov
- Klaudija Stamenova

---

## Project Overview

Smart Travel Planner allows users to:

- create and manage trips;
- search recommendations for attractions, hotels and restaurants;
- save recommendations to a specific trip;
- estimate the total cost of saved recommendations;
- use local seed data and live external data from Geoapify Places API;
- test MCP tools through a dedicated MCP Server;
- verify SOA concepts through a full Docker Compose environment.

---

## Architecture

```text
React Frontend
      |
      v
API Gateway
      |
      +---------------------------+
      |                           |
      v                           v
Trip Service              Recommendation Service
      |                           |
   Trip DB              Recommendation DB
      |
      v
Kafka topic: trip-created
      |
      v
Recommendation Service Consumer

MCP Server -> API Gateway -> Backend Services

Keycloak -> Authentication and JWT issuing
Consul   -> Service registry and service discovery
Kafka UI -> Kafka topic/message inspection
```

---

## Services and Infrastructure

| Component | Port | Description |
|---|---:|---|
| Frontend | `3000` | React/Vite frontend served through Nginx |
| API Gateway | `8080` | Centralized entry point for backend API requests |
| Trip Service | `8081` | Manages trips, publishes Kafka events and calls Recommendation Service through Feign |
| Recommendation Service | `8082` | Manages recommendations, saved recommendations, cost estimation and Geoapify integration |
| Kafka UI | `8085` | UI for inspecting Kafka topics and messages |
| Keycloak | `8086` | Authentication and authorization server |
| MCP Server | `8087` | MCP tool server and REST helper endpoints for testing |
| Consul | `8500` | Service registry and discovery |
| Recommendation DB | `5433` | PostgreSQL database for Recommendation Service |
| Trip DB | `5434` | PostgreSQL database for Trip Service |
| Kafka Broker | `9094` | External Kafka listener for local testing |

---

## Technology Stack

### Backend

- Java 21
- Spring Boot
- Spring Cloud
- Spring Security
- OAuth2 Resource Server
- Keycloak JWT authentication
- Spring Cloud Gateway MVC
- Spring Cloud Consul Discovery
- OpenFeign
- Spring Kafka
- Spring Data JPA
- PostgreSQL
- Springdoc OpenAPI / Swagger
- Pact contract testing
- Spring AI MCP Server

### Frontend

- React
- Vite
- Axios
- Keycloak JS
- Nginx
- Responsive CSS

### Infrastructure

- Docker
- Docker Compose
- Consul
- Kafka
- Kafka UI
- Keycloak
- PostgreSQL

---

## Microservice Responsibilities

### Trip Service

The Trip Service represents the trip planning bounded context.

Responsibilities:

- create trips;
- update trips;
- delete trips;
- list trips;
- get trips by user;
- get trip by ID;
- publish `trip-created` Kafka events;
- call Recommendation Service through Feign;
- estimate trip cost through Recommendation Service.

Main endpoints:

```http
POST   /api/trips
GET    /api/trips
GET    /api/trips?userId=demo-user
GET    /api/trips/{id}
PUT    /api/trips/{id}
DELETE /api/trips/{id}
GET    /api/trips/{id}/recommendations
GET    /api/trips/{id}/estimated-cost
```

---

### Recommendation Service

The Recommendation Service represents the recommendation bounded context.

Responsibilities:

- search recommendations by destination and type;
- return seed recommendations;
- use Geoapify Places API as live external fallback;
- avoid duplicate live API records using `externalPlaceId`;
- save recommendations to trips;
- load saved recommendations;
- estimate total saved recommendation cost;
- consume `trip-created` Kafka events.

Main endpoints:

```http
GET  /api/recommendations?destination=Paris
GET  /api/recommendations?destination=Paris&type=ATTRACTION
GET  /api/recommendations/hotels?destination=Paris&budget=100
GET  /api/recommendations/restaurants?destination=Paris
GET  /api/recommendations/attractions?destination=Paris
GET  /api/recommendations/external/status
POST /api/recommendations/{id}/save
GET  /api/recommendations/saved?tripId=1
GET  /api/recommendations/estimate?tripId=1
```

---

### API Gateway

The API Gateway is the centralized backend entry point.

Responsibilities:

- route trip requests to Trip Service;
- route recommendation requests to Recommendation Service;
- route MCP requests when needed;
- enforce Keycloak JWT authentication for protected API routes;
- use Consul service discovery and load-balanced service names.

Main routes:

```text
/api/trips/**              -> trip-service
/api/recommendations/**    -> recommendation-service
/mcp/**                    -> mcp-server
```

---

### MCP Server

The MCP Server exposes Smart Travel Planner functionality as MCP tools.

Responsibilities:

- expose travel-related MCP tools;
- retrieve its own Keycloak service token using client credentials;
- call backend services through the API Gateway;
- provide REST helper endpoints for frontend testing;
- support MCP Inspector testing.

MCP tools:

```text
recommend_places
get_trip_details
get_saved_attractions
estimate_trip_cost
```

REST helper endpoints:

```http
GET /api/mcp-test/recommend-places?destination=Paris&type=ATTRACTION&limit=3
GET /api/mcp-test/trip/{tripId}
GET /api/mcp-test/saved-attractions?tripId={tripId}
GET /api/mcp-test/estimate?tripId={tripId}
```

---

## SOA Concepts Implemented

| SOA Requirement | Implementation |
|---|---|
| Microservice architecture | Separate Trip Service, Recommendation Service, API Gateway, MCP Server and frontend |
| Domain-Driven Design | Trip and Recommendation bounded contexts |
| API Gateway | Centralized routing through `api-gateway` |
| Service discovery | Consul service registry |
| Security | Keycloak JWT authentication |
| Synchronous communication | Feign call from Trip Service to Recommendation Service |
| Asynchronous communication | Kafka `trip-created` event |
| External API integration | Geoapify Places API |
| Consumer-driven contract testing | Pact consumer/provider tests |
| MCP Server | Spring AI MCP Server with travel tools |
| Dockerization | Complete Docker Compose environment |

---

## Prerequisites

Install the following before running the project:

- Docker Desktop
- Git
- Java 21
- Node.js 22 or compatible Node version
- IntelliJ IDEA or another IDE
- Optional: Postman / IntelliJ HTTP Client
- Optional: MCP Inspector through `npx`

---

## Environment Variables

Create a `.env` file in the root directory.

```env
MCP_CLIENT_SECRET=PASTE_KEYCLOAK_MCP_CLIENT_SECRET_HERE
GEOAPIFY_API_KEY=PASTE_GEOAPIFY_API_KEY_HERE
```

Do not commit `.env` to GitHub.

A safe example file can be kept as `.env.example`:

```env
MCP_CLIENT_SECRET=PASTE_KEYCLOAK_MCP_CLIENT_SECRET_HERE
GEOAPIFY_API_KEY=PASTE_GEOAPIFY_API_KEY_HERE
```

---

## Keycloak Setup

After starting Docker Compose, open Keycloak:

```text
http://localhost:8086/admin
```

Default admin credentials:

```text
Username: admin
Password: admin
```

Create a realm:

```text
smart-travel
```

### Public Frontend Client

Create client:

```text
Client ID: smart-travel-client
Client authentication: OFF
Standard flow: ON
Direct access grants: ON
```

Valid redirect URIs:

```text
http://localhost:3000/*
http://localhost:5173/*
http://127.0.0.1:5173/*
```

Valid post logout redirect URIs:

```text
http://localhost:3000/*
http://localhost:5173/*
http://127.0.0.1:5173/*
```

Web origins:

```text
http://localhost:3000
http://localhost:5173
http://127.0.0.1:5173
```

### Demo User

Create user:

```text
Username: demo-user
Password: demo-pass
```

Make sure the password is not temporary.

### MCP Confidential Client

Create client:

```text
Client ID: mcp-server-client
Client authentication: ON
Service accounts roles: ON
Standard flow: OFF
Direct access grants: OFF
```

Copy the client secret from:

```text
Clients -> mcp-server-client -> Credentials -> Client secret
```

Paste it into root `.env`:

```env
MCP_CLIENT_SECRET=PASTE_SECRET_HERE
```

---

## Running the Full Project

From the root directory:

```powershell
docker compose up -d --build
```

Check running containers:

```powershell
docker compose ps
```

Expected containers:

```text
smart-travel-consul
smart-travel-recommendation-db
smart-travel-trip-db
smart-travel-kafka
smart-travel-kafka-ui
smart-travel-keycloak
smart-travel-recommendation-service
smart-travel-trip-service
smart-travel-api-gateway
smart-travel-mcp-server
smart-travel-frontend
```

Open the frontend:

```text
http://localhost:3000
```

Login with:

```text
Username: demo-user
Password: demo-pass
```

---

## Useful URLs

| Tool | URL |
|---|---|
| Frontend | `http://localhost:3000` |
| API Gateway Health | `http://localhost:8080/actuator/health` |
| Trip Service Health | `http://localhost:8081/actuator/health` |
| Recommendation Service Health | `http://localhost:8082/actuator/health` |
| MCP Server Health | `http://localhost:8087/actuator/health` |
| Consul UI | `http://localhost:8500` |
| Kafka UI | `http://localhost:8085` |
| Keycloak Admin | `http://localhost:8086/admin` |

---

## Frontend Features

The frontend provides a presentation-ready interface for testing the whole system.

Pages:

- Dashboard
- Trips
- Recommendations
- Saved & Cost
- MCP Tester
- SOA Proof

Main frontend capabilities:

- login through Keycloak;
- show system health checks;
- create and manage trips;
- search seed and live recommendations;
- save recommendations to trips;
- estimate costs;
- test Feign communication;
- test MCP helper endpoints;
- display SOA requirement coverage;
- open Consul, Kafka UI and Keycloak from the UI.

The frontend uses `EURO` for display, while the backend API uses `EUR` internally.

---

## Local Frontend Development

To run only the frontend locally:

```powershell
cd frontend
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

The Vite development server proxies backend requests to:

```text
API Gateway: http://localhost:8080
MCP Server:  http://localhost:8087
```

---

## API Testing

HTTP test files are stored in:

```text
docs/
```

Recommended test files:

```text
docker-tests.http
integration-tests.http
keycloak-test.http
```

The main full-system test is:

```text
docs/docker-tests.http
```

It tests:

- Keycloak token generation;
- health endpoints;
- secured endpoint without token;
- secured endpoint with token;
- seed recommendations;
- live Geoapify recommendations;
- external API status;
- trip creation;
- trip loading;
- trip updating;
- Feign communication;
- saving recommendations;
- estimated cost;
- MCP REST helper endpoints.

---

## Manual Full Demo Flow

Recommended order for presentation:

1. Start the full system with Docker Compose.
2. Open frontend at `http://localhost:3000`.
3. Login with Keycloak as `demo-user`.
4. Open Dashboard and refresh system health.
5. Create a trip.
6. Open Kafka UI and verify the `trip-created` topic/message.
7. Open Consul UI and verify registered services.
8. Search Paris recommendations to show Seed Data.
9. Search Rome or Berlin recommendations to show Live API fallback.
10. Save a recommendation to the created trip.
11. Load saved recommendations.
12. Estimate trip cost.
13. Run Feign test from the Recommendations page.
14. Run MCP tests from the MCP Tester page.
15. Open MCP Inspector and test real MCP tools.
16. Show SOA Proof page to explain covered requirements.

---

## Kafka Testing

Open Kafka UI:

```text
http://localhost:8085
```

Expected topic:

```text
trip-created
```

When a trip is created, Trip Service publishes a Kafka event.

Recommendation Service consumes the event and logs it.

To inspect logs:

```powershell
docker logs --tail=150 smart-travel-recommendation-service
```

Look for:

```text
Received TripCreatedEvent
```

---

## Consul Testing

Open Consul UI:

```text
http://localhost:8500
```

Expected registered services:

```text
api-gateway
trip-service
recommendation-service
mcp-server
```

---

## MCP Inspector Testing

Run MCP Inspector:

```powershell
npx @modelcontextprotocol/inspector
```

Use:

```text
Transport: Streamable HTTP
URL: http://localhost:8087/mcp
```

Expected MCP tools:

```text
recommend_places
get_trip_details
get_saved_attractions
estimate_trip_cost
```

Example usage:

```text
recommend_places
destination: Paris
type: ATTRACTION
limit: 3
```

---

## Pact Contract Testing

Pact is used for consumer-driven contract testing between Trip Service and Recommendation Service.

Trip Service acts as the consumer.

Recommendation Service acts as the provider.

Run consumer test:

```powershell
.\mvnw.cmd -f trip-service\pom.xml -Dtest=TripRecommendationConsumerPactTest test
```

Run provider test:

```powershell
.\mvnw.cmd -f recommendation-service\pom.xml -Dtest=RecommendationProviderPactVerificationTest test
```

---

## Building Individual Services

Build API Gateway:

```powershell
.\mvnw.cmd -f api-gateway\pom.xml clean package -Dmaven.test.skip=true
```

Build Trip Service:

```powershell
.\mvnw.cmd -f trip-service\pom.xml clean package -Dmaven.test.skip=true
```

Build Recommendation Service:

```powershell
.\mvnw.cmd -f recommendation-service\pom.xml clean package -Dmaven.test.skip=true
```

Build MCP Server:

```powershell
.\mvnw.cmd -f mcp-server\pom.xml clean package -Dmaven.test.skip=true
```

Build Frontend:

```powershell
cd frontend
npm install
npm run build
```

---

## Docker Commands

Start all services:

```powershell
docker compose up -d --build
```

Stop all services:

```powershell
docker compose down
```

Stop and remove volumes:

```powershell
docker compose down -v
```

Rebuild only frontend:

```powershell
docker compose build frontend --no-cache
docker compose up -d frontend
```

View logs:

```powershell
docker logs --tail=150 smart-travel-api-gateway
docker logs --tail=150 smart-travel-trip-service
docker logs --tail=150 smart-travel-recommendation-service
docker logs --tail=150 smart-travel-mcp-server
```

---

## Database Design

The system uses separate PostgreSQL databases per bounded context.

### Trip Database

Used by Trip Service.

Main table:

```text
trips
```

Stores:

- trip ID;
- user ID;
- destination;
- start date;
- end date;
- budget;
- currency;
- status;
- creation timestamp.

### Recommendation Database

Used by Recommendation Service.

Main tables:

```text
recommendations
saved_recommendations
```

Stores:

- seed recommendations;
- live Geoapify recommendations;
- external place IDs for deduplication;
- saved recommendations per trip;
- saved timestamp.

---

## External API Integration

Recommendation Service integrates with:

```text
Geoapify Places API
```

The strategy is:

```text
1. Search local Seed Data first.
2. If Seed Data exists, return Seed Data.
3. If no Seed Data exists, call Geoapify Places API.
4. Persist live results.
5. Use externalPlaceId to avoid duplicates.
```

This allows the project to demonstrate both local deterministic test data and live external API integration.

---

## Security Model

The system uses Keycloak as the identity provider.

Security flow:

```text
Frontend -> Keycloak login -> JWT access token
Frontend -> API Gateway with Bearer token
API Gateway -> validates token
Gateway -> routes request to protected backend services
Trip Service / Recommendation Service -> validate JWT
Trip Service -> forwards JWT through Feign to Recommendation Service
MCP Server -> obtains service token using client credentials
MCP Server -> calls API Gateway with Bearer token
```

Protected API routes require JWT authentication.

Health endpoints are public for Docker, Consul and frontend health checks.

---

## Important Notes

- `.env` must not be committed to GitHub.
- `.env.example` should be committed instead.
- Keycloak realm, clients and demo user must be created manually unless realm import is added.
- Backend stores currency as `EUR`.
- Frontend displays currency as `EURO`.
- Geoapify API key is optional for seed data, but required for live recommendations.
- MCP client secret is required for MCP Server calls through Keycloak.
- Docker volumes keep database and Keycloak data between restarts.

---

## Troubleshooting

### Frontend does not open

Check container:

```powershell
docker compose ps
docker logs --tail=150 smart-travel-frontend
```

Rebuild frontend:

```powershell
docker compose build frontend --no-cache
docker compose up -d frontend
```

### Keycloak token request fails

Check if Keycloak is running:

```powershell
docker logs --tail=150 smart-travel-keycloak
```

Open:

```text
http://localhost:8086/admin
```

Verify:

```text
realm: smart-travel
client: smart-travel-client
user: demo-user
```

### API returns 401

Make sure you are using a fresh access token.

In IntelliJ HTTP Client, run the Keycloak token request first.

Also verify that the request contains:

```http
Authorization: Bearer {{access_token}}
```

### MCP Server cannot get token

Check that `.env` contains:

```env
MCP_CLIENT_SECRET=...
```

Then restart:

```powershell
docker compose up -d --build mcp-server
```

### Live API does not return recommendations

Check `.env`:

```env
GEOAPIFY_API_KEY=...
```

Then rebuild:

```powershell
docker compose up -d --build recommendation-service
```

Also verify external API status from frontend Dashboard or:

```http
GET http://localhost:8080/api/recommendations/external/status
Authorization: Bearer {{access_token}}
```