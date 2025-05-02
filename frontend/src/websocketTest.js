import React, { useEffect, useRef } from "react";

const WebSocketTest = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find(row => row.startsWith("access_token="))
      ?.split("=")[1];

    const roomId = 1;

    if (!token) {
      console.error("❌ access_token 쿠키가 없습니다. 로그인 먼저 하세요.");
      return;
    }

    const socket = new WebSocket(`ws://localhost:8000/ws/chat?token=${token}&room_id=${roomId}`);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("✅ WebSocket 연결됨");

      // 1. 메시지 전송
      socket.send(JSON.stringify({
        type: "message",
        room_id: roomId,
        message: "테스트 메시지 from React"
      }));

      // 2. 읽음 처리
      setTimeout(() => {
        socket.send(JSON.stringify({
          type: "read",
          message_id: 1
        }));
      }, 1000);

      // 3. 접속 유저 조회
      setTimeout(() => {
        socket.send(JSON.stringify({
          type: "online_users"
        }));
      }, 1500);

      // 4. 이전 메시지 조회
      setTimeout(() => {
        socket.send(JSON.stringify({
          type: "fetch_old_messages",
          before: new Date().toISOString(),
          limit: 10
        }));
      }, 2000);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📩 메시지 수신:", data);
    };

    socket.onclose = () => {
      console.log("❌ WebSocket 연결 종료됨");
    };

    socket.onerror = (err) => {
      console.error("🚨 WebSocket 에러:", err);
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div className="p-4">
      <h2>🧪 WebSocket 테스트 중입니다</h2>
      <p>콘솔을 열어 결과를 확인하세요 (F12)</p>
    </div>
  );
};

export default WebSocketTest;
