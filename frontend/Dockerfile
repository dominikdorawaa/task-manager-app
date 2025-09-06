# Dockerfile dla React Frontend
FROM node:18-alpine

# Ustaw katalog roboczy
WORKDIR /app

# Skopiuj pliki package.json i package-lock.json
COPY frontend/package*.json ./

# Zainstaluj zależności
RUN npm ci --only=production

# Skopiuj resztę plików
COPY frontend/ .

# Zbuduj aplikację
RUN npm run build

# Użyj nginx do serwowania statycznych plików
FROM nginx:alpine

# Skopiuj zbudowaną aplikację
COPY --from=0 /app/build /usr/share/nginx/html

# Skopiuj konfigurację nginx
COPY frontend/nginx.conf /etc/nginx/nginx.conf

# Eksponuj port
EXPOSE 80

# Uruchom nginx
CMD ["nginx", "-g", "daemon off;"]
