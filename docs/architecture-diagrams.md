# Architecture Diagrams (Mermaid)

This file contains Mermaid diagrams for the Open Financial Terminal architecture.

## System Architecture Overview

```mermaid
graph TB
    subgraph Browser["Browser Environment"]
        subgraph NextApp["Next.js Application"]
            UI["UI Layer<br/>Command Palette, Workspaces, Charts"]
            Components["UI Components<br/>Button, Input, Card, Spinner"]
            Registry["Adapter Registry<br/>SEC EDGAR, Yahoo Finance, Crypto"]
        end
        
        subgraph Workers["Web Workers"]
            Analytics["Analytics<br/>SMA, RSI, Options Pricing"]
        end
        
        Storage[(IndexedDB<br/>Watchlists, Settings, Cache)]
    end
    
    DataSources[External Data Sources<br/>SEC EDGAR, Yahoo, Crypto Exchanges]
    
    UI --> Components
    UI --> Registry
    UI --> Workers
    Registry -->|HTTPS| DataSources
    UI --> Storage
    Workers --> Storage
    
    style Browser fill:#1a1a1a,stroke:#666,color:#e0e0e0
    style NextApp fill:#2d2d2d,stroke:#666,color:#e0e0e0
    style Workers fill:#2d2d2d,stroke:#666,color:#e0e0e0
```

## User Interaction Sequence

```mermaid
sequenceDiagram
    actor User
    participant CP as Command Palette
    participant AR as Adapter Registry  
    participant DS as Data Source
    participant W as Web Worker
    participant Chart as Chart Component
    
    User->>CP: Enter Command (AAPL GP)
    CP->>AR: Request Quote
    AR->>DS: GET /api/quote?symbol=AAPL
    DS-->>AR: Quote Data (JSON)
    AR->>AR: Validate with Zod
    AR->>W: Calculate Indicators
    W->>W: Process (SMA, RSI)
    W-->>Chart: Results
    Chart->>User: Render Chart
```

## Data Adapter Fallback Flow

```mermaid
flowchart TD
    Start([Request Quote]) --> Registry[Adapter Registry]
    Registry --> Primary[Primary Adapter<br/>Yahoo Finance]
    Primary -->|Success| Validate[Validate with Zod]
    Primary -->|Error| Fallback1[Fallback 1<br/>SEC EDGAR]
    Fallback1 -->|Success| Validate
    Fallback1 -->|Error| Fallback2[Fallback 2<br/>Stooq]
    Fallback2 -->|Success| Validate
    Fallback2 -->|Error| Fail([Return Error])
    Validate --> Success([Return Data])
```

## Worker Pool Architecture

```mermaid
sequenceDiagram
    participant MT as Main Thread
    participant WP as WorkerPool
    participant W1 as Worker 1
    participant W2 as Worker 2
    
    MT->>WP: execute(calculateSMA)
    WP->>W1: postMessage(task, data)
    
    MT->>WP: execute(calculateRSI)
    WP->>W2: postMessage(task, data)
    
    Note over W1,W2: Parallel computation
    
    W1-->>WP: Results (SMA)
    WP-->>MT: Return SMA
    
    W2-->>WP: Results (RSI)
    WP-->>MT: Return RSI
```

## Package Dependencies

```mermaid
graph LR
    Web[apps/web] --> UI[ui]
    Web --> Adapters[adapters]
    Web --> Workers[workers]
    Web --> Shared[shared]
    
    Adapters --> Shared
    UI --> Shared
    Workers --> Shared
    AdaptersOSS[adapters-oss] --> Adapters
    OpenBB[openbb-client] --> Shared
    
    style Web fill:#0066cc,stroke:#004499,color:#fff
    style UI fill:#0066cc,stroke:#004499,color:#fff
    style Adapters fill:#0066cc,stroke:#004499,color:#fff
    style Workers fill:#0066cc,stroke:#004499,color:#fff
    style Shared fill:#00aa00,stroke:#007700,color:#fff
```

## Deployment Models

### Static Deployment (GitHub Pages)

```mermaid
flowchart TB
    Browser[Browser]
    GHP[GitHub Pages<br/>Static HTML/JS/CSS]
    APIs[Public APIs<br/>CORS-enabled]
    
    Browser -->|HTTPS| GHP
    Browser -->|HTTPS Direct| APIs
    
    style Browser fill:#0066cc,stroke:#004499,color:#fff
    style GHP fill:#0066cc,stroke:#004499,color:#fff
```

### Self-Hosted Deployment

```mermaid
flowchart TB
    Browser[Browser]
    
    subgraph Docker[Docker Compose]
        NextJS[Next.js SSR]
        Redis[(Redis Cache)]
    end
    
    APIs1[Public APIs]
    APIs2[Optional Auth Sources]
    
    Browser -->|HTTPS| NextJS
    NextJS <-->|Cache| Redis
    NextJS -->|Proxy| APIs1
    NextJS -->|Proxy + Auth| APIs2
```

## Data Flow States

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Loading: User Request
    Loading --> Validating: Data Received
    Loading --> Error: Request Failed
    Validating --> Processing: Valid Data
    Validating --> Error: Invalid Data
    Processing --> Success: Computation Complete
    Processing --> Error: Computation Failed
    Success --> Idle: Display Results
    Error --> Idle: Show Error
```
