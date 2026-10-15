import React, { useState, useEffect, useCallback } from "react";
import { Navbar, ViewMode, SaveStatus } from "./components/Navbar";
import { Room2DCanvas } from "./features/room-editor/Room2DCanvas";
import { Room3DViewport } from "./features/room-editor/Room3DViewport";
import { FurnitureCatalogDrawer } from "./features/furniture-catalog/FurnitureCatalogDrawer";
import { InspectorPanel } from "./features/room-editor/InspectorPanel";
import { BudgetSummaryDock } from "./features/budget/BudgetSummaryDock";
import { EstimateModal } from "./features/budget/EstimateModal";
import { AILayoutModal } from "./features/ai-layout/AILayoutModal";
import { AIRoomEnhancerModal } from "./features/room-enhancement/AIRoomEnhancerModal";
import { CreateProjectModal } from "./features/projects/CreateProjectModal";
import { CanonicalScene, RoomStyling, SceneObject } from "./schemas/scene";
import { CatalogItem } from "./schemas/catalog";
import { api, ProjectData, CreateProjectPayload, ConflictError } from "./services/api";

// Fallback initial canonical scene fixture
import defaultSceneFixture from "../../../packages/shared-fixtures/scene-examples/valid_living_room.json";
import sampleCatalogFixture from "../../../packages/shared-fixtures/validation-cases/sample_catalog_items.json";

export const App: React.FC = () => {
  const [scene, setScene] = useState<CanonicalScene>(defaultSceneFixture as CanonicalScene);
  const [revision, setRevision] = useState<number>(1);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>(sampleCatalogFixture as CatalogItem[]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);

  // Undo/Redo History
  const [history, setHistory] = useState<CanonicalScene[]>([defaultSceneFixture as CanonicalScene]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Project Management States
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);
  const [isAILayoutModalOpen, setIsAILayoutModalOpen] = useState(false);
  const [isAIRoomEnhancerModalOpen, setIsAIRoomEnhancerModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Push new state to undo/redo history
  const pushSceneState = useCallback(
    (newScene: CanonicalScene) => {
      setScene(newScene);
      setSaveStatus("unsaved");

      setHistory((prev) => {
        const upToCurrent = prev.slice(0, historyIndex + 1);
        const nextHistory = [...upToCurrent, newScene];
        // Cap history to 50 states
        if (nextHistory.length > 50) nextHistory.shift();
        return nextHistory;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 49));
    },
    [historyIndex]
  );

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    const targetIndex = historyIndex - 1;
    const targetScene = history[targetIndex];
    setHistoryIndex(targetIndex);
    setScene(targetScene);
    setSaveStatus("unsaved");
  }, [canUndo, history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    const targetIndex = historyIndex + 1;
    const targetScene = history[targetIndex];
    setHistoryIndex(targetIndex);
    setScene(targetScene);
    setSaveStatus("unsaved");
  }, [canRedo, history, historyIndex]);

  // Global Ctrl+Z / Ctrl+Y shortcuts
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, [handleUndo, handleRedo]);

  // Load project list & catalog on mount
  const refreshProjects = useCallback(async () => {
    try {
      const list = await api.listProjects();
      setProjects(list);
      return list;
    } catch {
      return [];
    }
  }, []);

  const handleSelectProject = useCallback(async (projId: string) => {
    setActiveProjectId(projId);
    setConflictMessage(null);
    setValidationError(null);
    try {
      const res = await api.getProjectScene(projId);
      setScene(res.scene);
      setRevision(res.revision);
      setHistory([res.scene]);
      setHistoryIndex(0);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("saved");
    }
  }, []);

  useEffect(() => {
    api
      .getHealth()
      .then(async () => {
        setApiHealthy(true);

        // Load catalog items from API
        api.getCatalog().then((items) => {
          if (items && items.length > 0) setCatalogItems(items);
        }).catch(() => {});

        // Load projects from API
        const list = await refreshProjects();
        if (list.length > 0) {
          handleSelectProject(list[0].id);
        } else {
          try {
            const initialProj = await api.createProject({
              name: "Living Room Design",
              description: "Initial starter room project",
              room_name: "Living Room",
              room_width_m: 5.0,
              room_length_m: 4.0,
              room_height_m: 2.8,
            });
            setProjects([initialProj]);
            handleSelectProject(initialProj.id);
          } catch {
            // Standalone mode
          }
        }
      })
      .catch(() => {
        setApiHealthy(false);
      });
  }, [refreshProjects, handleSelectProject]);

  const handleCreateProject = async (payload: CreateProjectPayload) => {
    const newProj = await api.createProject(payload);
    await refreshProjects();
    await handleSelectProject(newProj.id);
  };

  const handleSaveScene = async () => {
    if (!activeProjectId) return;
    setSaveStatus("saving");
    setConflictMessage(null);
    setValidationError(null);

    try {
      const res = await api.saveProjectScene(activeProjectId, revision, scene);
      setScene(res.scene);
      setRevision(res.revision);
      setSaveStatus("saved");
    } catch (err: unknown) {
      if (err instanceof ConflictError) {
        setSaveStatus("conflict");
        setConflictMessage(
          `Revision conflict: Server is at revision #${err.currentRevision}, but local was #${revision}. Please reload scene.`
        );
      } else {
        setSaveStatus("unsaved");
        const msg = err instanceof Error ? err.message : "Failed to save scene.";
        setValidationError(msg);
      }
    }
  };

  const catalogMap = new Map<string, CatalogItem>(
    catalogItems.map((item) => [item.id, item])
  );

  const activeProject = projects.find((p) => p.id === activeProjectId);

  const handleAddFurniture = (item: CatalogItem) => {
    const newInstanceId = `inst-${item.id}-${Date.now().toString().slice(-4)}`;
    const newObj: SceneObject = {
      instance_id: newInstanceId,
      catalog_item_id: item.id,
      position: {
        x_m: parseFloat((scene.room.width_m / 2).toFixed(2)),
        y_m: 0.0,
        z_m: parseFloat((scene.room.length_m / 2).toFixed(2)),
      },
      rotation_y_deg: 0,
      dimensions: {
        width_m: item.width_m,
        depth_m: item.depth_m,
        height_m: item.height_m,
      },
    };

    pushSceneState({
      ...scene,
      objects: [...scene.objects, newObj],
    });
    setSelectedInstanceId(newInstanceId);
  };

  const handleUpdateObject = (updated: SceneObject) => {
    pushSceneState({
      ...scene,
      objects: scene.objects.map((o) =>
        o.instance_id === updated.instance_id ? updated : o
      ),
    });
  };

  const handleRemoveObject = (instanceId: string) => {
    pushSceneState({
      ...scene,
      objects: scene.objects.filter((o) => o.instance_id !== instanceId),
    });
    if (selectedInstanceId === instanceId) {
      setSelectedInstanceId(null);
    }
  };

  const handleUpdateRoomDimensions = async (
    width_m: number,
    length_m: number,
    height_m: number
  ) => {
    pushSceneState({
      ...scene,
      room: { width_m, length_m, height_m },
    });

    if (activeProjectId && activeProject?.rooms?.[0]?.id) {
      try {
        await api.updateRoomDimensions(activeProjectId, activeProject.rooms[0].id, {
          width_m,
          length_m,
          height_m,
        });
      } catch {
        // Continue locally
      }
    }
  };

  const handleUpdateStyling = (styling: RoomStyling) => {
    pushSceneState({
      ...scene,
      styling,
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-100 overflow-hidden">
      {/* Top Navigation */}
      <Navbar
        projectName={activeProject ? activeProject.name : "Living Room Layout"}
        revision={revision}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        apiHealthy={apiHealthy}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        saveStatus={saveStatus}
        onSaveScene={handleSaveScene}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenAIRoomEnhancerModal={() => {
          if (!activeProjectId) {
            alert("Please create or select a project before using AI Photo Makeover.");
            return;
          }
          setIsAIRoomEnhancerModalOpen(true);
        }}
        onOpenAILayoutModal={() => {
          if (!activeProjectId) {
            alert("Please create or select a project before using AI Layout proposals.");
            return;
          }
          setIsAILayoutModalOpen(true);
        }}
        onExportPDF={async () => {
          if (!activeProjectId) {
            alert("Please create or select a project before exporting a PDF report.");
            return;
          }
          try {
            await api.downloadProjectReport(activeProjectId, revision);
          } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to download PDF report");
          }
        }}
      />

      {/* Conflict or Validation Banner */}
      {conflictMessage && (
        <div className="bg-amber-500 text-white px-6 py-2 text-xs flex items-center justify-between shadow-sm z-30">
          <span>⚠️ {conflictMessage}</span>
          <button
            onClick={() => activeProjectId && handleSelectProject(activeProjectId)}
            className="px-2 py-0.5 bg-amber-700 hover:bg-amber-800 rounded font-semibold text-[11px]"
          >
            Reload Server Scene
          </button>
        </div>
      )}

      {validationError && (
        <div className="bg-rose-600 text-white px-6 py-2 text-xs flex items-center justify-between shadow-sm z-30">
          <span>❌ {validationError}</span>
          <button
            onClick={() => setValidationError(null)}
            className="text-[11px] underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Furniture Catalog */}
        <FurnitureCatalogDrawer
          items={catalogItems}
          onAddFurniture={handleAddFurniture}
        />

        {/* Center Viewport Canvas (2D / 3D / Split) */}
        <main className="flex-1 flex overflow-hidden bg-gray-50">
          {(viewMode === "2d" || viewMode === "split") && (
            <div className={`h-full ${viewMode === "split" ? "w-1/2 border-r border-gray-200" : "w-full"}`}>
              <Room2DCanvas
                scene={scene}
                selectedInstanceId={selectedInstanceId}
                onSelectObject={setSelectedInstanceId}
                onUpdateObject={handleUpdateObject}
                onRemoveObject={handleRemoveObject}
              />
            </div>
          )}

          {(viewMode === "3d" || viewMode === "split") && (
            <div className={`h-full ${viewMode === "split" ? "w-1/2" : "w-full"}`}>
              <Room3DViewport
                scene={scene}
                selectedInstanceId={selectedInstanceId}
                onSelectObject={setSelectedInstanceId}
              />
            </div>
          )}
        </main>

        {/* Right Inspector & Room Dimensions Panel */}
        <InspectorPanel
          scene={scene}
          selectedInstanceId={selectedInstanceId}
          onUpdateObject={handleUpdateObject}
          onRemoveObject={handleRemoveObject}
          onUpdateRoomDimensions={handleUpdateRoomDimensions}
          onUpdateStyling={handleUpdateStyling}
          onOpenAIRoomEnhancer={() => {
            if (!activeProjectId) {
              alert("Please create or select a project before using AI Photo Makeover.");
              return;
            }
            setIsAIRoomEnhancerModalOpen(true);
          }}
        />
      </div>

      {/* Bottom Budget Estimation Dock */}
      <BudgetSummaryDock
        objects={scene.objects}
        catalogMap={catalogMap}
        onOpenOfficialEstimate={() => {
          if (!activeProjectId) {
            alert("Please create or select a project before generating an official estimate snapshot.");
            return;
          }
          setIsEstimateModalOpen(true);
        }}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateProject}
      />

      {/* Official Estimate & History Modal */}
      {activeProjectId && (
        <EstimateModal
          isOpen={isEstimateModalOpen}
          onClose={() => setIsEstimateModalOpen(false)}
          projectId={activeProjectId}
          projectName={projects.find((p) => p.id === activeProjectId)?.name || "Current Project"}
          currentRevision={revision}
        />
      )}

      {/* AI Layout Assistant Modal */}
      {activeProjectId && (
        <AILayoutModal
          isOpen={isAILayoutModalOpen}
          onClose={() => setIsAILayoutModalOpen(false)}
          projectId={activeProjectId}
          projectName={projects.find((p) => p.id === activeProjectId)?.name || "Current Project"}
          currentRevision={revision}
          onProposalApplied={(newSceneData) => {
            setScene(newSceneData.scene);
            setRevision(newSceneData.revision);
            pushSceneState(newSceneData.scene);
            setSaveStatus("saved");
          }}
        />
      )}

      {/* AI Photo Room Enhancer & Makeover Modal */}
      {activeProjectId && (
        <AIRoomEnhancerModal
          isOpen={isAIRoomEnhancerModalOpen}
          onClose={() => setIsAIRoomEnhancerModalOpen(false)}
          projectId={activeProjectId}
          projectName={projects.find((p) => p.id === activeProjectId)?.name || "Current Project"}
          currentRevision={revision}
          onEnhancementApplied={(newSceneData) => {
            setScene(newSceneData.scene);
            setRevision(newSceneData.revision);
            pushSceneState(newSceneData.scene);
            setSaveStatus("saved");
          }}
        />
      )}
    </div>
  );
};

export default App;
