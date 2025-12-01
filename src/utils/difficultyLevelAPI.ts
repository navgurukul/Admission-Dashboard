// Base URL from environment variable
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Types for Difficulty Level
export interface DifficultyLevel {
  id: number;
  name: string;
  description?: string;
  color?: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDifficultyLevelData {
  name: string;
  description?: string;
  color?: string;
  status?: boolean;
}

export interface UpdateDifficultyLevelData {
  name?: string;
  description?: string;
  color?: string;
  status?: boolean;
}

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  try {
    const token = localStorage.getItem("authToken");
    return token;
  } catch (error) {
    console.error("Error accessing localStorage:", error);
    return null;
  }
};

// Create headers with authentication
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Enhanced fetch with timeout and error handling
const apiFetch = async (
  endpoint: string,
  options: RequestInit = {},
  timeout = 8000,
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const url = `${BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: getAuthHeaders(),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`,
      );
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw error;
  }
};

// Difficulty Level API Functions
export const difficultyLevelAPI = {
  // Create new difficulty level
  async createDifficultyLevel(
    data: CreateDifficultyLevelData,
  ): Promise<DifficultyLevel> {
    try {
      const validationErrors =
        difficultyLevelUtils.validateDifficultyLevel(data);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(", "));
      }

      return await apiFetch("/difficulty-levels/createDifficultyLevels", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Create difficulty level error:", error);
      throw new Error(error.message || "Failed to create difficulty level");
    }
  },

  // Get all difficulty levels
  async getDifficultyLevels(): Promise<DifficultyLevel[]> {
    try {
      return await apiFetch("/difficulty-levels/getDifficultyLevels");
    } catch (error) {
      console.error("Get difficulty levels error:", error);
      throw new Error(error.message || "Failed to fetch difficulty levels");
    }
  },

  // Get difficulty level by ID
  async getDifficultyLevelById(id: number): Promise<DifficultyLevel> {
    try {
      return await apiFetch(`/difficulty-levels/getDifficultyLevelsById/${id}`);
    } catch (error) {
      console.error("Get difficulty level by ID error:", error);
      throw new Error(error.message || "Failed to fetch difficulty level");
    }
  },

  // Update difficulty level
  async updateDifficultyLevel(
    id: number,
    data: UpdateDifficultyLevelData,
  ): Promise<DifficultyLevel> {
    try {
      if (data.name) {
        const validationErrors = difficultyLevelUtils.validateDifficultyLevel({
          name: data.name,
          description: data.description || "",
        });
        if (validationErrors.length > 0) {
          throw new Error(validationErrors.join(", "));
        }
      }

      return await apiFetch(`/difficulty-levels/updateDifficultyLevels/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Update difficulty level error:", error);
      throw new Error(error.message || "Failed to update difficulty level");
    }
  },

  // Delete difficulty level
  async deleteDifficultyLevel(id: number): Promise<void> {
    try {
      await apiFetch(`/difficulty-levels/deleteDifficultyLevels/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Delete difficulty level error:", error);
      throw new Error(error.message || "Failed to delete difficulty level");
    }
  },

  // Get active difficulty levels only
  async getActiveDifficultyLevels(): Promise<DifficultyLevel[]> {
    try {
      const allLevels = await this.getDifficultyLevels();
      return allLevels.filter((level) => level.status);
    } catch (error) {
      console.error("Get active difficulty levels error:", error);
      throw new Error(
        error.message || "Failed to fetch active difficulty levels",
      );
    }
  },

  // Toggle difficulty level status
  async toggleDifficultyLevelStatus(
    id: number,
    currentStatus: boolean,
  ): Promise<DifficultyLevel> {
    return this.updateDifficultyLevel(id, { status: !currentStatus });
  },
};

// Utility functions for difficulty levels
export const difficultyLevelUtils = {
  validateDifficultyLevelName: (name: string): boolean => {
    return name.length >= 2 && name.length <= 50;
  },

  getDifficultyColor(name: string): string {
    const colors: { [key: string]: string } = {
      easy: "bg-green-100 text-green-800 border-green-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      hard: "bg-red-100 text-red-800 border-red-200",
      beginner: "bg-blue-100 text-blue-800 border-blue-200",
      intermediate: "bg-orange-100 text-orange-800 border-orange-200",
      advanced: "bg-purple-100 text-purple-800 border-purple-200",
      expert: "bg-gray-100 text-gray-800 border-gray-200",
    };

    return (
      colors[name.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200"
    );
  },

  getDifficultyLabel(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  },

  validateDifficultyLevel(data: CreateDifficultyLevelData): string[] {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push("Name is required");
    } else if (!this.validateDifficultyLevelName(data.name)) {
      errors.push("Name must be between 2-50 characters");
    }

    if (data.description && data.description.length > 500) {
      errors.push("Description must be less than 500 characters");
    }

    return errors;
  },
};
