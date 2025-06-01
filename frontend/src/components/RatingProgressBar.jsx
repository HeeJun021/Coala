import React from 'react';

const RatingProgressBar = ({ rating, min, max }) => {
  const percentage = Math.min(100, Math.max(0, ((rating - min) / (max - min)) * 100));

  return (
    <div className="w-full mt-2">
      <div className="flex justify-between text-sm text-gray-600 font-semibold mb-1 px-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden relative">
        <div
          className="h-4 bg-green-500 transition-all duration-300 rounded-full"
          style={{ width: `${percentage}%`, marginRight: '1.5rem' }}
        ></div>
      </div>
    </div>
  );
};

export default RatingProgressBar;
