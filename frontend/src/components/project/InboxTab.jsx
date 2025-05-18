import React from "react";

const InboxTab = ({ messages = [] }) => {
  return (
    <div className="p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">📥 수신함</h2>
      <ul className="space-y-4">
        {messages.length === 0 ? (
          <p className="text-gray-500">알림이 없습니다.</p>
        ) : (
          messages.map((msg, idx) => (
            <li key={idx} className="flex justify-between">
              <span>🔔 {msg.content}</span>
              <span className="text-sm text-gray-500">{msg.date}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default InboxTab;
