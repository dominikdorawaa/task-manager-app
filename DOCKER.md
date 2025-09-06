# Docker Setup dla Task Manager App

## Wymagania
- Docker
- Docker Compose

## Uruchomienie aplikacji

### 1. Sklonuj repozytorium
```bash
git clone https://github.com/dominikdorawaa/task-manager-app.git
cd task-manager-app
```

### 2. Uruchom aplikację za pomocą Docker Compose
```bash
docker-compose up --build
```

### 3. Dostęp do aplikacji
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Baza danych**: localhost:5432

## Dostępne komendy

### Uruchomienie w tle
```bash
docker-compose up -d --build
```

### Zatrzymanie aplikacji
```bash
docker-compose down
```

### Zatrzymanie z usunięciem wolumenów (usuwa dane z bazy)
```bash
docker-compose down -v
```

### Przebudowanie tylko jednego serwisu
```bash
docker-compose up --build backend
docker-compose up --build frontend
```

### Wyświetlenie logów
```bash
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Struktura serwisów

- **database**: PostgreSQL 15
- **backend**: Spring Boot API (port 8080)
- **frontend**: React app z nginx (port 3000)

## Zmienne środowiskowe

### Backend
- `SPRING_DATASOURCE_URL`: URL bazy danych
- `SPRING_DATASOURCE_USERNAME`: Nazwa użytkownika bazy
- `SPRING_DATASOURCE_PASSWORD`: Hasło bazy
- `CLERK_PUBLISHABLE_KEY`: Klucz Clerk do autentykacji

### Database
- `POSTGRES_DB`: Nazwa bazy danych
- `POSTGRES_USER`: Użytkownik bazy
- `POSTGRES_PASSWORD`: Hasło bazy

## Rozwiązywanie problemów

### Sprawdzenie statusu kontenerów
```bash
docker-compose ps
```

### Restart serwisu
```bash
docker-compose restart backend
```

### Wejście do kontenera
```bash
docker-compose exec backend bash
docker-compose exec frontend sh
```

### Sprawdzenie logów bazy danych
```bash
docker-compose logs database
```
