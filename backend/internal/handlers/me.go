package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetMeHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDInterface, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не авторизован"})
			return
		}

		userID := userIDInterface.(int)

		var firstName, lastName, email string
		err := db.QueryRow(`SELECT first_name, last_name, email FROM users WHERE id = $1`, userID).
			Scan(&firstName, &lastName, &email)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения данных пользователя"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"user": gin.H{
				"id":         userID,
				"first_name": firstName,
				"last_name":  lastName,
				"email":      email,
			},
		})
	}
}
