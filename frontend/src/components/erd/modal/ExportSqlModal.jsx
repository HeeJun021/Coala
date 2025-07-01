import { useEffect, useLayoutEffect, useState, useRef } from "react";
import { fetchExportedSql } from "../../../api/erd/erdDetailApi";
import { FileUp } from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-sql";
import "prismjs/themes/prism-tomorrow.css";

const ExportSqlModal = ({ onClose, erdId }) => {
  const [dbms, setDbms] = useState("postgres");
  const [sql, setSql] = useState("-- SQL을 불러오는 중입니다...");
  const [loading, setLoading] = useState(true);
  const codeRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    const fetchSql = async () => {
      try {
        setLoading(true);
        const result = await fetchExportedSql(erdId, dbms);
        setSql(result);
      } catch (error) {
        console.error("SQL 로딩 실패:", error);
        setSql("-- ❌ SQL 로딩 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchSql();
  }, [erdId, dbms]);

  // DOM 반영 이후 정확하게 Prism 적용
  useLayoutEffect(() => {
    if (codeRef.current) {
      setTimeout(() => {
        Prism.highlightElement(codeRef.current);
      }, 0);
    }
  }, [sql]);

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
      <div className="bg-[#1e1e2e] text-white rounded-2xl shadow-2xl p-6 relative w-[680px] max-w-full border border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 hover:text-white text-2xl"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileUp size={25} className="text-gray-400" />
          SQL 내보내기
        </h2>

        <div className="space-y-3 mb-4">
          <label className="text-sm font-medium">DBMS 선택</label>
          <select
            className="w-full border border-gray-600 bg-[#2a2e3a] text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={dbms}
            onChange={(e) => setDbms(e.target.value)}
          >
            <option value="postgres">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="oracle">Oracle</option>
          </select>
        </div>

        <pre className="rounded-lg overflow-auto bg-[#282c34] text-[#d4d4d4] border border-gray-600 p-4 h-[260px] leading-relaxed text-sm sql-scrollbar">
          <code
  ref={codeRef}
  className="language-sql"
  style={{
    backgroundColor: "transparent",
    fontSize: "13px",
    fontFamily: "'JetBrains Mono', monospace",
  }}
  dangerouslySetInnerHTML={{
    __html: loading ? "-- SQL을 불러오는 중입니다..." : sql,
  }}
></code>

        </pre>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSqlDownload}
            className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-6 py-2 rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
