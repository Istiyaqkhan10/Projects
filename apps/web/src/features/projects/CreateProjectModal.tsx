import React, { useState } from "react";
import { X, FolderPlus } from "lucide-react";
import { CreateProjectPayload } from "../../services/api";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: CreateProjectPayload) => Promise<void>;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [roomName, setRoomName] = useState("Living Room");
  const [widthM, setWidthM] = useState(5.0);
  const [lengthM, setLengthM] = useState(4.0);
  const [heightM, setHeightM] = useState(2.8);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a project name.");
      return;
    }
    if (widthM <= 0 || lengthM <= 0 || heightM <= 0) {
      setError("Room dimensions must be strictly positive.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
        room_name: roomName.trim() || "Living Room",
        room_width_m: widthM,
        room_length_m: lengthM,
        room_height_m: heightM,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create project";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center space-x-2">
            <FolderPlus className="w-5 h-5 text-orange-600" />
            <h2 className="text-sm font-bold text-gray-900">Create New Project</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Project Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Pune 3BHK Living Room"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Brief description of the space..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Room Name
            </label>
            <input
              type="text"
              placeholder="e.g. Master Bedroom, Living Room"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="pt-2 border-t border-gray-100">
            <span className="text-xs font-bold text-gray-800 block mb-2">
              Initial Room Dimensions (Meters)
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-gray-500 block mb-1">Width (m)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="50"
                  value={widthM}
                  onChange={(e) => setWidthM(parseFloat(e.target.value) || 1)}
                  className="w-full px-2 py-1.5 text-xs font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 block mb-1">Length (m)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="50"
                  value={lengthM}
                  onChange={(e) => setLengthM(parseFloat(e.target.value) || 1)}
                  className="w-full px-2 py-1.5 text-xs font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 block mb-1">Height (m)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="15"
                  value={heightM}
                  onChange={(e) => setHeightM(parseFloat(e.target.value) || 1)}
                  className="w-full px-2 py-1.5 text-xs font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
