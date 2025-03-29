package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetChatsHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetInt("userID")

		rows, err := db.Query(`
			SELECT c.id, u.id, u.first_name, u.last_name
			FROM chats c
			JOIN chat_users cu ON cu.chat_id = c.id
			JOIN chat_users cu2 ON cu2.chat_id = c.id AND cu2.user_id = $1
			JOIN users u ON u.id = cu.user_id
			ORDER BY c.created_at DESC
		`, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении чатов"})
			return
		}
		defer rows.Close()

		type Participant struct {
			ID        int    `json:"id"`
			FirstName string `json:"first_name"`
			LastName  string `json:"last_name"`
		}
		chatsMap := make(map[string][]Participant)

		for rows.Next() {
			var chatID string
			var participant Participant
			if err := rows.Scan(&chatID, &participant.ID, &participant.FirstName, &participant.LastName); err != nil {
				continue
			}
			// Исключаем самого себя из участников
			if participant.ID != userID {
				chatsMap[chatID] = append(chatsMap[chatID], participant)
			}
		}

		var result []gin.H
		for chatID, participants := range chatsMap {
			result = append(result, gin.H{
				"chat_id":      chatID,
				"participants": participants,
			})
		}

		c.JSON(http.StatusOK, gin.H{"chats": result})
	}
}
