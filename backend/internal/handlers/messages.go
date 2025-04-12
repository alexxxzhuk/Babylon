package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/alexxxzhuk/babylon/internal/websocket"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	gws "github.com/gorilla/websocket" // 👈 псевдоним, чтобы не конфликтовало по названию
)

type CreateMessageInput struct {
	OriginalContent string `json:"original_content" binding:"required"`
}

type Message struct {
	ID              int       `json:"id"`
	ChatID          string    `json:"chat_id"`
	SenderID        int       `json:"sender_id"`
	OriginalContent string    `json:"original_content"`
	CreatedAt       time.Time `json:"created_at"`
}

// POST /chats/:chat_id/messages
func CreateMessageHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetInt("userID")
		chatIDStr := c.Param("chat_id")

		// Валидируем UUID
		chatID, err := uuid.Parse(chatIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректный chat_id"})
			return
		}

		// Проверка участия
		var exists bool
		err = db.QueryRow(`
			SELECT EXISTS (
				SELECT 1 FROM chat_users
				WHERE chat_id = $1 AND user_id = $2
			)
		`, chatID, userID).Scan(&exists)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при проверке участника чата"})
			return
		}
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Вы не участник этого чата"})
			return
		}

		// Тело запроса
		var input CreateMessageInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Поле original_content обязательно"})
			return
		}

		var messageID int
		var createdAt time.Time
		err = db.QueryRow(`
			INSERT INTO messages (chat_id, sender_id, original_content)
			VALUES ($1, $2, $3)
			RETURNING id, created_at
		`, chatID, userID, input.OriginalContent).Scan(&messageID, &createdAt)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании сообщения"})
			return
		}

		// 👇 Отправка по WebSocket второму участнику
		var receiverID int
		err = db.QueryRow(`
			SELECT user_id FROM chat_users
			WHERE chat_id = $1 AND user_id != $2
			LIMIT 1
		`, chatID, userID).Scan(&receiverID)

		if err == nil {
			type WSMessage struct {
				Type    string `json:"type"`
				Content string `json:"content"`
				ChatID  string `json:"chat_id"`
				Sender  int    `json:"sender"`
			}

			msg := WSMessage{
				Type:    "chat_message",
				Content: input.OriginalContent,
				ChatID:  chatID.String(),
				Sender:  userID,
			}

			if conn, ok := websocket.Manager.Get(receiverID); ok {
				if msgBytes, err := json.Marshal(msg); err == nil {
					conn.WriteMessage(gws.TextMessage, msgBytes)
				}
			}
		}

		c.JSON(http.StatusCreated, gin.H{
			"message": gin.H{
				"id":               messageID,
				"chat_id":          chatID,
				"sender_id":        userID,
				"original_content": input.OriginalContent,
				"created_at":       createdAt,
			},
		})
	}
}

// GET /chats/:chat_id/messages
// func GetMessagesHandler(db *sql.DB) gin.HandlerFunc {
// 	return func(c *gin.Context) {
// 		userID := c.GetInt("userID")
// 		chatIDStr := c.Param("chat_id")

// 		// Валидируем UUID
// 		chatID, err := uuid.Parse(chatIDStr)
// 		if err != nil {
// 			c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректный chat_id"})
// 			return
// 		}

// 		// Проверка участия
// 		var isParticipant bool
// 		err = db.QueryRow(`
// 			SELECT EXISTS (
// 				SELECT 1 FROM chat_users
// 				WHERE chat_id = $1 AND user_id = $2
// 			)
// 		`, chatID.String(), userID).Scan(&isParticipant)

// 		if err != nil {
// 			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при проверке доступа к чату"})
// 			return
// 		}
// 		if !isParticipant {
// 			c.JSON(http.StatusForbidden, gin.H{"error": "Доступ к чату запрещён"})
// 			return
// 		}

// 		// Получение сообщений
// 		rows, err := db.Query(`
// 			SELECT id, chat_id, sender_id, original_content, created_at
// 			FROM messages
// 			WHERE chat_id = $1
// 			ORDER BY created_at DESC
// 			LIMIT 50
// 		`, chatID.String())
// 		if err != nil {
// 			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении сообщений"})
// 			return
// 		}
// 		defer rows.Close()

// 		var messages []Message
// 		for rows.Next() {
// 			var m Message
// 			if err := rows.Scan(&m.ID, &m.ChatID, &m.SenderID, &m.OriginalContent, &m.CreatedAt); err != nil {
// 				log.Printf("scan error: %v", err)
// 				continue
// 			}
// 			messages = append(messages, m)
// 		}

// 		c.JSON(http.StatusOK, gin.H{"messages": messages})
// 	}
// }

func GetMessagesHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetInt("userID")
		chatIDStr := c.Param("chat_id")
		before := c.Query("before") // 👈 новый параметр

		chatID, err := uuid.Parse(chatIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректный chat_id"})
			return
		}

		var isParticipant bool
		err = db.QueryRow(`
			SELECT EXISTS (
				SELECT 1 FROM chat_users
				WHERE chat_id = $1 AND user_id = $2
			)
		`, chatID.String(), userID).Scan(&isParticipant)
		if err != nil || !isParticipant {
			c.JSON(http.StatusForbidden, gin.H{"error": "Доступ к чату запрещён"})
			return
		}

		query := `
			SELECT id, chat_id, sender_id, original_content, created_at
			FROM messages
			WHERE chat_id = $1
		`
		args := []interface{}{chatID.String()}

		if before != "" {
			query += " AND created_at < $2"
			t, err := time.Parse(time.RFC3339, before)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректный формат параметра before"})
				return
			}
			args = append(args, t)
		}

		query += " ORDER BY created_at DESC LIMIT 50"

		rows, err := db.Query(query, args...)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении сообщений"})
			return
		}
		defer rows.Close()

		var messages []Message
		for rows.Next() {
			var m Message
			if err := rows.Scan(&m.ID, &m.ChatID, &m.SenderID, &m.OriginalContent, &m.CreatedAt); err != nil {
				log.Printf("scan error: %v", err)
				continue
			}
			messages = append(messages, m)
		}

		c.JSON(http.StatusOK, gin.H{"messages": messages})
	}
}
