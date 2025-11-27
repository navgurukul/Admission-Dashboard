import { useState, useEffect, useCallback } from "react";
import {
  difficultyLevelAPI,
  difficultyLevelUtils,
  type DifficultyLevel,
  type CreateDifficultyLevelData,
  type UpdateDifficultyLevelData,
} from "@/utils/difficultyLevelAPI";
import { useToast } from "@/hooks/use-toast";

export function useDifficultyLevels() {
  const [difficultyLevels, setDifficultyLevels] = useState<DifficultyLevel[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel | null>(
    null,
  );

  const { toast } = useToast();

  // Fetch all difficulty levels
  const fetchDifficultyLevels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const levels = await difficultyLevelAPI.getDifficultyLevels();
      setDifficultyLevels(levels);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch difficulty levels";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch active difficulty levels only
  const fetchActiveDifficultyLevels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const activeLevels = await difficultyLevelAPI.getActiveDifficultyLevels();
      setDifficultyLevels(activeLevels);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch active difficulty levels";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Create new difficulty level
  const createDifficultyLevel = useCallback(
    async (data: CreateDifficultyLevelData) => {
      try {
        setLoading(true);
        setError(null);

        // Validate data
        if (!difficultyLevelUtils.validateDifficultyLevelName(data.name)) {
          throw new Error(
            "Difficulty level name must be between 2 and 50 characters",
          );
        }

        const newLevel = await difficultyLevelAPI.createDifficultyLevel(data);

        setDifficultyLevels((prev) => [...prev, newLevel]);

        toast({
          title: "Success",
          description: "Difficulty level created successfully",
        });

        return newLevel;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to create difficulty level";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  // Update difficulty level
  const updateDifficultyLevel = useCallback(
    async (id: number, data: UpdateDifficultyLevelData) => {
      try {
        setLoading(true);
        setError(null);

        // Validate data if name is being updated
        if (
          data.name &&
          !difficultyLevelUtils.validateDifficultyLevelName(data.name)
        ) {
          throw new Error(
            "Difficulty level name must be between 2 and 50 characters",
          );
        }

        const updatedLevel = await difficultyLevelAPI.updateDifficultyLevel(
          id,
          data,
        );

        setDifficultyLevels((prev) =>
          prev.map((level) => (level.id === id ? updatedLevel : level)),
        );

        toast({
          title: "Success",
          description: "Difficulty level updated successfully",
        });

        return updatedLevel;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to update difficulty level";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  // Delete difficulty level
  const deleteDifficultyLevel = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        setError(null);

        await difficultyLevelAPI.deleteDifficultyLevel(id);

        setDifficultyLevels((prev) => prev.filter((level) => level.id !== id));

        toast({
          title: "Success",
          description: "Difficulty level deleted successfully",
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to delete difficulty level";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  // Toggle difficulty level status
  const toggleDifficultyLevelStatus = useCallback(
    async (id: number, currentStatus: boolean) => {
      try {
        setLoading(true);
        setError(null);

        const updatedLevel =
          await difficultyLevelAPI.toggleDifficultyLevelStatus(
            id,
            currentStatus,
          );

        setDifficultyLevels((prev) =>
          prev.map((level) => (level.id === id ? updatedLevel : level)),
        );

        const statusText = updatedLevel.status ? "activated" : "deactivated";
        toast({
          title: "Success",
          description: `Difficulty level ${statusText} successfully`,
        });

        return updatedLevel;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to toggle difficulty level status";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  // Get difficulty level by ID
  const getDifficultyLevelById = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        setError(null);

        const level = await difficultyLevelAPI.getDifficultyLevelById(id);
        setSelectedLevel(level);
        return level;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch difficulty level";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  // Get difficulty level options for dropdowns
  const getDifficultyLevelOptions = useCallback(() => {
    return difficultyLevels
      .filter((level) => level.status)
      .map((level) => ({
        value: level.id.toString(),
        label: difficultyLevelUtils.getDifficultyLabel(level.name),
        color: difficultyLevelUtils.getDifficultyColor(level.name),
      }));
  }, [difficultyLevels]);

  // Get difficulty level by name
  const getDifficultyLevelByName = useCallback(
    (name: string) => {
      return difficultyLevels.find(
        (level) => level.name.toLowerCase() === name.toLowerCase(),
      );
    },
    [difficultyLevels],
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear selected level
  const clearSelectedLevel = useCallback(() => {
    setSelectedLevel(null);
  }, []);

  // Initial load
  useEffect(() => {
    fetchDifficultyLevels();
  }, [fetchDifficultyLevels]);

  return {
    // Data
    difficultyLevels,
    loading,
    error,
    selectedLevel,

    // Actions
    createDifficultyLevel,
    updateDifficultyLevel,
    deleteDifficultyLevel,
    toggleDifficultyLevelStatus,
    getDifficultyLevelById,

    // Fetch functions
    fetchDifficultyLevels,
    fetchActiveDifficultyLevels,

    // Utility functions
    getDifficultyLevelOptions,
    getDifficultyLevelByName,
    clearError,
    clearSelectedLevel,

    // Utils
    difficultyLevelUtils,
  };
}
