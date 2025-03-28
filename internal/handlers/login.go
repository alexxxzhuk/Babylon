package handlers

import (
	"database/sql"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func LoginHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input LoginInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var userID int
		var hashedPassword string

		err := db.QueryRow(`SELECT id, password_hash FROM users WHERE email = $1`, input.Email).
			Scan(&userID, &hashedPassword)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверные email или пароль"})
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(input.Password)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверные email или пароль"})
			return
		}

		// Генерация access_token
		accessToken, err := generateJWT(userID, "access", 15*time.Minute)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка генерации access токена"})
			return
		}

		// Генерация refresh_token
		refreshJTI := uuid.New()
		refreshToken, err := generateJWT(userID, "refresh", 7*24*time.Hour, refreshJTI.String())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка генерации refresh токена"})
			return
		}

		// Сохраняем refresh токен в базу
		_, err = db.Exec(`
			INSERT INTO refresh_tokens (id, user_id, expires_at, user_agent, ip)
			VALUES ($1, $2, $3, $4, $5)
		`, refreshJTI, userID, time.Now().Add(7*24*time.Hour), c.Request.UserAgent(), c.ClientIP())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сохранения refresh токена"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"access_token":  accessToken,
			"refresh_token": refreshToken,
		})
	}
}

func generateJWT(userID int, tokenType string, duration time.Duration, jti ...string) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "default_secret"
	}

	claims := jwt.MapClaims{
		"sub":  userID,
		"exp":  time.Now().Add(duration).Unix(),
		"type": tokenType,
	}

	// Добавляем jti только для refresh токена
	if tokenType == "refresh" && len(jti) > 0 {
		claims["jti"] = jti[0]
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}
