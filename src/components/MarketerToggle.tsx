// src/components/MarketerToggle.tsx
import React, { useState, useEffect } from "react";
import { Users, UserCog } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function MarketerToggle() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isMarketerMode, setIsMarketerMode] = useState(() => {
    return localStorage.getItem("forceMarketerMode") === "true";
  });

  // Sync state with localStorage when location changes
  useEffect(() => {
    const currentMode = localStorage.getItem("forceMarketerMode") === "true";
    setIsMarketerMode(currentMode);
  }, [location.pathname]);

  const toggleMode = () => {
    const newValue = !isMarketerMode;
    setIsMarketerMode(newValue);
    localStorage.setItem("forceMarketerMode", String(newValue));
    
    // Use navigate for smooth transition
    if (newValue) {
      navigate("/marketing-dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <button
      onClick={toggleMode}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
        isMarketerMode
          ? "bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200"
          : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
      }`}
      title={isMarketerMode ? "Switch to Admin Mode" : "Switch to Marketer Mode"}
    >
      {isMarketerMode ? (
        <>
          <UserCog className="w-3.5 h-3.5" />
          Admin Mode
        </>
      ) : (
        <>
          <Users className="w-3.5 h-3.5" />
          Marketer Mode
        </>
      )}
    </button>
  );
}