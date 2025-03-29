package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type InvitationInput struct {
	Email   string `json:"email" binding:"required,email"`
	Message string `json:"message"`
}

func CreateInvitationHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input InvitationInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		inviterID := c.GetInt("userID")
		var recipientID int
		userExists := db.QueryRow(`SELECT id FROM users WHERE email = $1`, input.Email).Scan(&recipientID) == nil

		if userExists {
			// Проверяем, существует ли чат между inviter и recipient
			var existingChatID string
			err := db.QueryRow(`
				SELECT c.id FROM chats c
				JOIN chat_users cu1 ON cu1.chat_id = c.id AND cu1.user_id = $1
				JOIN chat_users cu2 ON cu2.chat_id = c.id AND cu2.user_id = $2
				LIMIT 1
			`, inviterID, recipientID).Scan(&existingChatID)

			if err == nil {
				// Чат уже есть — возвращаем его
				c.JSON(http.StatusOK, gin.H{
					"message": "Чат с этим пользователем уже существует",
					"chat_id": existingChatID,
				})
				return
			}
		}

		// Генерируем токен приглашения
		token := uuid.New().String()

		// Сохраняем или переиспользуем приглашение
		var existingToken string
		err := db.QueryRow(`SELECT token FROM invitations WHERE email = $1 AND inviter_id = $2`, input.Email, inviterID).Scan(&existingToken)
		if err == sql.ErrNoRows {
			_, err := db.Exec(`
				INSERT INTO invitations (inviter_id, email, message, token, created_at)
				VALUES ($1, $2, $3, $4, $5)
			`, inviterID, input.Email, input.Message, token, time.Now())
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка создания приглашения"})
				return
			}
			existingToken = token
		} else if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка обработки приглашения"})
			return
		}

		inviteURL := fmt.Sprintf("http://localhost:8080/accept-invite/%s", existingToken)
		c.JSON(http.StatusOK, gin.H{
			"message":    "Приглашение отправлено (нет)",
			"invite_url": inviteURL,
		})
	}
}

type AcceptInviteInput struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Password  string `json:"password"`
}

func AcceptInviteHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.Param("token")
		var input AcceptInviteInput
		_ = c.ShouldBindJSON(&input)

		var inviterID int
		var inviteEmail string
		err := db.QueryRow(`SELECT inviter_id, email FROM invitations WHERE token = $1`, token).
			Scan(&inviterID, &inviteEmail)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Недействительный или просроченный токен"})
			return
		}

		authUserID, isAuthorized := c.Get("userID")
		var userID int

		if isAuthorized {
			userID = authUserID.(int)
			var email string
			err := db.QueryRow(`SELECT email FROM users WHERE id = $1`, userID).Scan(&email)
			if err != nil || strings.ToLower(email) != strings.ToLower(inviteEmail) {
				c.JSON(http.StatusForbidden, gin.H{"error": "Этот инвайт не для текущего пользователя"})
				return
			}
		} else {
			if input.FirstName == "" || input.LastName == "" || input.Password == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Требуются имя, фамилия и пароль"})
				return
			}

			// Проверка: если пользователь уже существует — просто берём его ID
			err := db.QueryRow(`SELECT id FROM users WHERE email = $1`, inviteEmail).Scan(&userID)
			if err == sql.ErrNoRows {
				hash, _ := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
				err = db.QueryRow(`
					INSERT INTO users (first_name, last_name, email, password_hash, created_at)
					VALUES ($1, $2, $3, $4, $5) RETURNING id
				`, input.FirstName, input.LastName, inviteEmail, string(hash), time.Now()).Scan(&userID)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка регистрации пользователя"})
					return
				}
			} else if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка поиска пользователя"})
				return
			}
		}

		// Взаимные контакты
		_, _ = db.Exec(`
			INSERT INTO contacts (owner_id, contact_id)
			SELECT $1, $2 WHERE NOT EXISTS (
				SELECT 1 FROM contacts WHERE owner_id = $1 AND contact_id = $2
			)
		`, inviterID, userID)
		_, _ = db.Exec(`
			INSERT INTO contacts (owner_id, contact_id)
			SELECT $1, $2 WHERE NOT EXISTS (
				SELECT 1 FROM contacts WHERE owner_id = $1 AND contact_id = $2
			)
		`, userID, inviterID)

		// Чат между пользователями (если нет — создаём)
		var chatID string
		err = db.QueryRow(`
			SELECT c.id FROM chats c
			JOIN chat_users cu1 ON cu1.chat_id = c.id AND cu1.user_id = $1
			JOIN chat_users cu2 ON cu2.chat_id = c.id AND cu2.user_id = $2
			LIMIT 1
		`, inviterID, userID).Scan(&chatID)

		if err == sql.ErrNoRows {
			newChatID := uuid.New()
			_, _ = db.Exec(`INSERT INTO chats (id, created_at) VALUES ($1, $2)`, newChatID, time.Now())
			_, _ = db.Exec(`INSERT INTO chat_users (chat_id, user_id) VALUES ($1, $2), ($1, $3)`, newChatID, inviterID, userID)
			chatID = newChatID.String()
		} else if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка поиска чата"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Приглашение принято успешно",
			"chat_id": chatID,
		})
	}
}
