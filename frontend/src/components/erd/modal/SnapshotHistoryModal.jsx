import React, { useEffect, useState } from "react";
import {
  fetchCommittedSnapshots,
  checkoutSnapshot,
} from "../../../api/erd/erdDetailApi";
import SnapshotItem from "./SnapshotItem";
import { X, ScrollText, CheckSquare } from "lucide-react";

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
      showToast(
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-green-600" />
          <span>해당 스냅샷으로 이동했습니다.</span>
        </div>
      );
      await fetchErdDetail(erdId);
      onClose();
    } catch (error) {
      showToast("❌ 스냅샷 체크아웃 실패");
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 오버레이 */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-40"
        style={{ pointerEvents: "auto", touchAction: "none" }}
      />

      {/* 모달 */}
      <div className="relative z-50 bg-white text-gray-900 w-[480px] max-h-[80vh] overflow-y-auto rounded-xl shadow-xl p-6 border border-gray-200">
        {/* 제목 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ScrollText size={20} className="text-yellow-600" />
            스냅샷 히스토리
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* 스냅샷 목록 */}
        {snapshots.length === 0 ? (
          <p className="text-sm text-gray-500">저장된 커밋이 없습니다.</p>
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
