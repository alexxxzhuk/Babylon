FROM golang:1.24.1

WORKDIR /app

# Копируем файлы модулей и загружаем зависимости
COPY go.mod go.sum ./
RUN go mod download

# Копируем исходный код
COPY . .

# Собираем бинарный файл
RUN go build -o main ./cmd

# Экспонируем порт, на котором работает приложение
EXPOSE 8080

CMD ["./main"]