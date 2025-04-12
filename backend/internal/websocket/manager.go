package websocket

import (
	"sync"

	"github.com/gorilla/websocket"
)

type ConnectionManager struct {
	sync.RWMutex
	connections map[int]*websocket.Conn // userID -> conn
}

var Manager = &ConnectionManager{
	connections: make(map[int]*websocket.Conn),
}

func (m *ConnectionManager) Add(userID int, conn *websocket.Conn) {
	m.Lock()
	defer m.Unlock()
	m.connections[userID] = conn
}

func (m *ConnectionManager) Remove(userID int) {
	m.Lock()
	defer m.Unlock()
	delete(m.connections, userID)
}

func (m *ConnectionManager) Get(userID int) (*websocket.Conn, bool) {
	m.RLock()
	defer m.RUnlock()
	conn, ok := m.connections[userID]
	return conn, ok
}
