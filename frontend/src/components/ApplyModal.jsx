import React, { useState } from "react";
import { applyToProject } from "../api/boardApi";

const ApplyModal = ({ onClose, projectId, user }) => {
  const [introduction, setIntroduction] = useState("");
  const [skills, setSkills] = useState("");
  const [links, setLinks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!introduction.trim()) {
      alert("자기소개를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const skillsArray = skills
        ? skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      await applyToProject(projectId, {
        user_id: user.user_id,
        introduction: introduction.trim(),
        skills: skillsArray,
        links: links.trim(),
      });

      alert("참여 신청이 완료되었습니다.");
      onClose();
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.detail || "신청 중 오류가 발생했습니다.";
      alert(`신청 실패: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-xl font-semibold mb-4 text-center">프로젝트 참여 신청</h2>

        <label className="block mb-2 text-sm font-medium">자기소개</label>
        <textarea
          value={introduction}
          onChange={(e) => setIntroduction(e.target.value)}
          className="w-full border p-2 rounded mb-4"
          rows={4}
          placeholder="간단한 자기소개를 작성해주세요"
        />

        <label className="block mb-2 text-sm font-medium">가능 기술 스택 (쉼표로 구분)</label>
        <input
          type="text"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          className="w-full border p-2 rounded mb-4"
          placeholder="예: React, Java, MySQL"
        />

        <label className="block mb-2 text-sm font-medium">기타 링크 (GitHub, 포트폴리오 등)</label>
        <input
          type="text"
          value={links}
          onChange={(e) => setLinks(e.target.value)}
          className="w-full border p-2 rounded mb-6"
          placeholder="예: https://github.com/username"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded"
            disabled={isSubmitting}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-600 text-white rounded"
            disabled={isSubmitting}
          >
            {isSubmitting ? "신청 중..." : "신청하기"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplyModal;
