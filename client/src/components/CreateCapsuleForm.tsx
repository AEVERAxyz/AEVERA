import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCapsuleSchema } from "@shared/schema";
import type { CreateCapsuleInput } from "@shared/routes";
import { useCreateCapsule } from "@/hooks/use-capsules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Rocket, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  onSuccess: (capsuleId: string) => void;
}

export function CreateCapsuleForm({ onSuccess }: Props) {
  const form = useForm<CreateCapsuleInput>({
    resolver: zodResolver(insertCapsuleSchema),
    defaultValues: {
      content: "",
    },
  });

  const createCapsule = useCreateCapsule();

  const onSubmit = (data: CreateCapsuleInput) => {
    createCapsule.mutate(data, {
      onSuccess: (response) => {
        onSuccess(response.id);
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-medium text-primary/90">Message to the Future</FormLabel>
              <FormControl>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-20 group-focus-within:opacity-50 transition duration-500"></div>
                  <Textarea
                    placeholder="Write something meaningful..."
                    className="relative bg-black/50 border-white/10 min-h-[160px] resize-none text-lg p-6 rounded-xl focus:ring-0 focus:border-transparent placeholder:text-muted-foreground/50"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormDescription className="text-muted-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                This message will be encrypted until the reveal date.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="revealDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-lg font-medium text-primary/90">Reveal Date & Time (UTC)</FormLabel>
              <FormControl>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-accent to-primary rounded-xl blur opacity-20 group-focus-within:opacity-50 transition duration-500"></div>
                  <Input
                    type="datetime-local"
                    className="relative bg-black/50 border-white/10 h-14 rounded-xl focus:ring-0 focus:border-transparent text-base p-4"
                    placeholder="Select date and time..."
                    value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        const date = new Date(e.target.value + ":00Z");
                        field.onChange(date);
                      }
                    }}
                    data-testid="input-datetime-local"
                  />
                </div>
              </FormControl>
              <FormDescription className="text-muted-foreground flex items-center gap-2 mt-2">
                <Clock className="w-3 h-3 text-accent" />
                All times are handled in UTC to ensure global synchronization.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            type="submit"
            disabled={createCapsule.isPending}
            className="w-full h-16 text-lg font-bold rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            {createCapsule.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Encrypting Time Capsule...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-5 w-5" />
                Seal Capsule
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </Form>
  );
}
