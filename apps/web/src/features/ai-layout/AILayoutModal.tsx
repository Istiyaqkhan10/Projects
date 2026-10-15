import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  History,
  Compass,
  ArrowRight,
  ShieldCheck,
  Send,
} from "lucide-react";
import {
  api,
  AILayoutProposalResponse,
  SceneResponseData,
} from "../../services/api";

interface AILayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  currentRevision: number;
  onProposalApplied: (newSceneData: SceneResponseData) => void;
  onPreviewProposal?: (proposal: AILayoutProposalResponse | null) => void;
}

export const AILayoutModal: React.FC<AILayoutModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  currentRevision,
  onProposalApplied,
  onPreviewProposal,
}) => {
  const [roomType, setRoomType] = useState<string>("living_room");
  const [prompt, setPrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentProposal, setCurrentProposal] = useState<AILayoutProposalResponse | null>(null);
  const [proposalsHistory, setProposalsHistory] = useState<AILayoutProposalResponse[]>([]);
  const [activeTab, setActiveTab] = useState<"generate" | "history">("generate");
  const [isPreviewActive, setIsPreviewActive] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && projectId) {
      loadProposals();
    }
  }, [isOpen, projectId]);

  const loadProposals = async () => {
    try {
      const history = await api.listAIProposals(projectId);
      setProposalsHistory(history);
      if (history.length > 0 && !currentProposal) {
        setCurrentProposal(history[0]);
      }
    } catch {
      // Non-critical background fetch
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const proposal = await api.generateAIProposal(projectId, {
        room_type: roomType,
        prompt: prompt.trim() || undefined,
      });
      setCurrentProposal(proposal);
      setProposalsHistory((prev) => [proposal, ...prev]);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to generate layout proposal"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTogglePreview = () => {
    const nextState = !isPreviewActive;
    setIsPreviewActive(nextState);
    if (onPreviewProposal) {
      onPreviewProposal(nextState ? currentProposal : null);
    }
  };

  const handleApply = async () => {
    if (!currentProposal) return;
    setIsApplying(true);
    setErrorMessage(null);
    try {
      const newSceneData = await api.applyAIProposal(
        projectId,
        currentProposal.id,
        currentRevision
      );
      if (onPreviewProposal) onPreviewProposal(null);
      setIsPreviewActive(false);
      onProposalApplied(newSceneData);
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to apply AI proposal"
      );
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/20 text-purple-300 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-lg">AI Layout Assistant</h3>
                <span className="text-xs bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full font-mono">
                  Rev #{currentRevision}
                </span>
              </div>
              <p className="text-xs text-gray-300">{projectName}</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (onPreviewProposal) onPreviewProposal(null);
              onClose();
            }}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 bg-gray-50/70">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab("generate")}
              className={`py-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors ${
                activeTab === "generate"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Layout Generator & Review</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors ${
                activeTab === "history"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <History className="w-4 h-4" />
              <span>Proposal History ({proposalsHistory.length})</span>
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-red-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === "generate" ? (
            <div className="space-y-6">
              {/* Request Parameters Card */}
              <div className="p-5 bg-gradient-to-br from-purple-50/40 to-indigo-50/40 border border-purple-100 rounded-xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Room Archetype
                    </label>
                    <select
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="living_room">Living Room / Lounge</option>
                      <option value="bedroom">Master / Guest Bedroom</option>
                      <option value="home_office">Home Office / Study</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Quick Style Presets
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setPrompt("Modern minimalist with generous open circulation pathways")
                        }
                        className="text-[11px] px-2 py-1 bg-white border border-gray-200 hover:border-purple-300 rounded text-gray-600 transition-colors"
                      >
                        Minimalist
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPrompt("Warm and inviting conversation circle with central coffee table")
                        }
                        className="text-[11px] px-2 py-1 bg-white border border-gray-200 hover:border-purple-300 rounded text-gray-600 transition-colors"
                      >
                        Conversation
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPrompt("Ergonomic focus area with ample book storage and desk light")
                        }
                        className="text-[11px] px-2 py-1 bg-white border border-gray-200 hover:border-purple-300 rounded text-gray-600 transition-colors"
                      >
                        Work & Study
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Design Prompt & Constraints (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. Spacious family room setup, keep entrance corridor clear..."
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium shadow-sm disabled:opacity-50 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isGenerating ? "Generating Proposal..." : "Generate Proposal"}</span>
                  </button>
                </div>
              </div>

              {/* Proposal Inspection & Validation Card */}
              {currentProposal ? (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm space-y-4 p-5 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-sm text-gray-800">
                          Proposed Furniture Layout
                        </h4>
                        <span className="text-[10px] bg-purple-100 text-purple-700 font-mono px-2 py-0.5 rounded-full">
                          Based on Rev #{currentProposal.base_scene_revision}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        {currentProposal.explanation}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {currentProposal.validation_status === "VALID" ? (
                        <span className="inline-flex items-center text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Validated (0 Boundary Clashes)
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                          Needs Adjustment
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Itemized Placement Table */}
                  <div className="border border-gray-100 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-3.5 py-2 text-[11px] font-semibold text-gray-600 grid grid-cols-12 gap-2">
                      <span className="col-span-6">Catalog Item</span>
                      <span className="col-span-3">Coordinates (X, Z)</span>
                      <span className="col-span-3 text-right">Rotation</span>
                    </div>
                    <div className="divide-y divide-gray-100 text-xs">
                      {currentProposal.suggested_objects.map((obj, i) => (
                        <div
                          key={i}
                          className="px-3.5 py-2.5 grid grid-cols-12 gap-2 items-center hover:bg-gray-50/60"
                        >
                          <div className="col-span-6">
                            <p className="font-medium text-gray-800">{obj.item_name}</p>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {obj.dimensions.width_m}m × {obj.dimensions.depth_m}m
                            </span>
                          </div>
                          <div className="col-span-3 font-mono text-gray-600 text-[11px]">
                            ({obj.position.x_m.toFixed(2)}m, {obj.position.z_m.toFixed(2)}m)
                          </div>
                          <div className="col-span-3 text-right font-mono text-gray-600 text-[11px]">
                            {obj.rotation_y_deg.toFixed(0)}°
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Safety & Action Panel */}
                  <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                    <div className="flex items-center text-[11px] text-gray-500">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      <span>Never automatically overwrites your scene. Review before applying.</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {onPreviewProposal && (
                        <button
                          type="button"
                          onClick={handleTogglePreview}
                          className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                            isPreviewActive
                              ? "bg-purple-50 text-purple-700 border-purple-300"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>{isPreviewActive ? "Hide Preview" : "Preview on Canvas"}</span>
                        </button>
                      )}
                      <button
                        onClick={handleApply}
                        disabled={isApplying}
                        className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md disabled:opacity-50 transition-all"
                      >
                        <span>{isApplying ? "Applying Scene..." : "Apply Layout to Scene"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-xl space-y-2">
                  <Compass className="w-8 h-8 mx-auto text-purple-400" />
                  <p className="text-xs font-medium text-gray-700">No layout generated yet</p>
                  <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                    Select your preferred room type and click "Generate Proposal" to get an
                    AI-assisted arrangement.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* History Tab */
            <div className="space-y-3">
              {proposalsHistory.length === 0 ? (
                <p className="text-center py-12 text-xs text-gray-400">
                  No layout proposals generated yet for this project.
                </p>
              ) : (
                proposalsHistory.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setCurrentProposal(p);
                      setActiveTab("generate");
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      currentProposal?.id === p.id
                        ? "border-purple-600 bg-purple-50/40"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-xs text-gray-800">
                          Revision #{p.base_scene_revision} Proposal
                        </span>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono">
                          {p.id.slice(0, 8)}...
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            p.validation_status === "VALID"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {p.validation_status}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">
                        {p.explanation}
                      </p>
                    </div>
                    <span className="text-[10px] text-purple-600 font-medium">Inspect →</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            Canonical Scene Geometry • Meter-level accuracy
          </span>
          <button
            onClick={() => {
              if (onPreviewProposal) onPreviewProposal(null);
              onClose();
            }}
            className="px-4 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
