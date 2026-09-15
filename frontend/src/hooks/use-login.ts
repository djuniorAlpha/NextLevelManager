import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAdmin } from "@/lib/api/auth";
import { useAuth } from "@/components/providers/auth-provider";

export function useLogin() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  return useMutation({
    mutationFn: ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) => loginAdmin(username, password),
    onSuccess: (data) => {
      login({ token: data.accessToken, admin: data.admin });
      router.push(searchParams.get("next") || "/estacoes");
    },
  });
}
