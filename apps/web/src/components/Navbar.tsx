import React from "react";
import { LayoutGrid, Box, Columns, CheckCircle2, AlertCircle } from "lucide-react";

export type ViewMode = "2d" | "3d" | "split";

interface NavbarProps {
  projectName: string;
  revision: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  apiHealthy: boolean | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  projectName,
  revision,
  viewMode,
  onViewModeChange,
  apiHealthy,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Project Info */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            I
          </div>
          <div>
            <span className="font-bold text-gray-900 tracking-tight text-lg">InteriorAI</span>
            <span className="text-orange-600 font-semibold text-xs ml-1 uppercase tracking-wider">Studio</span>
          </div>
        </div>

        <div className="h-5 w-px bg-gray-300" />

        <div className="flex items-center space-x-2">
          <h1 className="font-medium text-gray-800 text-sm">{projectName}</h1>
          <span className="px-2 py-0.5 text-xs font-mono bg-gray-100 text-gray-600 rounded border border-gray-200">
            Rev #{revision}
          </span>
        </div>
      </div>

      {/* View Switcher Controls */}
      <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 space-x-1">
        <button
          onClick={() => onViewModeChange("2d")}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            viewMode === "2d"
              ? "bg-white text-orange-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
          title="2D Plan View"
        >
          <LayoutGrid className="w-4 h-4" />
          <span>2D Plan</span>
        </button>

        <button
          onClick={() => onViewModeChange("3d")}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            viewMode === "3d"
              ? "bg-white text-orange-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
          title="3D Perspective View"
        >
          <Box className="w-4 h-4" />
          <span>3D View</span>
        </button>

        <button
          onClick={() => onViewModeChange("split")}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            viewMode === "split"
              ? "bg-white text-orange-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
          title="Synchronized Split View"
        >
          <Columns className="w-4 h-4" />
          <span>Split</span>
        </button>
      </div>

      {/* API Health Indicator */}
      <div className="flex items-center space-x-2 text-xs">
        {apiHealthy === true && (
          <span className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Backend Connected
          </span>
        )}
        {apiHealthy === false && (
          <span className="flex items-center text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5 mr-1" />
            Offline / Standalone
          </span>
        )}
        {apiHealthy === null && (
          <span className="text-gray-400">Connecting...</span>
        )}
      </div>
    </header>
  );
};
