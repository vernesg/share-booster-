import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ValidateKeyRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useValidateKey() {
  return useMutation({
    mutationFn: async (data: ValidateKeyRequest) => {
      const res = await fetch(api.settings.validateKey.path, {
        method: api.settings.validateKey.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Key validation failed");
      return api.settings.validateKey.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await fetch(api.settings.update.path, {
        method: api.settings.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        throw new Error("Failed to update setting");
      }
      return api.settings.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      toast({
        title: "System Updated",
        description: "Configuration key successfully modified.",
        className: "border-primary text-primary bg-black",
      });
    },
    onError: (error) => {
      toast({
        title: "Access Denied",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useSetting(key: string) {
  return useQuery({
    queryKey: [api.settings.get.path, key],
    queryFn: async () => {
      // Need to manually replace param in path since the generic hook doesn't know about params
      const path = api.settings.get.path.replace(":key", key);
      const res = await fetch(path);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch setting");
      }
      return api.settings.get.responses[200].parse(await res.json());
    },
    enabled: !!key,
  });
}
