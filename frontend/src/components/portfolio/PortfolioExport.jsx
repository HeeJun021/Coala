// src/components/portfolio/PortfolioExport.jsx
import React, { useEffect, useState, useCallback } from "react";
import NotionConnectPanel from "./NotionConnectPanel";
import PortfolioFilterPanel from "./PortfolioFilterPanel";
import { getNotionStatus } from "../../api/notionApi";
import { History } from "lucide-react";

function ExportHistoryTableSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
      <div className="flex items-center gap-2 mb-4">
        <History size={18} />
        <h2 className="text-lg font-semibold">포트폴리오 추출 내역</h2>
      </div>
      <div className="text-gray-500">나중에 이력 테이블 연결 예정입니다.</div>
    </div>
  );
}

/**
 * 레이아웃(사이드바) 내부에서 바로 렌더링할 컨테이너 컴포넌트
 * 필요한 경우 상위에서 padding/margin만 감싸주면 됨.
 */
export default function PortfolioExport() {
  const [tab, setTab] = useState("extract"); // 'extract' | 'history'
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");

  const refreshStatus = useCallback(async () => {
    try {
      setLoading(true);
    const data = await getNotionStatus();
      setConnected(!!data?.connected);
      setWorkspaceName(data?.workspace_name || "");
    } catch (err) {
      console.error(err);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return (
    <div className="relative">
      {/* 상단 탭 (페이지 아니라도 그대로 사용 가능) */}
      <div className="w-full max-w-6xl mx-auto mb-4 flex items-center gap-2">
        <button
          onClick={() => setTab("extract")}
          className={`px-4 py-2 rounded-xl border ${
            tab === "extract"
              ? "bg-green-600 text-white border-green-600"
              : "bg-white hover:bg-gray-50 text-gray-800"
          }`}
        >
          포트폴리오 추출
        </button>
        <button
          onClick={() => setTab("history")}
          className={`px-4 py-2 rounded-xl border ${
            tab === "history"
              ? "bg-green-600 text-white border-green-600"
              : "bg-white hover:bg-gray-50 text-gray-800"
          }`}
        >
          포트폴리오 추출 내역
        </button>
      </div>

      {/* 본문 */}
      {tab === "history" ? (
        <ExportHistoryTableSkeleton />
      ) : loading ? (
        <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="animate-pulse text-gray-500">상태 확인 중...</div>
        </div>
      ) : !connected ? (
        <NotionConnectPanel
          connected={false}
          onConnectedChange={(v) => {
            setConnected(v);
            if (v) setTab("extract");
          }}
        />
      ) : (
        <>
          {/* 연결됨 배지 + 워크스페이스 정보 */}
          <div className="w-full max-w-6xl mx-auto mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="text-sm font-semibold">노션 연결됨</span>
              {workspaceName ? <span className="text-sm">({workspaceName})</span> : null}
            </div>
          </div>
          <PortfolioFilterPanel />
        </>
      )}
    </div>
  );
}
