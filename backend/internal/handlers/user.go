package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type UserRegistrationInput struct {
	FirstName string `json:"first_name" binding:"required"`
	LastName  string `json:"last_name" binding:"required"`
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=8"`
}

func CreateUserHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input UserRegistrationInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Хэширование пароля
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка обработки пароля"})
			return
		}

		var id int
		err = db.QueryRow(
			`INSERT INTO users (first_name, last_name, email, password_hash)
			 VALUES ($1, $2, $3, $4) RETURNING id`,
			input.FirstName, input.LastName, input.Email, string(hashedPassword),
		).Scan(&id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка регистрации пользователя"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"id":         id,
			"first_name": input.FirstName,
			"last_name":  input.LastName,
			"email":      input.Email,
		})
	}
}
