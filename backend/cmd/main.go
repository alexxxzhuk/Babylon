package main

import (
	"log"
	"os"

	"github.com/alexxxzhuk/babylon/internal/database"
	"github.com/alexxxzhuk/babylon/internal/handlers"
	"github.com/alexxxzhuk/babylon/middleware"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Загружаем переменные окружения из .env
	if err := godotenv.Load(); err != nil {
		log.Println(".env файл не найден, используются переменные окружения из системы")
	}

	// Подключаемся к PostgreSQL
	db := database.Connect()
	defer db.Close()

	// Инициализируем Gin
	router := gin.Default()

	// Группа API-эндпоинтов
	api := router.Group("/api/v1")
	{
		api.POST("/users", handlers.CreateUserHandler(db))
		api.POST("/auth/login", handlers.LoginHandler(db))
		api.POST("/auth/refresh", handlers.RefreshTokenHandler(db))
		api.POST("/auth/logout", handlers.LogoutHandler(db))

		// Подтверждение приглашения — доступно без авторизации
		api.POST("/accept-invite/:token", handlers.AcceptInviteHandler(db))

		auth := api.Group("/")
		auth.Use(middleware.AuthMiddleware())
		{
			auth.GET("/me", handlers.GetMeHandler(db))
			auth.POST("/invitations", handlers.CreateInvitationHandler(db))
			auth.GET("/contacts", handlers.GetContactsHandler(db))
			auth.GET("/contacts/:id", handlers.GetContactByIDHandler(db))
			auth.GET("/chats", handlers.GetChatsHandler(db))
			auth.POST("/chats/:chat_id/messages", handlers.CreateMessageHandler(db))
			auth.GET("/chats/:chat_id/messages", handlers.GetMessagesHandler(db))
		}
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
