import React from "react";
import { Controlled as CodeMirror } from "react-codemirror2";

// 필요한 모드 및 스타일 import
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/mode/sql/sql";

const CodeGeneratorPanel = ({ sqlQuery, setSqlQuery }) => {
  return (
    <div className="w-full bg-[#1e1e2f] text-white p-4">
      <h2 className="text-lg font-semibold mb-2">📄 SQL 입력 영역</h2>

      <div className="border border-gray-600 bg-[#252836] rounded overflow-hidden">
        <CodeMirror
          value={sqlQuery}
          options={{
            mode: "sql",
            theme: "dracula",
            lineNumbers: true,
            lineWrapping: true,
            tabSize: 2,
          }}
          onBeforeChange={(editor, data, value) => setSqlQuery(value)}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default CodeGeneratorPanel;
