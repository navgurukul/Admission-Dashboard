import axios from "axios";
import { getAuthToken, getCampusesApi } from "@/utils/api";
import {
  getOfferLetterTemplateImagesApiBaseUrl,
  getTemplatesApiBaseUrl,
} from "@/utils/apiBase";

const TEMPLATES_BASE_URL = getTemplatesApiBaseUrl();
const TEMPLATE_IMAGES_BASE_URL = getOfferLetterTemplateImagesApiBaseUrl();

const getAuthTokenForRequest = () => getAuthToken() || localStorage.getItem("authToken") || "";

const apiClient = axios.create({
  baseURL: TEMPLATES_BASE_URL,
});

const templateImagesClient = axios.create({
  baseURL: TEMPLATE_IMAGES_BASE_URL,
});

const attachAuthHeader = (config: Parameters<Parameters<typeof apiClient.interceptors.request.use>[0]>[0]) => {
  const token = getAuthTokenForRequest();
  if (token) {
    const bearer = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    const headers = config.headers as Record<string, string> | undefined;
    if (headers) {
      headers.Authorization = bearer;
    } else {
      config.headers = { Authorization: bearer } as typeof config.headers;
    }
  }
  return config;
};

apiClient.interceptors.request.use(attachAuthHeader);
templateImagesClient.interceptors.request.use(attachAuthHeader);

type ApiErrorPayload = {
  message?: string;
  error?: string;
  success?: boolean;
};

const normalizeError = (error: unknown) => {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const payload = error.response?.data;
    const message = payload?.message || payload?.error || error.message || "Request failed";
    const normalized = new Error(message);
    (normalized as Error & { status?: number; payload?: ApiErrorPayload }).status = error.response?.status;
    (normalized as Error & { status?: number; payload?: ApiErrorPayload }).payload = payload;
    return normalized;
  }

  if (error instanceof Error) return error;

  return new Error("Request failed");
};

const unwrapData = <T,>(response: { data?: { data?: T } | T }): T => {
  const data = response.data as { data?: T } | T | undefined;
  if (data && typeof data === "object" && "data" in data) {
    return (data as { data?: T }).data as T;
  }
  return data as T;
};

const encodeCampusName = (campusName: string) => encodeURIComponent(campusName);

export interface CampusSummary {
  campus_name: string;
  id?: number;
  total_templates?: number;
  templates_with_placeholders?: number;
}

export interface TemplateListItem {
  campus_name: string;
  file_name: string;
  file_type: "admission" | "email" | "other";
  placeholders: string[];
  file_size_bytes: number;
  updated_at: string;
}

export interface TemplateContent extends TemplateListItem {
  content: string;
}

export interface PlaceholderInfo {
  name: string;
  campuses: string[];
  files: string[];
}

export interface TemplateListParams {
  campus?: string;
  has_placeholders?: boolean;
  type?: "admission" | "email" | "other" | "all";
}

export interface CreateTemplatePayload {
  campus_name: string;
  file_name: string;
  content: string;
}

export interface UpdateTemplatePayload {
  campus_name: string;
  file_name: string;
  content: string;
}

export interface RenamePlaceholderPayload {
  from: string;
  to: string;
}

export interface CreatePlaceholderPayload {
  file_name: string;
  key: string;
}

export interface OfferLetterTemplateImage {
  id: number;
  campus_name: string;
  image_name: string;
  image_type: string;
  s3_url: string;
  s3_key: string;
  created_at?: string;
  updated_at?: string;
}

/** Campuses from RDS: GET /api/v1/campuses/getCampuses?page=1&pageSize=100 */
export const getCampuses = async (): Promise<CampusSummary[]> => {
  try {
    const list = await getCampusesApi();
    return list.map((campus) => ({
      id: campus.id,
      campus_name: campus.campus_name,
      total_templates: 0,
      templates_with_placeholders: 0,
    }));
  } catch (error) {
    throw normalizeError(error);
  }
};

export const getTemplates = async (params?: TemplateListParams): Promise<TemplateListItem[]> => {
  try {
    if (params?.campus) {
      const query: Record<string, string | boolean> = {};
      if (params.has_placeholders !== undefined) query.has_placeholders = params.has_placeholders;
      if (params.type) query.type = params.type;

      const response = await apiClient.get(`/campuses/${encodeCampusName(params.campus)}`, { params: query });
      const items = unwrapData<TemplateListItem[]>(response) || [];
      return items.map(normalizeTemplateItem);
    }

    const response = await apiClient.get("/", {
      params: {
        campus: params?.campus,
        has_placeholders: params?.has_placeholders,
        type: params?.type,
      },
    });

    const items = unwrapData<TemplateListItem[]>(response) || [];
    return items.map(normalizeTemplateItem);
  } catch (error) {
    throw normalizeError(error);
  }
};

export const getTemplatesGlobal = async (params?: Omit<TemplateListParams, "campus">): Promise<TemplateListItem[]> =>
  getTemplates(params);

const normalizeOfferLetterTemplateImage = (item: any, fallbackCampus = ""): OfferLetterTemplateImage => ({
  id: Number(item?.id ?? 0),
  campus_name: item?.campus_name ?? item?.campusName ?? fallbackCampus,
  image_name: item?.image_name ?? item?.imageName ?? "",
  image_type: item?.image_type ?? item?.imageType ?? "logo",
  s3_url: item?.s3_url ?? item?.s3Url ?? "",
  s3_key: item?.s3_key ?? item?.s3Key ?? "",
  created_at: item?.created_at ?? item?.createdAt,
  updated_at: item?.updated_at ?? item?.updatedAt,
});

export const getOfferLetterTemplateImages = async (campusName: string): Promise<OfferLetterTemplateImage[]> => {
  try {
    const response = await templateImagesClient.get("/", {
      params: { campus_name: campusName },
    });

    const body = response.data as { success?: boolean; data?: OfferLetterTemplateImage[] } | OfferLetterTemplateImage[];
    const items = Array.isArray(body)
      ? body
      : Array.isArray(body?.data)
        ? body.data
        : unwrapData<OfferLetterTemplateImage[]>(response) || [];

    return items.map((item) => normalizeOfferLetterTemplateImage(item, campusName));
  } catch (error) {
    throw normalizeError(error);
  }
};

export const uploadOfferLetterTemplateImage = async (
  campusName: string,
  file: File,
  options?: { image_name?: string; image_type?: string },
): Promise<OfferLetterTemplateImage> => {
  try {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("campus_name", campusName);
    formData.append("image_name", options?.image_name ?? file.name.replace(/\.[^/.]+$/, ""));
    formData.append("image_type", options?.image_type ?? (isPdf ? "pdf" : "logo"));

    const response = await templateImagesClient.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return normalizeOfferLetterTemplateImage(unwrapData<OfferLetterTemplateImage>(response), campusName);
  } catch (error) {
    throw normalizeError(error);
  }
};

export const updateOfferLetterTemplateImage = async (
  id: number,
  payload: { image_name?: string; image_type?: string },
): Promise<OfferLetterTemplateImage> => {
  try {
    const response = await templateImagesClient.patch(`/${id}`, payload);
    return normalizeOfferLetterTemplateImage(unwrapData<OfferLetterTemplateImage>(response));
  } catch (error) {
    throw normalizeError(error);
  }
};

export const deleteOfferLetterTemplateImage = async (id: number): Promise<void> => {
  try {
    await templateImagesClient.delete(`/${id}`);
  } catch (error) {
    throw normalizeError(error);
  }
};

export const getPlaceholders = async (campus?: string): Promise<PlaceholderInfo[]> => {
  try {
    const response = campus
      ? await apiClient.get(`/campuses/${encodeCampusName(campus)}/placeholders`)
      : await apiClient.get("/placeholders", { params: campus ? { campus } : undefined });

    const items = unwrapData<PlaceholderInfo[]>(response) || [];
    return items.map((item: any) => ({
      name: item?.name ?? item?.placeholder ?? "",
      campuses: Array.isArray(item?.campuses) ? item.campuses : [],
      files: Array.isArray(item?.files) ? item.files : [],
    }));
  } catch (error) {
    throw normalizeError(error);
  }
};

export const getPlaceholdersGlobal = async (campus?: string): Promise<PlaceholderInfo[]> => getPlaceholders(campus);

export const getTemplateContent = async (
  campusName: string,
  fileName: string,
): Promise<TemplateContent> => {
  try {
    const response = await apiClient.get(
      `/campuses/${encodeCampusName(campusName)}/file`,
      { params: { file_name: fileName } },
    );
    return normalizeTemplateContent(unwrapData<TemplateContent>(response));
  } catch (error) {
    throw normalizeError(error);
  }
};

export const getTemplateContentGlobal = async (
  campusName: string,
  fileName: string,
): Promise<TemplateContent> => {
  try {
    const response = await apiClient.get("/content", {
      params: { campus_name: campusName, file_name: fileName },
    });
    return normalizeTemplateContent(unwrapData<TemplateContent>(response));
  } catch (error) {
    throw normalizeError(error);
  }
};

export const createTemplate = async (template: CreateTemplatePayload): Promise<TemplateContent> => {
  try {
    const response = await apiClient.post(`/campuses/${encodeCampusName(template.campus_name)}/file`, {
      file_name: template.file_name,
      content: template.content,
    });
    return normalizeTemplateContent(unwrapData<TemplateContent>(response));
  } catch (error) {
    throw normalizeError(error);
  }
};

export const createTemplateGlobal = async (template: CreateTemplatePayload): Promise<TemplateContent> => {
  try {
    const response = await apiClient.post("/", template);
    return normalizeTemplateContent(unwrapData<TemplateContent>(response));
  } catch (error) {
    throw normalizeError(error);
  }
};

export const updateTemplate = async (template: UpdateTemplatePayload): Promise<TemplateContent> => {
  try {
    const response = await apiClient.put(`/campuses/${encodeCampusName(template.campus_name)}/file`, {
      file_name: template.file_name,
      content: template.content,
    });
    return normalizeTemplateContent(unwrapData<TemplateContent>(response));
  } catch (error) {
    throw normalizeError(error);
  }
};

export const updateTemplateGlobal = async (template: UpdateTemplatePayload): Promise<TemplateContent> => {
  try {
    const response = await apiClient.put("/", template);
    return normalizeTemplateContent(unwrapData<TemplateContent>(response));
  } catch (error) {
    throw normalizeError(error);
  }
};

export const deleteTemplate = async (campusName: string, fileName: string): Promise<void> => {
  try {
    await apiClient.delete(`/campuses/${encodeCampusName(campusName)}/file`, {
      params: { file_name: fileName },
    });
  } catch (error) {
    throw normalizeError(error);
  }
};

export const deleteTemplateGlobal = async (campusName: string, fileName: string): Promise<void> => {
  try {
    await apiClient.delete("/", {
      params: { campus_name: campusName, file_name: fileName },
    });
  } catch (error) {
    throw normalizeError(error);
  }
};

export const createPlaceholder = async (
  campusName: string,
  payload: CreatePlaceholderPayload,
): Promise<unknown> => {
  try {
    const response = await apiClient.post(`/campuses/${encodeCampusName(campusName)}/placeholders`, payload);
    return unwrapData(response) ?? response.data;
  } catch (error) {
    throw normalizeError(error);
  }
};

export const updatePlaceholders = async (
  campusName: string,
  payload: RenamePlaceholderPayload,
): Promise<unknown> => {
  try {
    const response = await apiClient.put(`/campuses/${encodeCampusName(campusName)}/placeholders`, payload);
    return unwrapData(response) ?? response.data;
  } catch (error) {
    throw normalizeError(error);
  }
};

export const deletePlaceholder = async (
  campusName: string,
  name: string,
  replacement?: string,
): Promise<unknown> => {
  try {
    const response = await apiClient.delete(`/campuses/${encodeCampusName(campusName)}/placeholders`, {
      params: {
        name,
        ...(replacement !== undefined ? { replacement } : {}),
      },
    });
    return unwrapData(response) ?? response.data;
  } catch (error) {
    throw normalizeError(error);
  }
};

export const extractPlaceholders = (htmlContent: string): string[] => {
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  const matches = htmlContent.match(placeholderRegex) || [];
  return [...new Set(matches.map((match) => match.replace(/[{}]/g, "").trim()))];
};

const normalizeTemplateItem = (item: any): TemplateListItem => ({
  campus_name: item?.campus_name ?? item?.campusName ?? "",
  file_name: item?.file_name ?? item?.fileName ?? "",
  file_type: (item?.file_type ?? item?.fileType ?? "other") as TemplateListItem["file_type"],
  placeholders: Array.isArray(item?.placeholders) ? item.placeholders : [],
  file_size_bytes: Number(item?.file_size_bytes ?? item?.fileSizeBytes ?? 0),
  updated_at: item?.updated_at ?? item?.updatedAt ?? "",
});

const normalizeTemplateContent = (item: TemplateContent | any): TemplateContent => ({
  ...normalizeTemplateItem(item),
  content: item?.content ?? "",
});
