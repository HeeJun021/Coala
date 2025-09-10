// frontend/src/components/portfolio/NotionConnectPanel.jsx
import React, { useState } from "react";
import { SiNotion } from "react-icons/si";
import { CheckCircle2, Unplug, Link as LinkIcon } from "lucide-react";
import { getNotionAuthorizeUrl, disconnectNotion } from "../../api/notionApi";

export default function NotionConnectPanel({ connected, workspaceName, onConnectedChange }) {
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const isConnected = !!connected;

  const handleConnect = async () => {
    try {
      setLoading(true);
      const { authorize_url } = await getNotionAuthorizeUrl();
      window.location.href = authorize_url;
    } catch (err) {
      console.error(err);
      alert("노션 연결 URL을 가져오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("노션 연결을 해제할까요?")) return; // ✅ confirm 사용
    try {
      setDisconnecting(true);
      await disconnectNotion();
      onConnectedChange(false);
      alert("노션 연결이 해제되었습니다."); // ✅ 단순 안내
    } catch (err) {
      console.error(err);
      alert("노션 연결 해제에 실패했습니다.");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0">
          <div className="w-14 h-14 rounded-2xl border flex items-center justify-center">
            <SiNotion size={28} />
          </div>
        </div>

        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900 mb-2">노션 계정 연결</h2>

          {!isConnected ? (
            <>
              <p className="text-gray-600 mb-4">
                포트폴리오를 <span className="font-medium text-gray-800">노션 페이지</span>로 자동 생성하려면
                먼저 노션 계정을 연결하세요.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleConnect}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white disabled:opacity-60"
                >
                  <LinkIcon size={18} />
                  {loading ? "연결 중..." : "노션 계정 연결"}
                </button>
                <span className="text-sm text-gray-500">
                  연결 후 이 페이지로 돌아오면 자동으로 상태가 갱신됩니다.
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-emerald-700 mb-2">
                <CheckCircle2 size={18} />
                <span className="font-semibold">연결됨</span>
              </div>
              <p className="text-gray-600 mb-4">
                워크스페이스: <span className="font-medium">{workspaceName || "연결된 워크스페이스"}</span>
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 disabled:opacity-60"
                >
                  <Unplug size={18} />
                  {disconnecting ? "해제 중..." : "연결 해제"}
                </button>
                <span className="text-sm text-gray-500">
                  * 권한 오류가 발생하면 대상 페이지에 통합을 공유해야 합니다.
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
