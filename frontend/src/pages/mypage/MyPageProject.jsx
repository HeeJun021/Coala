// src/pages/mypage/MyPageProject.jsx
// ✅ 포폴 히스토리와 동일한 디자인 + 좌측 정렬 조정 버전

import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getMyProjects } from "../../api/projectApi";
import {
  Briefcase,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

const ITEMS_PER_PAGE = 15;

export default function MyPageProject() {
  const navigate = useNavigate();
  const { userData } = useOutletContext();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!userData?.user_id) {
      setErr("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await getMyProjects();
        const list = Array.isArray(res) ? res : res?.projects ?? [];
        if (!list || list.length === 0) {
          setErr("프로젝트 이력이 없습니다.");
          return;
        }
        setProjects(list);
      } catch {
        setErr("프로젝트 이력을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [userData]);

  const totalPages = Math.max(1, Math.ceil(projects.length / ITEMS_PER_PAGE));
  const currentItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return projects.slice(start, start + ITEMS_PER_PAGE);
  }, [page, projects]);

  const goPage = (p) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  const fmtDate = (d) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  const roleToKorean = (proj) => {
    if (proj?.my_role) return proj.my_role === "leader" ? "팀장" : "팀원";
    if (userData?.user_id && proj?.leader_id != null) {
      return proj.leader_id === userData.user_id ? "팀장" : "팀원";
    }
    const legacy = proj?.role || (proj?.is_leader ? "leader" : "member");
    return legacy === "leader" ? "팀장" : "팀원";
  };

  const goProject = (projectId) => {
    navigate(`/team-project/${projectId}`, {
      state: { tab: "overview", projectId },
    });
  };

  return (
    <div className="flex min-h-screen">
      {/* ✅ 좌측 여백 살짝 줄임 */}
      <div className="w-[200px]" />

      {/* ✅ 본문 */}
      <div className="flex-1 p-6 max-w-6xl mx-auto">
        <div className="max-w-5xl bg-white shadow-xl rounded-2xl border border-gray-300 p-7 relative ml-4">
          {/* 타이틀 */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-4 tracking-wide">
              프로젝트 참여 이력
            </h1>
            <p className="text-gray-500 text-sm">
              내가 참여한 모든 프로젝트 이력을 확인할 수 있습니다.
            </p>
          </div>

          {/* 헤더 라인 */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-gray-800">
              <Briefcase className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold">
                프로젝트 목록{" "}
                <span className="text-sm font-normal text-gray-500">
                  · 총 <strong>{projects.length}</strong>건
                </span>
              </h2>
            </div>
          </div>

          {/* 상태 */}
          {loading ? (
            <p className="text-sm text-gray-500">로딩 중...</p>
          ) : err ? (
            <p className="text-sm text-red-500">{err}</p>
          ) : projects.length === 0 ? (
            <p className="text-sm text-gray-500">프로젝트 이력이 없습니다.</p>
          ) : (
            <>
              {/* 테이블 */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-gray-700 border-collapse">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="p-3 w-[25%] text-center">프로젝트 이름</th>
                      <th className="p-3 w-[20%] text-center">프로젝트 주제</th>
                      <th className="p-3 w-[10%] text-center">역할</th>
                      <th className="p-3 w-[15%] text-center">시작일</th>
                      <th className="p-3 w-[15%] text-center">종료일</th>
                      <th className="p-3 w-[10%] text-center whitespace-nowrap">
                        이동
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((p) => (
                      <tr
                        key={p.project_id}
                        className="hover:bg-gray-50 border-b border-gray-100"
                      >
                        <td className="p-3 text-center">{p.name}</td>
                        <td className="p-3 text-center">{p.topic ?? "-"}</td>
                        <td className="p-3 text-center">{roleToKorean(p)}</td>
                        <td className="p-3 text-center">
                          {fmtDate(p.start_date)}
                        </td>
                        <td className="p-3 text-center">
                          {fmtDate(p.end_date)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => goProject(p.project_id)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md whitespace-nowrap leading-none"
                          >
                            이동 <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6 gap-2">
                  <button
                    onClick={() => goPage(page - 1)}
                    className={`px-3 py-2 rounded-md flex items-center justify-center ${
                      page === 1
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                    disabled={page === 1}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pNum) => (
                      <button
                        key={pNum}
                        onClick={() => goPage(pNum)}
                        className={`px-3 py-1.5 rounded-md border text-sm ${
                          page === pNum
                            ? "bg-green-600 text-white"
                            : "hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        {pNum}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => goPage(page + 1)}
                    className={`px-3 py-2 rounded-md flex items-center justify-center ${
                      page === totalPages
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                    disabled={page === totalPages}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
