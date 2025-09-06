# Dockerfile dla Spring Boot Backend
FROM openjdk:17-jdk-slim

# Ustaw katalog roboczy
WORKDIR /app

# Skopiuj pliki Maven z katalogu backend
COPY backend/pom.xml .
COPY backend/src ./src

# Zainstaluj Maven
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*

# Zbuduj aplikację
RUN mvn clean package -DskipTests

# Eksponuj port
EXPOSE 8080

# Uruchom aplikację
CMD ["java", "-jar", "target/task-manager-1.0.0.jar"]
