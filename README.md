# Task Manager - Aplikacja do Zarządzania Zadaniami

Nowoczesna aplikacja do zarządzania zadaniami zbudowana w technologii MERN (MongoDB, Express.js, React, Node.js).

## 🚀 Funkcje

- ✅ Tworzenie, edycja i usuwanie zadań
- ✅ Filtrowanie i sortowanie zadań
- ✅ Wyszukiwanie zadań
- ✅ Statystyki i dashboard
- ✅ Responsywny design
- ✅ Nowoczesny UI z Tailwind CSS
- ✅ TypeScript dla lepszej jakości kodu

## 🛠️ Technologie

### Backend
- **Node.js** z Express.js
- **MongoDB** z Mongoose
- **JWT** do autoryzacji
- **bcryptjs** do hashowania haseł
- **express-validator** do walidacji

### Frontend
- **React 18** z TypeScript
- **React Query** do zarządzania stanem
- **React Router** do nawigacji
- **Tailwind CSS** do stylowania
- **Lucide React** do ikon
- **date-fns** do obsługi dat

## 📦 Instalacja i Uruchomienie

### Wymagania
- Node.js (wersja 16 lub nowsza)
- MongoDB (lokalnie lub MongoDB Atlas)
- npm lub yarn

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

## 📁 Struktura Projektu

```
task-manager-app/
├── backend/
│   ├── models/          # Modele MongoDB
│   ├── routes/          # Endpointy API
│   ├── server.js        # Główny plik serwera
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # Komponenty React
│   │   ├── services/    # Serwisy API
│   │   ├── types/       # Typy TypeScript
│   │   └── App.tsx      # Główny komponent
│   └── package.json
└── README.md
```

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

## 🎨 Funkcje UI

- **Dashboard** z statystykami
- **Lista zadań** z filtrowaniem i sortowaniem
- **Modal formularza** do tworzenia/edycji zadań
- **Responsywny design** dla wszystkich urządzeń
- **Nowoczesne animacje** i przejścia
- **Intuicyjna nawigacja**

## 🔒 Bezpieczeństwo

- Hashowanie haseł z bcryptjs
- JWT tokens do autoryzacji
- Walidacja danych wejściowych
- CORS configuration
- Helmet.js dla bezpieczeństwa HTTP

## 🚀 Deployment

### Backend (Heroku/Netlify)
```bash
cd backend
npm run build
```

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
```

## 📝 Licencja

MIT License

## 🤝 Wkład

Pull requests są mile widziane. Dla większych zmian, otwórz issue najpierw, aby omówić co chciałbyś zmienić.

## 📞 Wsparcie

Jeśli masz pytania lub problemy, otwórz issue w repozytorium.











