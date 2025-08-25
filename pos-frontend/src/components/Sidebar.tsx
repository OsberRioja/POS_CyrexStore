import React from "react";

export default function Sidebar({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (page: string | null) => void;
}) {
  return (
    <aside className="w-40 bg-transparent flex flex-col items-center py-8">
      <div className="w-full flex flex-col items-start pl-2 space-y-3">
        <button
          onClick={() => onSelect("usuarios")}
          className={`w-24 text-sm font-semibold px-3 py-2 rounded-md shadow-sm text-white ${
            selected === "usuarios" ? "bg-blue-600" : "bg-blue-500/90"
          }`}
        >
          USUARIOS
        </button>
      </div>

      {/* línea vertical separadora */}
      <div className="absolute left-40 top-6 bottom-6 w-px bg-gray-300" />
    </aside>
  );
}
