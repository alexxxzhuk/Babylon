package handlers

import (
	"database/sql"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type LogoutInput struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

func LogoutHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input LogoutInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Refresh токен обязателен"})
			return
		}

		token, err := jwt.Parse(input.RefreshToken, func(token *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный или просроченный токен"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok || claims["type"] != "refresh" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный тип токена"})
			return
		}

		jti, ok := claims["jti"].(string)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Некорректный токен"})
			return
		}

		// Удаляем токен из базы
		_, err = db.Exec(`DELETE FROM refresh_tokens WHERE id = $1`, jti)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при удалении токена"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Вы вышли из системы"})
	}
}
