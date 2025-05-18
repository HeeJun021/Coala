import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";

const CodeGeneratorPanel = ({ sqlQuery, setSqlQuery }) => {
  return (
    <div className="w-full bg-[#1e1e2f] text-white p-4">
      <h2 className="text-lg font-semibold mb-2">📄 SQL 입력 영역</h2>

      {/* ✅ 자동 줄 수만큼 높이 조절되도록 설정 */}
      <div className="border border-gray-600 bg-[#252836] rounded overflow-hidden">
        <CodeMirror
          value={sqlQuery}
          onChange={(value) => setSqlQuery(value)}
          extensions={[sql()]}
          theme="dark"
          basicSetup={{
            lineNumbers: true,
            autocompletion: true,
          }}
          height="auto" // ✅ 핵심: 자동 높이 설정
          style={{
            fontSize: "14px",
            maxHeight: "500px", // ✅ 너무 길어질 경우 대비 (스크롤 생김)
            overflow: "auto",
          }}
        />
      </div>
    </div>
  );
};

export default CodeGeneratorPanel;
