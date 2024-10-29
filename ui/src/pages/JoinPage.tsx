import Cookies from "js-cookie";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const JoinPage: React.FC = () => {
  const roomRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    // check if user has logged in by checking the username cookie
    // redirect user if cookie does not exist
    const cookieUserName = Cookies.get("username");
    if (!cookieUserName) {
      navigate("/home");
      window.location.reload();
    }
    setUserName(cookieUserName!)
  }, [navigate]);

  const joinHandler = async () => {
    if (!userName || !roomRef.current) return;
    const roomName = roomRef.current.value;
    navigate("/chat", { state: { userName, roomName } });
  };

  return (
    <div className="container">
      <div>
        <h1>Welcome, {userName}</h1>
      </div>
      <div style={{ padding: "10px 0" }}>
        <input
          ref={roomRef}
          style={{ fontSize: "1.3rem" }}
          type="text"
          id="room"
          placeholder="Room name..."
        />
      </div>
      <div>
        <button
          onClick={joinHandler}
          style={{
            margin: "20px",
            padding: "7px 38px",
            fontSize: "1.2em",
            boxSizing: "content-box",
            borderRadius: "4px",
          }}
        >
          Join Room
        </button>
      </div>
    </div>
  );
};

export default JoinPage;
