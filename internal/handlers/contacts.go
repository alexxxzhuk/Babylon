package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetContactsHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetInt("userID")

		rows, err := db.Query(`
			SELECT u.id, u.first_name, u.last_name, u.email
			FROM contacts c
			JOIN users u ON u.id = c.contact_id
			WHERE c.owner_id = $1
			ORDER BY u.first_name
		`, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении контактов"})
			return
		}
		defer rows.Close()

		var contacts []gin.H
		for rows.Next() {
			var id int
			var firstName, lastName, email string
			if err := rows.Scan(&id, &firstName, &lastName, &email); err != nil {
				continue
			}
			contacts = append(contacts, gin.H{
				"id":         id,
				"first_name": firstName,
				"last_name":  lastName,
				"email":      email,
			})
		}

		c.JSON(http.StatusOK, gin.H{"contacts": contacts})
	}
}
