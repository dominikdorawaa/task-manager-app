# Task Manager - Aplikacja do Zarządzania Zadaniami

Nowoczesna aplikacja do zarządzania zadaniami zbudowana z React frontend i Spring Boot backend.

## 🚀 Funkcje

- ✅ Tworzenie, edycja i usuwanie zadań
- ✅ Filtrowanie i sortowanie zadań według kategorii
- ✅ Wyszukiwanie zadań
- ✅ Przypisywanie zadań do użytkowników
- ✅ Upload i wyświetlanie obrazów
- ✅ Dark mode / Light mode
- ✅ Responsywny design
- ✅ Nowoczesny UI z Tailwind CSS
- ✅ TypeScript dla lepszej jakości kodu
- ✅ Autentykacja przez Clerk

## 🛠️ Technologie

### Backend
- **Spring Boot** z Java 17
- **PostgreSQL** jako baza danych
- **JPA/Hibernate** do ORM
- **Clerk** do autentykacji
- **Maven** do zarządzania zależnościami

### Frontend
- **React 18** z TypeScript
- **React Query** do zarządzania stanem
- **React Router** do nawigacji
- **Tailwind CSS** do stylowania
- **Lucide React** do ikon
- **date-fns** do obsługi dat
- **Clerk React** do autentykacji

## 📦 Instalacja i Uruchomienie

### Opcja 1: Docker (Zalecane)

```bash
git clone https://github.com/dominikdorawaa/task-manager-app.git
cd task-manager-app
docker-compose up --build
```

**Dostęp do aplikacji:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

### Opcja 2: Lokalne uruchomienie

#### Wymagania
- Java 17+
- Node.js (wersja 16 lub nowsza)
- PostgreSQL
- Maven
- npm

#### 1. Klonowanie repozytorium
```bash
git clone https://github.com/dominikdorawaa/task-manager-app.git
cd task-manager-app
```

#### 2. Backend Setup

```bash
cd backend
mvn clean install
```

Skonfiguruj bazę danych PostgreSQL i uruchom:
```bash
mvn spring-boot:run
```

#### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

#### 4. Dostęp do aplikacji

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080



## 🔧 API Endpoints

### Zadania
- `GET /api/tasks` - Pobierz wszystkie zadania użytkownika
- `GET /api/tasks/:id` - Pobierz pojedyncze zadanie
- `POST /api/tasks` - Utwórz nowe zadanie
- `PUT /api/tasks/:id` - Aktualizuj zadanie
- `DELETE /api/tasks/:id` - Usuń zadanie
- `GET /api/tasks/stats/summary` - Statystyki zadań

### Pliki
- `POST /api/files/upload` - Upload obrazów
- `DELETE /api/files/images/:filename` - Usuń obraz

### Autentykacja
Aplikacja używa Clerk do autentykacji - wszystkie endpointy wymagają ważnego JWT tokena.

## 🎨 Funkcje UI

- **Dashboard** z kategoriami zadań
- **Lista zadań** z filtrowaniem i sortowaniem
- **Modal formularza** do tworzenia/edycji zadań
- **Dark mode / Light mode** przełącznik
- **Upload obrazów** do zadań
- **Responsywny design** dla wszystkich urządzeń
- **Nowoczesne animacje** i przejścia
- **Intuicyjna nawigacja**

## 🔒 Bezpieczeństwo

- **Clerk** do autentykacji i autoryzacji
- JWT tokens do komunikacji z API
- Walidacja danych wejściowych
- CORS configuration
- Spring Security dla bezpieczeństwa backendu


## 📝 Licencja

MIT License











