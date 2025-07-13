# Analytics Architecture Diagram

```mermaid
graph TB
    %% External traffic
    Client[Client/Browser] --> API[API Gateway]

    %% Write flow - for saving data
    API -->|Write/Save Data| PV0[page_views_0<br/>RabbitMQ]
    API -->|Write/Save Data| PV1[page_views_1<br/>RabbitMQ]
    API -->|Write/Save Data| PV2[page_views_2<br/>RabbitMQ]
    API -->|Write/Save Data| PVN[page_views_n-1<br/>RabbitMQ]

    %% Read flow - for querying data
    API -->|Read/Query Data| Analytics[Analytics Service]

    %% Aggregator services
    PV0 --> Agg0[Aggregator_0<br/>Service]
    PV1 --> Agg1[Aggregator_1<br/>Service]
    PV2 --> Agg2[Aggregator_2<br/>Service]
    PVN --> AggN[Aggregator_n-1<br/>Service]

    %% Final destination
    Agg0 --> IncSvc[Increments Service]
    Agg1 --> IncSvc
    Agg2 --> IncSvc
    AggN --> IncSvc

    %% Styling
    classDef queue fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef service fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef gateway fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef client fill:#fff3e0,stroke:#e65100,stroke-width:2px

    class PVQ,PV0,PV1,PV2,PVN queue
    class Agg0,Agg1,Agg2,AggN,Analytics,IncSvc service
    class API gateway
    class Client client
```

## Architecture Flow

### Write Flow (Data Ingestion)

1. **API Gateway**: Receives page view requests from clients and distributes them across N partitioned queues (`page_views_0` to `page_views_n-1`)
2. **Aggregator Services**: Each aggregator service (0 to n-1) reads from its respective partitioned queue and:
   - Processes up to 1000 messages OR waits 1 minute (whichever comes first)
   - Aggregates messages by pages
   - Writes aggregated data to the increments service

### Read Flow (Data Querying)

1. **API Gateway**: Receives query requests from clients and forwards them to the Analytics Service
2. **Analytics Service**: Processes queries and returns analytics data to clients

## Components

- **API Gateway**: Entry point for page view data
- **RabbitMQ Queues**:
  - `page_views`: Main queue for incoming data
  - `page_views_0` to `page_views_n-1`: Partitioned queues for parallel processing
- **Partitioner Service**: Distributes load across partitions
- **Aggregator Services**: Process and aggregate data in parallel
- **Increments Service**: Final destination for aggregated analytics data
