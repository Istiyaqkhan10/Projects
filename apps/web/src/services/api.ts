import { CanonicalScene } from "../schemas/scene";
import { CatalogItem } from "../schemas/catalog";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export interface HealthStatus {
  status: string;
  environment: string;
  version: string;
  project_name: string;
}

export interface GeometryValidationResponse {
  is_valid: boolean;
  errors: string[];
}

export interface RoomData {
  id: string;
  project_id: string;
  name: string;
  width_m: number;
  length_m: number;
  height_m: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectData {
  id: string;
  owner_id?: string | null;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
  rooms: RoomData[];
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  room_name?: string;
  room_width_m: number;
  room_length_m: number;
  room_height_m: number;
}

export interface SceneResponseData {
  project_id: string;
  room_id: string;
  revision: number;
  schema_version: number;
  scene: CanonicalScene;
}

export interface EstimateLineItem {
  instance_id: string;
  catalog_item_id: string;
  name: string;
  quantity: number;
  unit_price_paise: number;
  line_total_paise: number;
}

export interface EstimateSnapshot {
  subtotal_paise: number;
  gst_rate_percent: number;
  cgst_paise: number;
  sgst_paise: number;
  tax_paise: number;
  total_paise: number;
  currency: string;
  lines: EstimateLineItem[];
  assumptions: string;
}

export interface EstimateResponse {
  id: string;
  project_id: string;
  scene_revision: number;
  subtotal_paise: number;
  tax_paise: number;
  total_paise: number;
  currency: string;
  assumptions?: string;
  estimate_snapshot: EstimateSnapshot;
  created_at: string;
}

export class ConflictError extends Error {
  status: number = 409;
  currentRevision?: number;

  constructor(message: string, currentRevision?: number) {
    super(message);
    this.name = "ConflictError";
    this.currentRevision = currentRevision;
  }
}

export const api = {
  async getHealth(): Promise<HealthStatus> {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) {
      throw new Error(`Health check failed with status: ${res.status}`);
    }
    return res.json();
  },

  async getCatalog(category?: string, search?: string): Promise<CatalogItem[]> {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    const res = await fetch(`${API_BASE_URL}/catalog?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch catalog: ${res.status}`);
    }
    return res.json();
  },

  async listProjects(): Promise<ProjectData[]> {
    const res = await fetch(`${API_BASE_URL}/projects`);
    if (!res.ok) {
      throw new Error(`Failed to list projects: ${res.status}`);
    }
    return res.json();
  },

  async createProject(payload: CreateProjectPayload): Promise<ProjectData> {
    const res = await fetch(`${API_BASE_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Failed to create project: ${res.status}`);
    }
    return res.json();
  },

  async getProject(projectId: string): Promise<ProjectData> {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}`);
    if (!res.ok) {
      throw new Error(`Failed to get project: ${res.status}`);
    }
    return res.json();
  },

  async getProjectScene(projectId: string): Promise<SceneResponseData> {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/scene`);
    if (!res.ok) {
      throw new Error(`Failed to get project scene: ${res.status}`);
    }
    return res.json();
  },

  async saveProjectScene(
    projectId: string,
    expectedRevision: number,
    scene: CanonicalScene
  ): Promise<SceneResponseData> {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/scene`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expected_revision: expectedRevision,
        scene,
      }),
    });

    if (res.status === 409) {
      const err = await res.json();
      throw new ConflictError(
        err.detail?.message || "Revision conflict detected",
        err.detail?.current_revision
      );
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail?.message || `Failed to save scene: ${res.status}`);
    }

    return res.json();
  },

  async updateRoomDimensions(
    projectId: string,
    roomId: string,
    dimensions: { width_m?: number; length_m?: number; height_m?: number }
  ): Promise<RoomData> {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/rooms/${roomId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dimensions),
    });
    if (!res.ok) {
      throw new Error(`Failed to update room dimensions: ${res.status}`);
    }
    return res.json();
  },

  async validateScene(scene: CanonicalScene): Promise<GeometryValidationResponse> {
    const res = await fetch(`${API_BASE_URL}/scenes/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scene),
    });
    if (!res.ok) {
      throw new Error(`Validation failed with status: ${res.status}`);
    }
    return res.json();
  },

  async createEstimate(projectId: string, sceneRevision?: number): Promise<EstimateResponse> {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/estimates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scene_revision: sceneRevision }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to create estimate: ${res.status}`);
    }
    return res.json();
  },

  async listEstimates(projectId: string): Promise<EstimateResponse[]> {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/estimates`);
    if (!res.ok) {
      throw new Error(`Failed to list estimates: ${res.status}`);
    }
    return res.json();
  },

  async getEstimate(estimateId: string): Promise<EstimateResponse> {
    const res = await fetch(`${API_BASE_URL}/estimates/${estimateId}`);
    if (!res.ok) {
      throw new Error(`Failed to get estimate: ${res.status}`);
    }
    return res.json();
  },
};
