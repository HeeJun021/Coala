import { useEffect, useState } from "react";
import { fetchExportedSql } from "../../../api/erd/erdDetailApi"; // 경로는 프로젝트 구조에 맞게 조정

const ExportSqlModal = ({ onClose, erdId }) => {
  const [dbms, setDbms] = useState("postgres");
  const [sql, setSql] = useState("-- SQL을 불러오는 중입니다...");
  const [loading, setLoading] = useState(true);

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

  const handleSqlDownload = () => {
    const blob = new Blob([sql], { type: "text/sql" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `erd_export_${dbms}.sql`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div
      id="export-sql-modal"
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
    >
      <div className="bg-[#1f1f2b] text-white rounded-xl shadow-xl p-6 relative w-[420px] max-w-full border border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-400 hover:text-white text-xl"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold mb-4">📦 내보내기</h2>

        <div className="space-y-2 mb-3">
          <label className="text-sm font-medium">DBMS 선택</label>
          <select
            className="w-full border border-gray-600 bg-[#2a2d3a] text-white px-3 py-2 rounded"
            value={dbms}
            onChange={(e) => setDbms(e.target.value)}
          >
            <option value="postgres">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="oracle">Oracle</option>
          </select>
        </div>

        <pre className="bg-[#2a2d3a] text-gray-200 text-xs p-3 rounded h-[120px] overflow-auto border border-gray-600 whitespace-pre-wrap">
          {loading ? "-- SQL을 불러오는 중입니다..." : sql}
        </pre>

        <div className="mt-4 flex flex-col gap-2">
          <button
            onClick={handleSqlDownload}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
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
