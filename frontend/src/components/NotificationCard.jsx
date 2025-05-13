import React, { useState } from "react";

const NotificationCard = () => {
  const [messageSetting, setMessageSetting] = useState("누구나 가능");
  const [notificationEnabled, setNotificationEnabled] = useState(true);

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg border border-gray-300 w-full max-w-2xl mt-6">
      <h2 className="text-lg font-bold mb-4">알림 설정</h2>

      {/* 메시지 수신 허용 */}
      <div className="mb-4">
        <label className="font-semibold block mb-2">메시지 수신 허용</label>
        <select
          className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
          value={messageSetting}
          onChange={(e) => setMessageSetting(e.target.value)}
        >
          <option>누구나 가능</option>
          <option>팀원/멘토만 가능</option>
          <option>모든 수신 차단</option>
        </select>
      </div>

      {/* 알림 설정 */}
      <div className="flex items-center justify-between">
        <span className="font-semibold">알림 설정</span>
        <button
          className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
            notificationEnabled ? "bg-green-500" : "bg-gray-300"
          }`}
          onClick={() => setNotificationEnabled(!notificationEnabled)}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full shadow-md transform transition duration-300 ${
              notificationEnabled ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
};

export default NotificationCard;
