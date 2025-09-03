import React, { useState } from "react";
import { Code } from "lucide-react";

const CodeEditorPanel = ({ project }) => {
  const [code, setCode] = useState("");

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Code size={20} className="text-green-600" />
        코드 에디터
      </h2>
      <textarea
        className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:border-green-600"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="// 코드를 입력하세요"
      />
      <button
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        onClick={() => console.log("코드 실행:", code)}
      >
        실행
      </button>
    </div>
  );
};

export default CodeEditorPanel;