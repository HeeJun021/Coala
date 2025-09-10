// frontend/src/components/project/git/CommitModal.jsx
import React, { useState } from "react";

const CommitModal = ({ onClose, onSubmit }) => {
  const [commitTitle, setCommitTitle] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!commitTitle.trim()) {
      alert("커밋 제목을 입력해주세요.");
      return;
    }
    if (!commitMessage.trim()) {
      alert("커밋 메시지를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: commitTitle.trim(),
        message: commitMessage.trim(),
      });
      onClose();
    } catch (err) {
      console.error("커밋 실패:", err);
      alert("커밋 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-center">새 커밋</h2>

        <label className="block mb-2 text-sm font-medium">커밋 제목</label>
        <input
          type="text"
          value={commitTitle}
          onChange={(e) => setCommitTitle(e.target.value)}
          className="w-full border p-2 rounded mb-4"
          placeholder="예: 로그인 기능 추가"
        />

        <label className="block mb-2 text-sm font-medium">커밋 메시지</label>
        <textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          className="w-full border p-2 rounded mb-6"
          rows={4}
          placeholder="변경된 내용을 자세히 입력해주세요"
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
            {isSubmitting ? "커밋 중..." : "커밋하기"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommitModal;
