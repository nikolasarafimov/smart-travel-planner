export default function Dashboard() {
    return (
        <div className="page">
            <section className="hero">
                <div>
                    <p className="eyebrow">SOA Microservices Project</p>
                    <h1>Plan trips, discover places, save recommendations.</h1>
                    <p className="hero-text">
                        Smart Travel Planner connects Trip Service, Recommendation Service,
                        API Gateway, Keycloak, Consul, Kafka and MCP Server in one Dockerized system.
                    </p>
                </div>
            </section>

            <div className="cards-grid">
                <div className="info-card">
                    <h3>Trip Planning</h3>
                    <p>Create and manage trips with destination, dates, budget and status.</p>
                </div>

                <div className="info-card">
                    <h3>Recommendations</h3>
                    <p>Search attractions, restaurants and hotels by destination.</p>
                </div>

                <div className="info-card">
                    <h3>Saved Places</h3>
                    <p>Save recommendations to a trip and estimate total travel cost.</p>
                </div>

                <div className="info-card">
                    <h3>SOA Concepts</h3>
                    <p>Gateway, service discovery, Keycloak security, Kafka events and MCP tools.</p>
                </div>
            </div>
        </div>
    )
}