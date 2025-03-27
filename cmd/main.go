package main

import (
	"log"
	"os"

	"github.com/alexxxzhuk/babylon/internal/database"
	"github.com/alexxxzhuk/babylon/internal/handlers"
	"github.com/gin-gonic/gin"
)

func main() {
	// Подключаемся к PostgreSQL
	db := database.Connect()
	defer db.Close()

	// Инициализируем Gin
	router := gin.Default()

	// Группа API-эндпоинтов
	api := router.Group("/api/v1")
	{
		api.POST("/users", handlers.CreateUserHandler(db))
	}

	// Читаем порт из переменных окружения (по умолчанию 8080)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Не удалось запустить сервер: %v", err)
	}
}
