import { useEffect, useRef, useCallback, useState } from "react";
import ReconnectingWebSocket from "reconnecting-websocket";

export const useAppWebSocket = (url, languageKey, sessionId, options) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const sendMessage = useCallback((message) => {
    if (socketRef.current) {
      socketRef.current.send(message);
    }
  }, []);

  const reconnect = useCallback(() => {
    if (socketRef.current) {
      console.log("Reconnec websocket")
      setIsConnecting(true);
      socketRef.current.reconnect();
    }
  }, []);

  const closeConnection = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }
  }, []);

  useEffect(() => {
    setIsConnecting(true);
    socketRef.current = new ReconnectingWebSocket(url, undefined, options);

    const handleOpen = (event) => {
      setIsConnecting(false);
      setIsConnected(true);
      options?.onOpen?.(event);
    };

    const handleClose = (event) => {
      setIsConnecting(false);
      setIsConnected(false);
      options?.onClose?.(event);
    };

    const handleMessage = (message) => {
      options?.onMessage?.(message);
    };

    const handleError = (event) => {
      setIsConnecting(false);
      options?.onError?.(event);
    };

    socketRef.current.onopen = handleOpen;
    socketRef.current.onclose = handleClose;
    socketRef.current.onmessage = handleMessage;
    socketRef.current.onerror = handleError;

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [url, sessionId]);

  return {
    ws: socketRef.current,
    sendMessage,
    reconnect,
    closeConnection,
    isConnected,
    isConnecting,
  };
};
