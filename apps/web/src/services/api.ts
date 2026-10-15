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
};
