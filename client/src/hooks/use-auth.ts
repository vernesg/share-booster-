import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type AdminLoginRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useAdminLogin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AdminLoginRequest) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Login failed");
      }

      const result = api.auth.login.responses[200].parse(await res.json());
      localStorage.setItem("admin-token", result.token);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.verify.path] });
      toast({
        title: "Access Granted",
        description: "Welcome back, Admin.",
      });
    },
    onError: () => {
      toast({
        title: "Access Denied",
        description: "Invalid credentials.",
        variant: "destructive",
      });
    }
  });
}

export function useAuthCheck() {
  return useQuery({
    queryKey: [api.auth.verify.path],
    queryFn: async () => {
      const token = localStorage.getItem("admin-token");
      if (!token) return { authenticated: false };
      
      const res = await fetch(api.auth.verify.path, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) {
        localStorage.removeItem("admin-token");
        return { authenticated: false };
      }
      
      return api.auth.verify.responses[200].parse(await res.json());
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}
