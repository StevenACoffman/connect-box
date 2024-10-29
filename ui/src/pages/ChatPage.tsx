import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChatService } from "../proto/server/chat/v1/chat_connect";
import { useClient } from "../useClient";
import { Timestamp } from "@bufbuild/protobuf";
import { ConnectError, Code } from "@connectrpc/connect";

import {
  BroadcastChatRequest,
  Msg,
  NewChatSessionResponse,
} from "../proto/server/chat/v1/chat_pb";

interface ChatMessage {
  user: string;
  content: string;
  timestamp: Date;
  isSelfMsg: boolean;
}

const ChatPage: React.FC = () => {
  const location = useLocation();
  const { userName, roomName } = location.state || {
    userName: "",
    roomName: "",
  };
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const client = useClient(ChatService);
  const navigate = useNavigate();

  useEffect(() => {
    const receiveMessages = async () => {
      try {
        const stream = client.newChatSession({ userName, roomName });
        for await (const message of stream) {
          const msgResponse = (message as NewChatSessionResponse).msg;
          const chatMessage: ChatMessage = {
            user: msgResponse!.userName,
            content: msgResponse!.content,
            timestamp: msgResponse!.timestamp?.toDate() || new Date(),
            isSelfMsg: msgResponse!.userName === userName,
          };
          setMessages((prevMessages) => [...prevMessages, chatMessage]);
        }
      } catch (err) {
        if (err instanceof ConnectError && err.code === Code.Unauthenticated) {
          navigate("/login");
          window.location.reload();
        }
        console.error(err);
      }
    };
    receiveMessages();
  }, [client, userName, roomName, navigate]);

  const sendMessage = async () => {
    try {
      if (newMessage.trim()) {
        const message = new BroadcastChatRequest({
          msg: new Msg({
            userName,
            roomName,
            content: newMessage,
            timestamp: Timestamp.now(),
          }),
        });
        await client.broadcastChat(message);
        const inputElement = document.getElementById(
          "input"
        ) as HTMLInputElement;
        inputElement.value = "";
      }
    } catch (err) {
      if (err instanceof ConnectError && err.code === Code.Unauthenticated) {
        navigate("/login");
        window.location.reload();
      }
    }
  };

  return (
    <div style={styles.chatContainer}>
      <div style={styles.chatHeader}>
        <h2>User: {userName}</h2>
        <h3>Room: {roomName}</h3>
      </div>
      <div style={styles.chatMessages}>
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              ...styles.chatMessage,
              backgroundColor: message.isSelfMsg ? "#d2e7d6" : "#e9e9e9",
            }}
          >
            <strong>{message.user}: </strong>
            <span>{message.content}</span>
            <div style={styles.timestamp}>
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div style={styles.chatInput}>
        <input
          id="input"
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          style={styles.input}
        />
        <button onClick={sendMessage} style={styles.button}>
          Send
        </button>
      </div>
    </div>
  );
};

const styles = {
  chatContainer: {
    display: "flex",
    flexDirection: "column" as "column",
    height: "100vh",
    maxWidth: "600px",
    margin: "0 auto",
    border: "1px solid #ccc",
    borderRadius: "8px",
    overflow: "hidden",
  },
  chatHeader: {
    backgroundColor: "#b7e9f6",
    padding: "10px",
    textAlign: "center" as "center",
  },
  chatMessages: {
    flex: 1,
    padding: "10px",
    overflowY: "auto" as "auto",
    backgroundColor: "#f4f4f4",
  },
  chatMessage: {
    marginBottom: "10px",
    padding: "8px",
    borderRadius: "4px",
    position: "relative" as "relative",
  },
  timestamp: {
    fontSize: "0.8em",
    color: "#888",
    position: "absolute" as "absolute",
    right: "10px",
    bottom: "5px",
  },
  chatInput: {
    display: "flex",
    padding: "10px",
    backgroundColor: "#fff",
    borderTop: "1px solid #ccc",
  },
  input: {
    flex: 1,
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginRight: "10px",
  },
  button: {
    padding: "20px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

export default ChatPage;
