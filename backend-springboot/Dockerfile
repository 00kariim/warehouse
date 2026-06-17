# ── Build stage ───────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /build
COPY pom.xml .
# Download dependencies first (layer cache)
RUN mvn -q dependency:go-offline -B

COPY src/ src/
RUN mvn -q package -DskipTests -B

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app
COPY --from=builder /build/target/*.jar app.jar

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=10s --start-period=60s --retries=5 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
