import React, { useEffect, useState } from "react";
import {
  fetchCommittedSnapshots,
  checkoutSnapshot,
} from "../../../api/erd/erdDetailApi";
import SnapshotItem from "./SnapshotItem";

const SnapshotHistoryModal = ({
  erdId,
  onClose,
  fetchErdDetail,
  showToast,
}) => {
  const [snapshots, setSnapshots] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const data = await fetchCommittedSnapshots(erdId);
      setSnapshots(data);
    };
    fetch();
  }, [erdId]);

  const handleCheckout = async (snapshotId) => {
    try {
      await checkoutSnapshot(erdId, snapshotId);
      showToast("✅ 해당 스냅샷으로 이동했습니다.");

      // ✅ ERD 상세 재조회
      await fetchErdDetail(erdId);

      // ✅ 모달 닫기
      onClose();
    } catch (error) {
      showToast("❌ 스냅샷 체크아웃 실패");
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* ✅ 드래그/클릭 완전 차단용 오버레이 */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-40"
        style={{ pointerEvents: "auto", touchAction: "none" }}
      />

      {/* ✅ 모달 박스 */}
      <div className="relative z-50 bg-[#1e1e2e] text-white w-[480px] max-h-[80vh] overflow-y-auto rounded-xl shadow-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4">📜 스냅샷 히스토리</h2>
        <button
          onClick={onClose}
          className="absolute top-4 right-5 text-gray-400 hover:text-white text-xl"
        >
          ✖
        </button>

        {snapshots.length === 0 ? (
          <p className="text-sm text-gray-400">저장된 커밋이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {snapshots.map((s, i) => (
              <SnapshotItem
                key={s.snapshot_id}
                snapshot={s}
                onSelect={handleCheckout}
                index={snapshots.length - i}
                isFirst={i === 0}
                isLast={i === snapshots.length - 1}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SnapshotHistoryModal;
