import React, { useState, useEffect } from "react";
import {
  X,
  FileCheck2,
  History,
  Receipt,
  Clock,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Download,
} from "lucide-react";
import { api, EstimateResponse } from "../../services/api";

interface EstimateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  currentRevision: number;
}

export const EstimateModal: React.FC<EstimateModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  currentRevision,
}) => {
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const [currentEstimate, setCurrentEstimate] = useState<EstimateResponse | null>(null);
  const [estimateHistory, setEstimateHistory] = useState<EstimateResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && projectId) {
      loadHistory();
    }
  }, [isOpen, projectId]);

  const loadHistory = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const history = await api.listEstimates(projectId);
      setEstimateHistory(history);
      if (history.length > 0 && !currentEstimate) {
        setCurrentEstimate(history[0]);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to load estimates history");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!projectId) return;
    setIsDownloading(true);
    try {
      const rev = currentEstimate ? currentEstimate.scene_revision : currentRevision;
      await api.downloadProjectReport(projectId, rev);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to download PDF report");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGenerateOfficialSnapshot = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const newEstimate = await api.createEstimate(projectId, currentRevision);
      setCurrentEstimate(newEstimate);
      setEstimateHistory((prev) => [newEstimate, ...prev]);
      setActiveTab("current");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to generate official estimate");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  const formatINR = (paise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(paise / 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-gray-900 via-gray-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-lg">Official Cost Estimate</h3>
                <span className="text-xs bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full font-mono">
                  Rev #{currentRevision}
                </span>
              </div>
              <p className="text-xs text-gray-300">{projectName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 bg-gray-50/70">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab("current")}
              className={`py-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors ${
                activeTab === "current"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Snapshot Details</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors ${
                activeTab === "history"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <History className="w-4 h-4" />
              <span>Estimate History ({estimateHistory.length})</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
              title="Download official PDF report for this design"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>{isDownloading ? "Generating PDF..." : "Export PDF Report"}</span>
            </button>

            <button
              onClick={handleGenerateOfficialSnapshot}
              disabled={isGenerating}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? "Snapshotting..." : "Generate Official Snapshot"}</span>
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {isLoading ? (
            <div className="py-16 text-center text-gray-400">
              <Clock className="w-8 h-8 mx-auto mb-2 animate-spin text-indigo-500" />
              <p className="text-sm">Loading estimates...</p>
            </div>
          ) : activeTab === "current" ? (
            currentEstimate ? (
              <div className="space-y-6">
                {/* Snapshot Meta Card */}
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="text-gray-500 block">Snapshot ID</span>
                    <span className="font-mono text-gray-700 select-all font-semibold">
                      {currentEstimate.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Scene Revision</span>
                    <span className="font-semibold text-gray-800">
                      Revision #{currentEstimate.scene_revision}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Generated On</span>
                    <span className="font-medium text-gray-700">
                      {formatDate(currentEstimate.created_at)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Integrity</span>
                    <span className="inline-flex items-center text-emerald-700 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Immutable Record
                    </span>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 text-xs font-semibold text-gray-700 flex justify-between">
                    <span>Furniture Item & Specification</span>
                    <span>Total (INR)</span>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                    {currentEstimate.estimate_snapshot.lines.length === 0 ? (
                      <p className="p-6 text-center text-xs text-gray-400">
                        No furniture items in this scene revision.
                      </p>
                    ) : (
                      currentEstimate.estimate_snapshot.lines.map((line, idx) => (
                        <div
                          key={line.instance_id || idx}
                          className="px-4 py-3 flex items-center justify-between text-xs hover:bg-gray-50/50"
                        >
                          <div>
                            <p className="font-medium text-gray-800">{line.name}</p>
                            <p className="text-[11px] text-gray-400">
                              Qty: {line.quantity} × {formatINR(line.unit_price_paise)}
                            </p>
                          </div>
                          <span className="font-mono font-semibold text-gray-900">
                            {formatINR(line.line_total_paise)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Pricing Breakdown Summary */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal (Paise-level item rates)</span>
                    <span className="font-mono">{formatINR(currentEstimate.subtotal_paise)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>CGST (9.0% Central GST)</span>
                    <span className="font-mono">
                      {formatINR(currentEstimate.estimate_snapshot.cgst_paise)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>SGST (9.0% State GST)</span>
                    <span className="font-mono">
                      {formatINR(currentEstimate.estimate_snapshot.sgst_paise)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-bold text-gray-900">
                    <span>Total Estimated Cost</span>
                    <span className="font-mono text-indigo-700">
                      {formatINR(currentEstimate.total_paise)}
                    </span>
                  </div>
                </div>

                {/* Transparent Assumptions & Legal Disclaimers */}
                <div className="p-4 bg-amber-50/60 border border-amber-200/70 rounded-xl text-xs space-y-1.5 text-amber-900">
                  <p className="font-semibold flex items-center">
                    <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                    Estimate Assumptions & Disclaimers
                  </p>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    {currentEstimate.assumptions || currentEstimate.estimate_snapshot.assumptions}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 space-y-3">
                <Receipt className="w-12 h-12 mx-auto text-gray-300" />
                <h4 className="font-medium text-gray-700 text-sm">No Official Snapshots Yet</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Click "Generate Official Snapshot" above to lock in a preliminary budget record for
                  Revision #{currentRevision}.
                </p>
              </div>
            )
          ) : (
            /* History Tab */
            <div className="space-y-3">
              {estimateHistory.length === 0 ? (
                <p className="text-center py-12 text-xs text-gray-400">
                  No previous estimate snapshots recorded for this project.
                </p>
              ) : (
                estimateHistory.map((hist) => (
                  <div
                    key={hist.id}
                    onClick={() => {
                      setCurrentEstimate(hist);
                      setActiveTab("current");
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      currentEstimate?.id === hist.id
                        ? "border-indigo-600 bg-indigo-50/40"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-xs text-gray-800">
                          Revision #{hist.scene_revision} Snapshot
                        </span>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono">
                          {hist.id.slice(0, 8)}...
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400 block mt-0.5">
                        {formatDate(hist.created_at)} • {hist.estimate_snapshot.lines.length} items
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold font-mono text-sm text-gray-900 block">
                        {formatINR(hist.total_paise)}
                      </span>
                      <span className="text-[10px] text-indigo-600 font-medium">View Snapshot →</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            Authoritative computation with integer paise precision
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
