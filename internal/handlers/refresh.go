package handlers

import (
	"database/sql"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type RefreshInput struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

func RefreshTokenHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input RefreshInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Refresh токен обязателен"})
			return
		}

		// Проверка и разбор токена
		token, err := jwt.Parse(input.RefreshToken, func(token *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный refresh токен"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok || claims["type"] != "refresh" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный тип токена"})
			return
		}

		userID, ok := claims["sub"].(float64)
		jti, jtiOk := claims["jti"].(string)
		if !ok || !jtiOk {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Некорректные данные токена"})
			return
		}

		// Проверка, что токен существует в базе и не истёк
		var expiresAt time.Time
		err = db.QueryRow(`
			SELECT expires_at FROM refresh_tokens WHERE id = $1 AND user_id = $2
		`, jti, int(userID)).Scan(&expiresAt)
		if err == sql.ErrNoRows || time.Now().After(expiresAt) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh токен не найден или истёк"})
			return
		} else if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка проверки токена"})
			return
		}

		// Удаляем старый токен (одноразовый refresh)
		_, err = db.Exec(`DELETE FROM refresh_tokens WHERE id = $1`, jti)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка удаления старого токена"})
			return
		}

		// Создаём новые токены
		newAccessToken, err := generateJWT(int(userID), "access", 15*time.Minute)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка генерации access токена"})
			return
		}

		newJTI := uuid.New()
		newRefreshToken, err := generateJWT(int(userID), "refresh", 7*24*time.Hour, newJTI.String())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка генерации refresh токена"})
			return
		}

		// Сохраняем новый refresh токен
		_, err = db.Exec(`
			INSERT INTO refresh_tokens (id, user_id, expires_at, user_agent, ip)
			VALUES ($1, $2, $3, $4, $5)
		`, newJTI, int(userID), time.Now().Add(7*24*time.Hour), c.Request.UserAgent(), c.ClientIP())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сохранения нового токена"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"access_token":  newAccessToken,
			"refresh_token": newRefreshToken,
		})
	}
}
