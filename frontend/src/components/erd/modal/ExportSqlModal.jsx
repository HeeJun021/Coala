import { useEffect, useLayoutEffect, useState, useRef } from "react";
import { fetchExportedSql } from "../../../api/erd/erdDetailApi";
import { FileUp } from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-sql";
import "prismjs/themes/prism.css"; // ✅ 라이트 테마

const ExportSqlModal = ({ onClose, erdId }) => {
  const [dbms, setDbms] = useState("postgres");
  const [sql, setSql] = useState("-- SQL을 불러오는 중입니다...");
  const [highlightedSql, setHighlightedSql] = useState("");
  const [loading, setLoading] = useState(true);
  const codeRef = useRef(null);

  // ESC로 닫기
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // SQL fetch + 하이라이트 생성
  useEffect(() => {
    const fetchSql = async () => {
      try {
        setLoading(true);
        const result = await fetchExportedSql(erdId, dbms);
        setSql(result);
        // ✅ 하이라이트된 HTML을 미리 만들어 state에 저장
        const highlighted = Prism.highlight(result, Prism.languages.sql, "sql");
        setHighlightedSql(highlighted);
      } catch (error) {
        console.error("SQL 로딩 실패:", error);
        const msg = "-- ❌ SQL 로딩 중 오류가 발생했습니다.";
        setSql(msg);
        setHighlightedSql(
          Prism.highlight(msg, Prism.languages.sql, "sql")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSql();
  }, [erdId, dbms]);

  // (선택) DOM 반영 이후에도 안전하게 한 번 더 하이라이트 (idempotent)
  useLayoutEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [highlightedSql]);

  const handleSqlDownload = () => {
    const blob = new Blob([sql], { type: "text/sql" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `erd_export_${dbms}.sql`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white text-gray-900 rounded-2xl shadow-2xl p-6 relative w-[680px] max-w-full border border-gray-200">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-500 hover:text-gray-900 text-2xl"
          aria-label="닫기"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileUp size={25} className="text-gray-600" />
          SQL 내보내기
        </h2>

        <div className="space-y-3 mb-4">
          <label className="text-sm font-medium text-gray-700">DBMS 선택</label>
          <select
            className="w-full border border-gray-300 bg-white text-gray-900 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={dbms}
            onChange={(e) => setDbms(e.target.value)}
          >
            <option value="postgres">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="oracle">Oracle</option>
          </select>
        </div>

        <pre className="rounded-lg overflow-auto bg-gray-50 text-gray-800 border border-gray-200 p-4 h-[260px] leading-relaxed text-sm sql-scrollbar">
          <code
            ref={codeRef}
            className="language-sql"
            style={{
              backgroundColor: "transparent",
              fontSize: "13px",
              fontFamily: "'JetBrains Mono', monospace",
            }}
            // ✅ 로딩 중엔 plain text, 완료되면 하이라이트된 HTML 주입
            dangerouslySetInnerHTML={{
              __html: loading
                ? "-- SQL을 불러오는 중입니다..."
                : highlightedSql,
            }}
          ></code>
        </pre>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSqlDownload}
            className="bg-green-600 hover:bg-green-700 transition-colors text-white px-6 py-2 rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            SQL 다운로드
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportSqlModal;
