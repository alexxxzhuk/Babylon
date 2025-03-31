package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetContactByIDHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetInt("userID")
		contactIDStr := c.Param("id")

		contactID, err := strconv.Atoi(contactIDStr)
		if err != nil || contactID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректный ID контакта"})
			return
		}

		var firstName, lastName, email string
		err = db.QueryRow(`
			SELECT u.first_name, u.last_name, u.email
			FROM contacts c
			JOIN users u ON u.id = c.contact_id
			WHERE c.owner_id = $1 AND c.contact_id = $2
		`, userID, contactID).Scan(&firstName, &lastName, &email)

		switch {
		case err == sql.ErrNoRows:
			c.JSON(http.StatusNotFound, gin.H{"error": "Контакт не найден"})
			return
		case err != nil:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении контакта"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"contact": gin.H{
				"id":         contactID,
				"first_name": firstName,
				"last_name":  lastName,
				"email":      email,
			},
		})
	}
}
