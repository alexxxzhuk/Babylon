package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"

	"github.com/alexxxzhuk/babylon/middleware" // или путь к VerifyAccessToken
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type IncomingMessage struct {
	Type    string `json:"type"`
	Content string `json:"content"`
}

type OutgoingMessage struct {
	Type string `json:"type"`
	Body string `json:"body"`
}

func WebSocketHandler(c *gin.Context) {
	// ✅ 1. Получаем токен
	token := c.Query("token")
	if token == "" {
		log.Println("❌ Нет токена")
		c.Writer.WriteHeader(http.StatusUnauthorized)
		return
	}

	// ✅ 2. Проверяем токен
	userID, err := middleware.VerifyAccessToken(token)
	if err != nil {
		log.Println("❌ Невалидный токен:", err)
		c.Writer.WriteHeader(http.StatusUnauthorized)
		return
	}

	// ✅ 3. Апгрейдим соединение
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println("❌ Ошибка апгрейда:", err)
		return
	}
	defer conn.Close()

	go func() {
		for {
			time.Sleep(30 * time.Second)
			if err := conn.WriteMessage(websocket.PingMessage, []byte{}); err != nil {
				log.Println("❌ Ошибка при отправке Ping:", err)
				return
			}
		}
	}()

	log.Printf("✅ User %d подключён по WebSocket", userID)

	Manager.Add(userID, conn)
	defer Manager.Remove(userID)

	for {
		_, msgBytes, err := conn.ReadMessage()
		if err != nil {
			log.Println("❌ Ошибка чтения:", err)
			break
		}

		var msg IncomingMessage
		if err := json.Unmarshal(msgBytes, &msg); err != nil {
			log.Println("❌ Невалидный JSON:", err)
			sendError(conn, "Невалидный формат сообщения")
			continue
		}

		log.Printf("📩 От пользователя %d: %s", userID, msg.Content)

		// 👇 ВСТАВЬ СЮДА — обработка отправки другому пользователю
		if msg.Type == "send_to_user" {
			parts := strings.SplitN(msg.Content, ":", 2)
			if len(parts) != 2 {
				sendError(conn, "Формат должен быть userId:message")
				continue
			}

			targetID, _ := strconv.Atoi(parts[0])
			targetMsg := parts[1]

			if targetConn, ok := Manager.Get(targetID); ok {
				out := OutgoingMessage{
					Type: "message",
					Body: targetMsg,
				}
				outBytes, _ := json.Marshal(out)
				targetConn.WriteMessage(websocket.TextMessage, outBytes)
				log.Printf("📤 Отправлено пользователю %d: %s", targetID, targetMsg)
			} else {
				sendError(conn, "Пользователь не в сети")
			}
			continue
		}

		// 📨 Обычный ответ, если это не send_to_user
		resp := OutgoingMessage{
			Type: "ack",
			Body: "Сообщение получено",
		}
		respBytes, _ := json.Marshal(resp)

		log.Println("🔁 Отправляем ответ клиенту...")
		if err := conn.WriteMessage(websocket.TextMessage, respBytes); err != nil {
			log.Println("❌ Ошибка при отправке:", err)
		} else {
			log.Println("✅ Ответ успешно отправлен")
		}
	}
}

func sendError(conn *websocket.Conn, message string) {
	resp := OutgoingMessage{
		Type: "error",
		Body: message,
	}
	if respBytes, err := json.Marshal(resp); err == nil {
		conn.WriteMessage(websocket.TextMessage, respBytes)
	}
}
