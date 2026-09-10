# Stage 1: Build the app using Maven
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the app on a JRE-only image
FROM eclipse-temurin:17-jre
LABEL authors="Josephat Juma"
ENV APP_HOME=/app
WORKDIR $APP_HOME

# Copy built jar from the builder stage
COPY --from=builder /app/target/wasteless-0.0.1-SNAPSHOT.jar app.jar

# Expose the default Spring Boot port
EXPOSE 8080

# Run the Spring Boot app
ENTRYPOINT ["java", "-jar", "app.jar"]
