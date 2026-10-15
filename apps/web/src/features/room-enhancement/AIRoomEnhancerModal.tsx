import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  Camera,
  Sparkles,
  Palette,
  Sun,
  Layers,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
  Info,
} from "lucide-react";
import {
  api,
  RoomEnhancementResponse,
  SceneResponseData,
  ConflictError,
} from "../../services/api";

interface AIRoomEnhancerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  currentRevision: number;
  onEnhancementApplied: (newSceneData: SceneResponseData) => void;
}

// Lightweight 1-pixel or SVG base64 test images for instant sample selection
const SAMPLE_PRESET_IMAGES: { id: string; label: string; desc: string; base64: string }[] = [
  {
    id: "living_warm",
    label: "Warm Living Room",
    desc: "Neutral beige room with natural afternoon lighting",
    base64:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAALUlEQVR42u3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8GaoAAABjH7pTAAAAABJRU5ErkJggg==",
  },
  {
    id: "bedroom_dim",
    label: "Dim Bedroom",
    desc: "Low-light evening bedroom with warm ambient glow",
    base64:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAALUlEQVR42u3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8GaoAAABjH7pTAAAAABJRU5ErkJggg==",
  },
  {
    id: "studio_bright",
    label: "Bright Studio",
    desc: "High-exposure sunlit urban apartment interior",
    base64:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAALUlEQVR42u3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8GaoAAABjH7pTAAAAABJRU5ErkJggg==",
  },
];

const STYLE_OPTIONS = [
  {
    id: "Warm Contemporary",
    name: "Warm Contemporary",
    desc: "Rich teak wood, warm linen walls, terracotta focal accent & 3000K soft white lighting.",
    accentColor: "#C2410C",
  },
  {
    id: "Japandi Serenity",
    name: "Japandi Serenity",
    desc: "Light oak parquet, muted sage walls, minimalist lines & 3500K warm neutral glow.",
    accentColor: "#4D7C0F",
  },
  {
    id: "Coastal Modern",
    name: "Coastal Modern",
    desc: "Carrara marble, breezy off-white walls, deep navy accent & 4000K crisp daylight.",
    accentColor: "#1E3A8A",
  },
  {
    id: "Indian Heritage Luxe",
    name: "Indian Heritage Luxe",
    desc: "Teak & marble, brass accents, marigold ochre focal wall & 2800K royal amber glow.",
    accentColor: "#D97706",
  },
  {
    id: "Minimalist Urban",
    name: "Minimalist Urban",
    desc: "Polished concrete, greige walls, dark charcoal focal wall & 4200K pure daylight.",
    accentColor: "#334155",
  },
];

export const AIRoomEnhancerModal: React.FC<AIRoomEnhancerModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  currentRevision,
  onEnhancementApplied,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [stylePreference, setStylePreference] = useState<string>("Warm Contemporary");
  const [roomType, setRoomType] = useState<string>("living_room");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [enhancementResult, setEnhancementResult] = useState<RoomEnhancementResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, or WebP).");
      return;
    }

    setSelectedFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSelectedImage(reader.result);
      }
    };
    reader.onerror = () => {
      setError("Failed to read the uploaded image.");
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: typeof SAMPLE_PRESET_IMAGES[0]) => {
    setSelectedImage(sample.base64);
    setSelectedFileName(`${sample.label}.png`);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError("Please upload a room image or select a sample preset first.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await api.enhanceRoomFromImage(projectId, {
        image_base64: selectedImage,
        style_preference: stylePreference,
        room_type: roomType,
        preserve_furniture: false,
      });
      setEnhancementResult(response);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to analyze room photo.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApply = async (applyFurniture: boolean) => {
    if (!enhancementResult) return;

    setIsApplying(true);
    setError(null);

    try {
      const newSceneData = await api.applyRoomEnhancement(projectId, {
        expected_revision: currentRevision,
        apply_colors_and_lighting: true,
        apply_furniture: applyFurniture,
        styling_payload: enhancementResult.styling,
        suggested_objects: enhancementResult.suggested_furniture,
      });

      onEnhancementApplied(newSceneData);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ConflictError) {
        setError(
          `Scene revision conflict! The room was modified in another session (Rev #${err.currentRevision}). Please refresh and reapply.`
        );
      } else {
        setError(err instanceof Error ? err.message : "Failed to apply enhancement to scene.");
      }
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50/60 via-amber-50/40 to-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-gray-900">
                  AI Photo Room Enhancer & Makeover
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-orange-100 text-orange-800 rounded-full font-bold">
                  Vision + Styling AI
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Enhance colors, Kelvin lighting architecture, floor finishes & interior layout for {projectName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!enhancementResult ? (
            /* Upload & Style Selection Step */
            <div className="space-y-6">
              {/* Photo Upload Zone */}
              <div>
                <label className="text-xs font-bold text-gray-800 block mb-2 flex items-center">
                  <Upload className="w-3.5 h-3.5 mr-1.5 text-orange-600" />
                  1. Upload Room Photo or Choose Sample
                </label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    selectedImage
                      ? "border-orange-500 bg-orange-50/20"
                      : "border-gray-300 hover:border-orange-400 hover:bg-gray-50/50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {selectedImage ? (
                    <div className="flex items-center justify-center space-x-4">
                      <img
                        src={selectedImage}
                        alt="Uploaded space preview"
                        className="w-24 h-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                      />
                      <div className="text-left space-y-1">
                        <span className="text-xs font-semibold text-gray-900 block">
                          {selectedFileName || "Room Photo Loaded"}
                        </span>
                        <span className="text-[11px] text-emerald-600 font-medium flex items-center">
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Ready for AI enhancement
                        </span>
                        <p className="text-[11px] text-gray-500">
                          Click to select a different photo
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div className="text-xs text-gray-700">
                        <span className="font-semibold text-orange-600">Click to upload photo</span>{" "}
                        or drag and drop
                      </div>
                      <p className="text-[10px] text-gray-400">
                        Supports JPEG, PNG, or WebP photos of living rooms, bedrooms, or studios
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Sample Presets */}
                <div className="mt-3 flex items-center space-x-2">
                  <span className="text-[11px] text-gray-400 font-medium">Or try sample:</span>
                  {SAMPLE_PRESET_IMAGES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectSample(s)}
                      className="px-2.5 py-1 text-[11px] bg-gray-100 hover:bg-orange-50 hover:text-orange-700 rounded-lg text-gray-600 border border-gray-200 transition-colors"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Room Type & Style Preferences */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-800 block mb-1.5">
                    Room Type
                  </label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="living_room">Living Room</option>
                    <option value="bedroom">Master Bedroom / Guest Room</option>
                    <option value="home_office">Home Office / Study</option>
                    <option value="dining_room">Dining Space</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-800 block mb-1.5">
                    Target Style Archetype
                  </label>
                  <select
                    value={stylePreference}
                    onChange={(e) => setStylePreference(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:ring-1 focus:ring-orange-500"
                  >
                    {STYLE_OPTIONS.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Style Cards */}
              <div>
                <label className="text-xs font-bold text-gray-800 block mb-2">
                  2. Choose Design Theme
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {STYLE_OPTIONS.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => setStylePreference(st.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        stylePreference === st.id
                          ? "border-orange-500 bg-orange-50/40 ring-1 ring-orange-400"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-900">{st.name}</span>
                        <span
                          className="w-3 h-3 rounded-full border border-black/10 shadow-2xs"
                          style={{ backgroundColor: st.accentColor }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">
                        {st.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Trigger */}
              <div className="pt-2">
                <button
                  onClick={handleAnalyze}
                  disabled={!selectedImage || isAnalyzing}
                  className="w-full py-3 bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing Spatial Luminance & Generating Makeover...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Analyze Photo & Generate Complete Room Makeover</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Enhancement Results & Proposal Inspection Step */
            <div className="space-y-6">
              {/* Top Banner with Theme Title */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 p-4 rounded-xl flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-orange-600 tracking-wider">
                    Synthesized Interior Concept
                  </span>
                  <h3 className="text-sm font-bold text-gray-900">
                    {enhancementResult.theme_title}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
                    {enhancementResult.design_rationale}
                  </p>
                </div>
                <button
                  onClick={() => setEnhancementResult(null)}
                  className="text-xs text-orange-600 hover:text-orange-700 font-semibold underline flex-shrink-0 ml-4"
                >
                  Upload Another Photo
                </button>
              </div>

              {/* Visualized Concept vs. Space Photo Side-by-Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Uploaded Photo Preview */}
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex flex-col">
                  <div className="px-3 py-1.5 bg-gray-100 border-b border-gray-200 text-[11px] font-semibold text-gray-700 flex items-center justify-between">
                    <span>Original Room Photo</span>
                    <span className="text-[10px] font-mono text-gray-500">Source Input</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center p-2 min-h-[220px]">
                    {selectedImage ? (
                      <img
                        src={selectedImage}
                        alt="Original Room"
                        className="max-h-[240px] w-auto object-contain rounded-lg"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">Photo preview</span>
                    )}
                  </div>
                </div>

                {/* AI Concept SVG Visualization */}
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white flex flex-col">
                  <div className="px-3 py-1.5 bg-gray-100 border-b border-gray-200 text-[11px] font-semibold text-gray-700 flex items-center justify-between">
                    <span>AI Enhanced Concept Visualizer</span>
                    <span className="text-[10px] font-mono text-orange-600 font-bold">2D Ambiance SVG</span>
                  </div>
                  <div
                    className="flex-1 flex items-center justify-center p-2 min-h-[220px] bg-slate-900"
                    dangerouslySetInnerHTML={{ __html: enhancementResult.enhanced_visualization_svg }}
                  />
                </div>
              </div>

              {/* Spatial & Luminance Analysis Feedback */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-gray-800 flex items-center">
                  <Info className="w-3.5 h-3.5 mr-1 text-orange-600" />
                  Spatial & Lighting Analysis
                </span>
                <p className="text-gray-600 leading-relaxed text-[11px]">
                  {enhancementResult.spatial_analysis}
                </p>
              </div>

              {/* Specification Grid: Palette, Lighting & Flooring */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Color Palette */}
                <div className="p-3 border border-gray-200 rounded-xl bg-white space-y-2">
                  <span className="text-xs font-bold text-gray-900 flex items-center">
                    <Palette className="w-3.5 h-3.5 mr-1.5 text-orange-600" />
                    Color Palette
                  </span>
                  <div className="space-y-1.5">
                    {enhancementResult.color_palette.map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-gray-300"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="text-gray-700">{c.role}: {c.name}</span>
                        </div>
                        <span className="font-mono text-gray-400 text-[10px]">{c.hex}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lighting Architecture */}
                <div className="p-3 border border-gray-200 rounded-xl bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 flex items-center">
                      <Sun className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                      Lighting Architecture
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 px-1 rounded">
                      {enhancementResult.lighting.temperature_k}K
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-600 space-y-1">
                    <div className="font-medium text-gray-800">
                      {enhancementResult.lighting.ambiance_name}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      Fixtures: {enhancementResult.lighting.recommended_fixtures.join(", ")}
                    </div>
                  </div>
                </div>

                {/* Floor Finish */}
                <div className="p-3 border border-gray-200 rounded-xl bg-white space-y-2">
                  <span className="text-xs font-bold text-gray-900 flex items-center">
                    <Layers className="w-3.5 h-3.5 mr-1.5 text-orange-600" />
                    Floor Finish
                  </span>
                  <div className="text-[11px] text-gray-700">
                    <div className="font-semibold text-gray-900">{enhancementResult.floor_name}</div>
                    <div className="text-[10px] font-mono text-gray-400 uppercase mt-0.5">
                      {enhancementResult.floor_material}
                    </div>
                  </div>
                </div>
              </div>

              {/* Curated Furniture List */}
              {enhancementResult.suggested_furniture.length > 0 && (
                <div className="border border-gray-200 rounded-xl p-3 bg-white">
                  <span className="text-xs font-bold text-gray-900 block mb-2">
                    Curated Furniture Layout ({enhancementResult.suggested_furniture.length} items)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {enhancementResult.suggested_furniture.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-[10px] space-y-0.5"
                      >
                        <div className="font-semibold text-gray-800 truncate">{item.item_name}</div>
                        <div className="text-gray-400 font-mono">
                          X:{item.position.x_m}m Z:{item.position.z_m}m • {item.rotation_y_deg}°
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 1-Click Application Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleApply(false)}
                  disabled={isApplying}
                  className="flex-1 py-2.5 px-4 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-xs transition-all disabled:opacity-50"
                  title="Applies the color palette, accent wall, floor finish, and Kelvin lighting while preserving your existing furniture"
                >
                  <Palette className="w-3.5 h-3.5 text-orange-600" />
                  <span>Apply Colors & Lighting Only (Preserve Furniture)</span>
                </button>

                <button
                  onClick={() => handleApply(true)}
                  disabled={isApplying}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md transition-all disabled:opacity-50"
                  title="Applies the complete room makeover including colors, lighting, floor, and curated furniture layout"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Applying Makeover...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Apply Full Interior Makeover</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
