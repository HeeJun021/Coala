import { useState } from "react";

function App() {
  const [name, setName] = useState(""); // 사용자 입력 상태
  const [response, setResponse] = useState(""); // 백엔드 응답 상태

  const handleRegister = async () => {
    const res = await fetch("http://127.0.0.1:8000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setResponse(data.message); // 백엔드 응답 저장
  };

  return (
    <div>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름 입력" />
      <button onClick={handleRegister}>회원가입</button>
      <p>{response}</p>
    </div>
  );
}

export default App;
