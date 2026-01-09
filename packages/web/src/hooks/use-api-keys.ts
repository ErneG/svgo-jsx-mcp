import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ApiKey {
  id: string;
  key: string;
  name: string | null;
  enabled: boolean;
  rateLimit: number;
  createdAt: string;
  requestCount: number;
}

export interface CreateApiKeyInput {
  name?: string;
  rateLimit?: number;
}

export interface UpdateApiKeyInput {
  enabled?: boolean;
  rateLimit?: number;
  name?: string;
}

export function useApiKeys() {
  return useQuery<ApiKey[]>({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const res = await fetch("/api/admin/keys");
      if (!res.ok) {
        throw new Error("Failed to fetch API keys");
      }
      return res.json();
    },
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation<ApiKey, Error, CreateApiKeyInput>({
    mutationFn: async (input) => {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to create API key");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });
}

export function useUpdateApiKey() {
  const queryClient = useQueryClient();

  return useMutation<ApiKey, Error, { id: string; data: UpdateApiKeyInput }>({
    mutationFn: async ({ id, data }) => {
      const res = await fetch(`/api/admin/keys/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to update API key");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();

  return useMutation<{ ok: boolean }, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/admin/keys/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to delete API key");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });
}
