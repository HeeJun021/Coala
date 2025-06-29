import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getProjectApplicants,
  updateApplicantStatus,
} from "../../api/boardApi";

const ProjectApplicantsPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [loadingId, setLoadingId] = useState(null); // ✅ 버튼 중복 방지용 상태

  const fetchApplicants = async () => {
    try {
      const data = await getProjectApplicants(postId);
      setApplicants(data);
    } catch (error) {
      console.error("지원자 목록 불러오기 실패:", error);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [postId]);

  const handleStatusChange = async (applicantId, status) => {
    try {
      setLoadingId(applicantId);
      await updateApplicantStatus(applicantId, status);
      alert(`'${status}' 처리되었습니다.`);
      fetchApplicants(); // 상태 업데이트 후 목록 갱신
    } catch (error) {
      alert("상태 변경에 실패했습니다.");
      console.error(error);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6">프로젝트 지원자 목록</h2>

      {applicants.length === 0 ? (
        <p className="text-gray-500">아직 지원한 사람이 없습니다.</p>
      ) : (
        <ul className="space-y-6">
          {applicants.map((applicant) => (
            <li
              key={applicant.applicant_id}
              className="border p-4 rounded shadow bg-white"
            >
              <div className="mb-2">
                <strong>닉네임:</strong> {applicant.nickname}
              </div>
              <div className="mb-2">
                <strong>소개:</strong> {applicant.introduction}
              </div>
              <div className="mb-2">
                <strong>기술 스택:</strong> {applicant.skills.join(", ")}
              </div>
              {applicant.links && (
                <div className="mb-2">
                  <strong>링크:</strong>{" "}
                  <a
                    href={applicant.links}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                  >
                    {applicant.links}
                  </a>
                </div>
              )}
              <div className="mb-2">
                <strong>상태:</strong>{" "}
                <span
                  className={`font-semibold ${
                    applicant.status === "수락"
                      ? "text-green-600"
                      : applicant.status === "거절"
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {applicant.status}
                </span>
              </div>
              <div className="mb-4">
                <strong>신청 일시:</strong>{" "}
                {new Date(applicant.applied_at).toLocaleString()}
              </div>

              {/* 수락/거절 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleStatusChange(applicant.applicant_id, "수락")
                  }
                  disabled={loadingId === applicant.applicant_id}
                  className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                >
                  수락
                </button>
                <button
                  onClick={() =>
                    handleStatusChange(applicant.applicant_id, "거절")
                  }
                  disabled={loadingId === applicant.applicant_id}
                  className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
                >
                  거절
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 text-right">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-300 rounded"
        >
          ← 돌아가기
        </button>
      </div>
    </div>
  );
};

export default ProjectApplicantsPage;
