# 🚀 Szybkie Uruchomienie - Task Manager

## Krok 1: Przygotowanie środowiska

Upewnij się, że masz zainstalowane:
- Node.js (wersja 16+)
- MongoDB (lokalnie lub MongoDB Atlas)
- npm lub yarn

## Krok 2: Backend Setup

```bash
cd backend
npm install
```

Utwórz plik `.env`:
```bash
cp env.example .env
```

Edytuj `.env` i ustaw:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/task-manager
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=http://localhost:3000
```

Uruchom serwer:
```bash
npm run dev
```

## Krok 3: Frontend Setup

W nowym terminalu:
```bash
cd frontend
npm install
```

Uruchom aplikację:
```bash
npm start
```

## Krok 4: Dodanie przykładowych danych (opcjonalnie)

W katalogu backend:
```bash
npm run seed
```

## Krok 5: Dostęp do aplikacji

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🎯 Funkcje do przetestowania

1. **Tworzenie zadań** - Kliknij "Nowe zadanie"
2. **Edycja zadań** - Kliknij ikonę edycji na karcie zadania
3. **Usuwanie zadań** - Kliknij ikonę kosza
4. **Filtrowanie** - Użyj filtrów w górnej części listy
5. **Wyszukiwanie** - Wpisz tekst w polu wyszukiwania
6. **Sortowanie** - Zmień kryteria sortowania

## 🔧 Rozwiązywanie problemów

### Backend nie uruchamia się
- Sprawdź czy MongoDB jest uruchomione
- Sprawdź czy port 5000 jest wolny
- Sprawdź plik `.env`

### Frontend nie łączy się z backendem
- Sprawdź czy backend działa na porcie 5000
- Sprawdź CORS_ORIGIN w pliku `.env`
- Sprawdź konsolę przeglądarki

### Błędy MongoDB
- Sprawdź czy MongoDB jest uruchomione
- Sprawdź URI połączenia w `.env`
- Sprawdź czy baza danych istnieje

## 📱 Testowanie na urządzeniach mobilnych

Aplikacja jest w pełni responsywna. Możesz przetestować na:
- Telefonie (przez IP lokalne)
- Tablecie
- Różnych rozmiarach okna przeglądarki

## 🎨 Funkcje UI

- **Responsywny design** - Działa na wszystkich urządzeniach
- **Nowoczesne animacje** - Płynne przejścia i efekty
- **Intuicyjna nawigacja** - Łatwe w użyciu
- **Loading states** - Wskaźniki ładowania
- **Error handling** - Obsługa błędów

## 🚀 Gotowe do produkcji

Aplikacja jest gotowa do wdrożenia na:
- Heroku
- Vercel
- Netlify
- AWS
- Google Cloud

Wystarczy skonfigurować zmienne środowiskowe i uruchomić build.












