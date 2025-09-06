# Task Manager - Aplikacja do Zarządzania Zadaniami



### 1. Klonowanie repozytorium
```bash
git clone <repository-url>
cd task-manager-app
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Utwórz plik `.env` na podstawie `env.example`:
```bash
cp env.example .env
```

Edytuj plik `.env` i ustaw swoje zmienne środowiskowe:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/task-manager
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:3000
```

Uruchom serwer:
```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Uruchom aplikację React:
```bash
npm start
```

### 4. Dostęp do aplikacji

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000


## 🔧 API Endpoints

### Zadania
- `GET /api/tasks` - Pobierz wszystkie zadania
- `GET /api/tasks/:id` - Pobierz pojedyncze zadanie
- `POST /api/tasks` - Utwórz nowe zadanie
- `PUT /api/tasks/:id` - Aktualizuj zadanie
- `DELETE /api/tasks/:id` - Usuń zadanie
- `GET /api/tasks/stats/summary` - Statystyki zadań

### Użytkownicy
- `POST /api/users/register` - Rejestracja
- `POST /api/users/login` - Logowanie
- `GET /api/users/profile` - Profil użytkownika
- `PUT /api/users/profile` - Aktualizuj profil













