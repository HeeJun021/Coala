import React, { useState, useEffect } from "react";
import apiClient from "../api/apiClient";
import { FaBookOpen } from "react-icons/fa";

const SelfCodingGitPanel = ({ isGithubConnected }) => {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isGithubConnected) {
      const fetchRepos = async () => {
        setLoading(true);
        try {
          const res = await apiClient.get("/freecode/github/repos", {
            withCredentials: true,
          });
          setRepos(res.data);
          setError(null);
        } catch (err) {
          console.error("Failed to fetch repos:", err);
          setError(err.response?.data?.detail || "저장소 목록을 가져오지 못했습니다.");
          setRepos([]);
        } finally {
          setLoading(false);
        }
      };
      fetchRepos();
    } else {
      setRepos([]);
      setError(null);
    }
  }, [isGithubConnected]);

  // ✅ 연동 해제 로직만 최신화
  const handleUnlinkGithub = async () => {
    try {
      await apiClient.post("/auth/social/unlink/github", {}, { withCredentials: true });
      window.location.href = "https://github.com/logout";
    } catch (err) {
      console.error("Failed to unlink GitHub:", err);
      setError("GitHub 연동 해제에 실패했습니다.");
    }
  };

  const GithubConnectGuide = () => (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">🔗 GitHub 연동 안내</h2>
      <p className="text-sm text-gray-700 mb-6 leading-relaxed">
        자율 코딩 프로젝트를 GitHub 원격 저장소에 연동하여 관리할 수 있습니다.<br />
        아직 GitHub 계정과 연동되어 있지 않습니다. 아래 버튼을 눌러 연동을 진행해 주세요.
      </p>
      <button
        onClick={() => window.location.href = "http://localhost:8000/auth/social/github/login"}
        className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition"
      >
        GitHub 계정 연동하기
      </button>
    </div>
  );

  const GithubRepoList = () => (
    <div className="w-[240px] pl-[1px] pr-2">
      <h2 className="text-l font-bold mb-6">📂 내 GitHub 저장소</h2>
      {loading ? (
        <p className="text-sm text-gray-500">저장소 목록을 불러오는 중...</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : repos.length === 0 ? (
        <p className="text-sm text-gray-500">저장소가 없습니다.</p>
      ) : (
        <ul className="space-y-2 pl-0">
          {repos.map((repo) => (
            <li
              key={repo.id}
              onClick={() => window.open(repo.html_url, "_blank")}
              className="ml-0 flex items-start gap-2 px-1 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition cursor-pointer w-full"
            >
              <div className="mt-0.5 text-gray-500">
                <FaBookOpen size={12} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="truncate text-sm text-blue-600 font-medium">
                    {repo.full_name}
                  </span>
                  <span className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-100 text-green-800">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                    Public
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {repo.description || "설명 없음"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* ✅ 여기만 변경됨 */}
      <div className="mt-6 text-right">
        <button
          onClick={handleUnlinkGithub}
          className="text-xs text-gray-600 border border-gray-300 px-3 py-1 rounded hover:bg-gray-100 float-right"
        >
          🔄 GitHub 계정 변경
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full">
      {isGithubConnected ? <GithubRepoList /> : <GithubConnectGuide />}
    </div>
  );
};

export default SelfCodingGitPanel;
