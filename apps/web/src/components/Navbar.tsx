import React from "react";
import {
  LayoutGrid,
  Box,
  Columns,
  CheckCircle2,
  AlertCircle,
  Plus,
  Save,
  Check,
  Loader2,
  AlertTriangle,
  Undo2,
  Redo2,
  Sparkles,
} from "lucide-react";
import { ProjectData } from "../services/api";

export type ViewMode = "2d" | "3d" | "split";
export type SaveStatus = "saved" | "unsaved" | "saving" | "conflict";

interface NavbarProps {
  projectName: string;
  revision: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  apiHealthy: boolean | null;
  projects: ProjectData[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onOpenCreateModal: () => void;
  saveStatus: SaveStatus;
  onSaveScene: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onOpenAILayoutModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  projectName,
  revision,
  viewMode,
  onViewModeChange,
  apiHealthy,
  projects,
  activeProjectId,
  onSelectProject,
  onOpenCreateModal,
  saveStatus,
  onSaveScene,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onOpenAILayoutModal,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between sticky top-0 z-40">
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

        {/* Project Selector & Actions */}
        <div className="flex items-center space-x-2">
          {projects.length > 0 ? (
            <select
              value={activeProjectId || ""}
              onChange={(e) => onSelectProject(e.target.value)}
              className="text-xs font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-semibold text-gray-800">{projectName}</span>
          )}

          <button
            onClick={onOpenCreateModal}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900 text-xs font-medium transition-colors"
            title="Create New Project"
          >
            <Plus className="w-3.5 h-3.5 text-orange-600" />
            <span>New</span>
          </button>

          <span className="px-2 py-0.5 text-xs font-mono bg-gray-100 text-gray-600 rounded border border-gray-200">
            Rev #{revision}
          </span>
        </div>

        {/* Undo / Redo Actions */}
        <div className="flex items-center space-x-1 pl-2 border-l border-gray-200">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
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

      {/* Right Controls: Save & Status Indicator */}
      <div className="flex items-center space-x-3 text-xs">
        {/* AI Layout Button */}
        {onOpenAILayoutModal && (
          <button
            onClick={onOpenAILayoutModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm transition-all"
            title="Generate AI-assisted furniture layout"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Layout</span>
          </button>
        )}

        {/* Save Button */}
        {activeProjectId && (
          <button
            onClick={onSaveScene}
            disabled={saveStatus === "saving" || saveStatus === "saved"}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
              saveStatus === "unsaved"
                ? "bg-orange-600 hover:bg-orange-700 text-white animate-pulse"
                : saveStatus === "saving"
                ? "bg-orange-100 text-orange-700 cursor-not-allowed"
                : saveStatus === "conflict"
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-gray-100 text-gray-500 cursor-default"
            }`}
          >
            {saveStatus === "saving" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saveStatus === "saved" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
            {saveStatus === "unsaved" && <Save className="w-3.5 h-3.5" />}
            {saveStatus === "conflict" && <AlertTriangle className="w-3.5 h-3.5" />}
            <span>
              {saveStatus === "saving"
                ? "Saving..."
                : saveStatus === "saved"
                ? "Saved"
                : saveStatus === "conflict"
                ? "Conflict"
                : "Save Scene"}
            </span>
          </button>
        )}

        {/* Backend Connectivity Indicator */}
        <div className="flex items-center">
          {apiHealthy === true && (
            <span className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Connected
            </span>
          )}
          {apiHealthy === false && (
            <span className="flex items-center text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5 mr-1" />
              Offline
            </span>
          )}
          {apiHealthy === null && (
            <span className="text-gray-400">Connecting...</span>
          )}
        </div>
      </div>
    </header>
  );
};
