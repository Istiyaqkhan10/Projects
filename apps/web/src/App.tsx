import React, { useState, useEffect } from "react";
import { Navbar, ViewMode } from "./components/Navbar";
import { Room2DCanvas } from "./features/room-editor/Room2DCanvas";
import { Room3DViewport } from "./features/room-editor/Room3DViewport";
import { FurnitureCatalogDrawer } from "./features/furniture-catalog/FurnitureCatalogDrawer";
import { InspectorPanel } from "./features/room-editor/InspectorPanel";
import { BudgetSummaryDock } from "./features/budget/BudgetSummaryDock";
import { CanonicalScene, SceneObject } from "./schemas/scene";
import { CatalogItem } from "./schemas/catalog";
import { api } from "./services/api";

// Initial canonical scene fixture
import defaultSceneFixture from "../../../packages/shared-fixtures/scene-examples/valid_living_room.json";
import sampleCatalogFixture from "../../../packages/shared-fixtures/validation-cases/sample_catalog_items.json";

export const App: React.FC = () => {
  const [scene, setScene] = useState<CanonicalScene>(defaultSceneFixture as CanonicalScene);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>(sampleCatalogFixture as CatalogItem[]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);

  // Check backend health & attempt to load live catalog on mount
  useEffect(() => {
    api
      .getHealth()
      .then(() => {
        setApiHealthy(true);
        return api.getCatalog();
      })
      .then((items) => {
        if (items && items.length > 0) {
          setCatalogItems(items);
        }
      })
      .catch(() => {
        setApiHealthy(false);
      });
  }, []);

  const catalogMap = new Map<string, CatalogItem>(
    catalogItems.map((item) => [item.id, item])
  );

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

    setScene((prev) => ({
      ...prev,
      objects: [...prev.objects, newObj],
    }));
    setSelectedInstanceId(newInstanceId);
  };

  const handleUpdateObject = (updated: SceneObject) => {
    setScene((prev) => ({
      ...prev,
      objects: prev.objects.map((o) =>
        o.instance_id === updated.instance_id ? updated : o
      ),
    }));
  };

  const handleRemoveObject = (instanceId: string) => {
    setScene((prev) => ({
      ...prev,
      objects: prev.objects.filter((o) => o.instance_id !== instanceId),
    }));
    if (selectedInstanceId === instanceId) {
      setSelectedInstanceId(null);
    }
  };

  const handleUpdateRoomDimensions = (width_m: number, length_m: number, height_m: number) => {
    setScene((prev) => ({
      ...prev,
      room: {
        width_m,
        length_m,
        height_m,
      },
    }));
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-100 overflow-hidden">
      {/* Top Navigation */}
      <Navbar
        projectName="Living Room Layout"
        revision={1}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        apiHealthy={apiHealthy}
      />

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
        />
      </div>

      {/* Bottom Budget Estimation Dock */}
      <BudgetSummaryDock objects={scene.objects} catalogMap={catalogMap} />
    </div>
  );
};

export default App;
