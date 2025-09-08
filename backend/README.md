# Backend - Task Manager API

Backend aplikacji do zarządzania zadaniami zbudowany w Node.js z Express.js i MongoDB.

## 🚀 Szybki Start

### Instalacja zależności
```bash
npm install
```

### Konfiguracja środowiska
```bash
cp env.example .env
```

Edytuj plik `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/task-manager
JWT_SECRET=your-super-secret-jwt-key-change-this
CORS_ORIGIN=http://localhost:3000
```

### Uruchomienie
```bash
# Development
npm run dev

# Production
npm start
```

## 📁 Struktura Projektu

```
backend/
├── models/          # Modele MongoDB
│   ├── Task.js     # Model zadania
│   └── User.js     # Model użytkownika
├── routes/          # Endpointy API
│   ├── tasks.js    # Endpointy zadań
│   └── users.js    # Endpointy użytkowników
├── server.js        # Główny plik serwera
├── package.json     # Zależności
└── env.example      # Przykład konfiguracji
```

## 🔧 API Endpoints

### Zadania (`/api/tasks`)

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/` | Pobierz wszystkie zadania |
| GET | `/:id` | Pobierz pojedyncze zadanie |
| POST | `/` | Utwórz nowe zadanie |
| PUT | `/:id` | Aktualizuj zadanie |
| DELETE | `/:id` | Usuń zadanie |
| GET | `/stats/summary` | Statystyki zadań |

### Użytkownicy (`/api/users`)

| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/register` | Rejestracja użytkownika |
| POST | `/login` | Logowanie użytkownika |
| GET | `/profile` | Pobierz profil użytkownika |
| PUT | `/profile` | Aktualizuj profil użytkownika |
| PUT | `/change-password` | Zmień hasło |

## 📊 Modele Danych

### Task
```javascript
{
  title: String,           // Tytuł zadania (wymagany)
  description: String,     // Opis zadania (opcjonalny)
  status: String,          // Status: 'do zrobienia', 'w trakcie', 'zakończone', 'anulowane'
  priority: String,        // Priorytet: 'niski', 'średni', 'wysoki', 'krytyczny'
  dueDate: Date,          // Data termin (opcjonalna)
  completedAt: Date,      // Data zakończenia (automatyczna)
  tags: [String],         // Tagi zadania
  userId: ObjectId,       // ID użytkownika
  createdAt: Date,        // Data utworzenia
  updatedAt: Date         // Data aktualizacji
}
```

### User
```javascript
{
  email: String,          // Email użytkownika (wymagany, unikalny)
  password: String,       // Hasło (wymagane, zahashowane)
  name: String,           // Imię użytkownika (wymagane)
  avatar: String,         // Avatar (opcjonalny)
  preferences: {          // Preferencje użytkownika
    theme: String,        // 'jasny', 'ciemny', 'system'
    language: String      // 'pl', 'en'
  },
  createdAt: Date,        // Data utworzenia
  updatedAt: Date         // Data aktualizacji
}
```

## 🔒 Bezpieczeństwo

- **Hashowanie haseł**: bcryptjs z saltem
- **JWT Tokens**: Autoryzacja z tokenami
- **Walidacja**: express-validator dla wszystkich endpointów
- **CORS**: Konfiguracja dla frontendu
- **Helmet**: Bezpieczeństwo HTTP headers
- **Rate Limiting**: Ochrona przed spamem

## 🛠️ Skrypty

```bash
npm run dev      # Uruchom w trybie development z nodemon
npm start        # Uruchom w trybie production
npm test         # Uruchom testy
```

## 📝 Walidacja

Wszystkie endpointy używają express-validator do walidacji danych:

- **Tytuł zadania**: 1-100 znaków
- **Opis zadania**: max 500 znaków
- **Email**: Poprawny format email
- **Hasło**: min 6 znaków
- **Imię**: 2-50 znaków

## 🚀 Deployment

### Heroku
```bash
heroku create your-app-name
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret
git push heroku main
```

### Vercel
```bash
vercel --prod
```

## 🔍 Debugowanie

Włącz debugowanie ustawiając `NODE_ENV=development` w pliku `.env`.

Logi będą wyświetlane w konsoli z dodatkowymi informacjami o zapytaniach i błędach.

## 📞 Wsparcie

W przypadku problemów sprawdź:
1. Czy MongoDB jest uruchomione
2. Czy zmienne środowiskowe są poprawnie ustawione
3. Czy wszystkie zależności są zainstalowane
4. Logi w konsoli serwera













