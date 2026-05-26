import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPlaceholder,
  createTemplate,
  deletePlaceholder,
  deleteTemplate,
  getCampuses,
  getPlaceholders,
  getTemplateContent,
  getTemplates,
  updatePlaceholders,
  updateTemplate,
  type CampusSummary,
  type CreatePlaceholderPayload,
  type CreateTemplatePayload,
  type PlaceholderInfo,
  type RenamePlaceholderPayload,
  type TemplateContent,
  type TemplateListItem,
  type TemplateListParams,
  type UpdateTemplatePayload,
} from "@/services/templateService";

const templatesQueryKey = (params?: TemplateListParams) => ["templates", "list", params ?? {}];

export const useTemplates = () => {
  const queryClient = useQueryClient();

  const campusesQuery = useQuery<CampusSummary[]>({
    queryKey: ["templates", "campuses"],
    queryFn: getCampuses,
    staleTime: 5 * 60 * 1000,
  });

  const getTemplatesQuery = (params?: TemplateListParams, enabled = true) =>
    useQuery<TemplateListItem[]>({
      queryKey: templatesQueryKey(params),
      queryFn: () => getTemplates(params),
      enabled,
      staleTime: 5 * 60 * 1000,
    });

  const getPlaceholdersQuery = (campusName?: string, enabled = true) =>
    useQuery<PlaceholderInfo[]>({
      queryKey: ["templates", "placeholders", campusName || "global"],
      queryFn: () => getPlaceholders(campusName),
      enabled: enabled && (!!campusName || campusName === undefined),
      staleTime: 5 * 60 * 1000,
    });

  const getTemplateContentQuery = (
    campusName: string,
    fileName: string,
    enabled = true,
  ) =>
    useQuery<TemplateContent>({
      queryKey: ["templates", "content", campusName, fileName],
      queryFn: () => getTemplateContent(campusName, fileName),
      enabled: enabled && !!campusName && !!fileName,
      staleTime: 5 * 60 * 1000,
    });

  const invalidateTemplates = async (campusName?: string, fileName?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["templates"] }),
      campusName
        ? queryClient.invalidateQueries({ queryKey: ["templates", "content", campusName, fileName ?? ""] })
        : Promise.resolve(),
    ]);
  };

  const createTemplateMutation = useMutation({
    mutationFn: (template: CreateTemplatePayload) => createTemplate(template),
    onSuccess: async (_data, variables) => {
      await invalidateTemplates(variables.campus_name, variables.file_name);
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: (template: UpdateTemplatePayload) => updateTemplate(template),
    onSuccess: async (_data, variables) => {
      await invalidateTemplates(variables.campus_name, variables.file_name);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: ({ campusName, fileName }: { campusName: string; fileName: string }) =>
      deleteTemplate(campusName, fileName),
    onSuccess: async (_data, variables) => {
      await invalidateTemplates(variables.campusName, variables.fileName);
    },
  });

  const createPlaceholderMutation = useMutation({
    mutationFn: ({ campusName, payload }: { campusName: string; payload: CreatePlaceholderPayload }) =>
      createPlaceholder(campusName, payload),
    onSuccess: async (_data, variables) => {
      await invalidateTemplates(variables.campusName, variables.payload.file_name);
    },
  });

  const renamePlaceholderMutation = useMutation({
    mutationFn: ({ campusName, payload }: { campusName: string; payload: RenamePlaceholderPayload }) =>
      updatePlaceholders(campusName, payload),
    onSuccess: async (_data, variables) => {
      await invalidateTemplates(variables.campusName);
    },
  });

  const deletePlaceholderMutation = useMutation({
    mutationFn: ({ campusName, name, replacement }: { campusName: string; name: string; replacement?: string }) =>
      deletePlaceholder(campusName, name, replacement),
    onSuccess: async (_data, variables) => {
      await invalidateTemplates(variables.campusName);
    },
  });

  return {
    campusesQuery,
    getTemplatesQuery,
    getPlaceholdersQuery,
    getTemplateContentQuery,
    createTemplateMutation,
    updateTemplateMutation,
    deleteTemplateMutation,
    createPlaceholderMutation,
    renamePlaceholderMutation,
    deletePlaceholderMutation,
  };
};
