# AI Warehouse Inventory System

A modern, microservice-based Warehouse Inventory Management System featuring Machine Learning anomaly detection and an AI-powered natural language query interface (NL2SQL).

## 🚀 Features

*   **Intelligent Anomaly Detection**: Uses a trained `scikit-learn` Isolation Forest Machine Learning model to evaluate stock movements and flag suspicious activities automatically.
*   **AI Chat (NL2SQL)**: Chat with your database! Ask questions in plain English (e.g., "Do we have toilet paper in the main warehouse?") and the AI microservice generates and executes the correct PostgreSQL queries.
*   **Inventory Management**: Track and manage products, warehouses, and complex stock movements across multiple facilities.
*   **Secure Authentication**: Role-based access control secured by JWT (JSON Web Tokens).
*   **Modern UI/UX**: Built with React and Material UI, featuring a responsive design and an integrated Light/Dark mode toggle.

## 🏗️ Architecture

The system is composed of three primary microservices orchestrated via Docker Compose:

### 1. Frontend (`frontend-react`)
*   **Stack**: React, Vite, TypeScript, Material UI (MUI).
*   **Role**: Provides the unified user interface. Manages global state (like user preferences and authentication) and communicates securely with the Spring Boot backend.

### 2. Backend (`backend-springboot`)
*   **Stack**: Java 21, Spring Boot 3, Spring Security, Spring Data JPA, Hibernate, PostgreSQL.
*   **Role**: Serves as the core API gateway and business logic engine. Manages database transactions, JWT authentication, pagination, and relays specialized AI requests to the Python microservice.
*   **Database Migrations**: Managed automatically by Flyway.

### 3. AI Service (`ai-core`)
*   **Stack**: Python 3.12, FastAPI, LangChain, scikit-learn, Pydantic.
*   **Role**: Handles all AI and Machine Learning computations:
    *   Loads and serves the `anomaly_model.pkl` (Isolation Forest) for stock movement anomaly detection.
    *   Uses LangChain and OpenRouter to translate Natural Language queries into executable SQL against the PostgreSQL database.

## ⚙️ Getting Started

### Prerequisites
*   [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)

### Installation & Deployment

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/warehouse-ai-inventory.git
    cd warehouse-ai-inventory
    ```

2.  **Configure Environment Variables**:
    Update the `.env` file in the root directory. Ensure you provide your OpenRouter API key and desired database credentials:
    ```env
    OPENROUTER_API_KEY=your_api_key_here
    ```

3.  **Deploy the Stack**:
    Use Docker Compose to build and start the microservices:
    ```bash
    docker compose up --build -d
    ```

4.  **Access the Application**:
    *   **Frontend**: [http://localhost:3000](http://localhost:3000)
    *   **Backend API (Swagger/Actuator)**: [http://localhost:8080](http://localhost:8080)
    *   **AI Service**: [http://localhost:8000](http://localhost:8000)

## 🗄️ Database Schema

The core PostgreSQL database schema consists of the following managed entities:
*   `users`: System administrators and operators.
*   `warehouses`: Physical storage locations.
*   `products`: Inventory items.
*   `stock_movements`: Immutable ledger of inventory transactions (in/out), evaluated for anomalies.
*   `anomaly_events`: Specialized records tied to stock movements flagged by the ML model.

## 🛡️ Security
*   **Data Serialization**: Hibernate proxies are safely handled to prevent data leakages during serialization.
*   **Parameterized Queries**: Spring Data JPA and strict parameter type casting are enforced to prevent SQL injection and PostgreSQL type inference errors.
*   **Timeouts**: The AI connection supports up to 30-second streams to safely handle large LLM inferences without hanging the backend processes.

## 📄 License
This project is licensed under the MIT License.
