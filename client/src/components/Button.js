// src/components/Button.js
import React, { useState } from 'react';

function Button({ onClick, children, description }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-64 px-6 py-3 bg-accent text-white rounded-md text-lg hover:bg-green-600 transition"
      >
        {children}
      </button>
      {isHovered && (
        <div className="absolute left-0 right-0 mt-2 p-2 bg-gray-800 text-white text-sm rounded-md shadow-lg">
          {description}
        </div>
      )}
    </div>
  );
}

export default Button;