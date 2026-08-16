import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAppSettings, updateAppSettings } from "@/lib/api/app-settings";

export function useAppSettings() {
  return useQuery({ queryKey: ["app-settings"], queryFn: getAppSettings });
}

export function useUpdateAppSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAppSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast.success("Configurações salvas");
    },
    onError: () => {
      toast.error("Não foi possível salvar as configurações. Tente novamente.");
    },
  });
}
