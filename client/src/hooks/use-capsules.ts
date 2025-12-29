import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type CreateCapsuleInput, type CapsuleResponse } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useCreateCapsule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateCapsuleInput) => {
      // Validate with Zod before sending
      const validated = api.capsules.create.input.parse(data);
      
      const res = await fetch(api.capsules.create.path, {
        method: api.capsules.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.capsules.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create time capsule");
      }

      return api.capsules.create.responses[201].parse(await res.json());
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
