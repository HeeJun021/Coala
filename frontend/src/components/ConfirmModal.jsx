import React from "react";

/**
 * 범용 확인 모달 컴포넌트
 * @param {object} props
 * @param {boolean} props.show - 모달을 보여줄지 여부 (state로 관리)
 * @param {string} props.title - 모달 제목
 * @param {string} props.message - 모달에 표시할 메시지
 * @param {function} props.onClose - '취소' 또는 '닫기' 버튼 클릭 시 호출될 함수
 * @param {function} props.onConfirm - '확인' 버튼 클릭 시 호출될 함수
 */
const ConfirmModal = ({ show, onClose, onConfirm, title, message }) => {
  // show가 false면 아무것도 렌더링하지 않음
  if (!show) {
    return null;
  }

  return (
    // 배경 오버레이
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      {/* 모달 본문 */}
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-xl font-semibold mb-4 text-center">{title}</h2>
        <p className="mb-6 text-center">{message}</p>

        <div className="flex justify-center gap-4">
          <button
            onClick={onClose} // 취소 버튼
            className="px-6 py-2 bg-gray-300 rounded"
          >
            취소
          </button>
          <button
            onClick={onConfirm} // 확인 버튼
            className="px-6 py-2 bg-green-600 hover:bg-green-800 text-white rounded"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;