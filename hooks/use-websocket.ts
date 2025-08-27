"use client"

import { useState, useEffect, useRef } from "react"

interface UseWebSocketReturn {
  isConnected: boolean
  lastMessage: string | null
  sendMessage: (message: string) => void
  disconnect: () => void
  reconnect: () => void
}

export function useWebSocket(url: string): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<string | null>(null)
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const connect = () => {
    try {
      ws.current = new WebSocket(url)

      ws.current.onopen = () => {
        console.log("WebSocket connected")
        setIsConnected(true)
      }

      ws.current.onmessage = (event) => {
        setLastMessage(event.data)
      }

      ws.current.onclose = () => {
        console.log("WebSocket disconnected")
        setIsConnected(false)

        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Attempting to reconnect...")
          connect()
        }, 3000)
      }

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error)
        setIsConnected(false)
      }
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error)
      setIsConnected(false)
    }
  }

  const sendMessage = (message: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(message)
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (ws.current) {
      ws.current.close()
    }
  }

  const reconnect = () => {
    disconnect()
    connect()
  }

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [url])

  return {
    isConnected,
    lastMessage,
    sendMessage,
    disconnect,
    reconnect,
  }
}
