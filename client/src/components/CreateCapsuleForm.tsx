import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Loader2, Rocket, Clock, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import nacl from "tweetnacl";
import { IdentityModule, type Identity } from "./IdentityModule";

interface Props {
  onSuccess: (capsuleId: string) => void;
}

const createCapsuleFormSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  revealDate: z.coerce.date().refine(
    (date) => date > new Date(),
    "Reveal date must be in the future"
  ),
});

type CreateCapsuleFormData = z.infer<typeof createCapsuleFormSchema>;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(hashBuffer));
}

function formatUTC(date: Date): string {
  return date.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

export function CreateCapsuleForm({ onSuccess }: Props) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUtcTime, setSelectedUtcTime] = useState<Date | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);

  const form = useForm<CreateCapsuleFormData>({
    resolver: zodResolver(createCapsuleFormSchema),
    defaultValues: {
      message: "",
    },
  });

  const onSubmit = async (data: CreateCapsuleFormData) => {
    if (!identity || identity.type === "anonymous") {
      toast({
        title: "Identity Required",
        description: "Please connect your wallet to seal the capsule.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const encryptionKey = nacl.randomBytes(nacl.secretbox.keyLength);
      const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
      const messageBytes = new TextEncoder().encode(data.message);
      const encryptedBox = nacl.secretbox(messageBytes, nonce, encryptionKey);

      const combined = new Uint8Array(nonce.length + encryptedBox.length);
      combined.set(nonce);
      combined.set(encryptedBox, nonce.length);
      const encryptedHex = bytesToHex(combined);

      const messageHash = await sha256(data.message);
      const keyHex = bytesToHex(encryptionKey);

      const payload: Record<string, string> = {
          encryptedContent: encryptedHex,
          decryptionKey: keyHex,
          messageHash: messageHash,
          revealDate: data.revealDate.toISOString(),
          sealerIdentity: identity.displayName,
          sealerType: identity.type,
        };
      
      if (identity.address) {
        payload.sealerAddress = identity.address;
      }

      const response = await fetch("/api/capsules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create capsule");
      }

      const capsule = await response.json();

      toast({
        title: "Success!",
        description: "Your TimeCapsule has been encrypted and sealed.",
      });

      onSuccess(capsule.id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create capsule";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleDateChange = (localDateTimeString: string) => {
    if (localDateTimeString) {
      const localDate = new Date(localDateTimeString);
      setSelectedUtcTime(localDate);
      form.setValue('revealDate', localDate, { shouldValidate: true, shouldDirty: true });
    } else {
      setSelectedUtcTime(null);
    }
  };

  const canSubmit = identity && identity.type !== "anonymous" && form.formState.isDirty;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <IdentityModule identity={identity} onIdentityChange={setIdentity} />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-medium text-primary/90">
                Message to the Future
              </FormLabel>
              <FormControl>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-20 group-focus-within:opacity-50 transition duration-500"></div>
                  <Textarea
                    placeholder="Write something meaningful..."
                    className="relative bg-black/50 border-white/10 min-h-[160px] resize-none text-lg p-6 rounded-xl focus:ring-0 focus:border-transparent placeholder:text-muted-foreground/50"
                    data-testid="textarea-message"
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
              <FormLabel className="text-lg font-medium text-primary/90 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Reveal Date & Time
              </FormLabel>
              <FormControl>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-accent to-primary rounded-xl blur opacity-20 group-focus-within:opacity-50 transition duration-500"></div>
                  <Input
                    type="datetime-local"
                    className="relative bg-black/50 border-white/10 h-14 rounded-xl focus:ring-0 focus:border-transparent text-base p-4 text-white datetime-input"
                    placeholder="Select date and time..."
                    min={getMinDateTime()}
                    onChange={(e) => handleDateChange(e.target.value)}
                    data-testid="input-datetime-local"
                  />
                </div>
              </FormControl>
              
              {selectedUtcTime && (
                <div className="mt-3 p-4 rounded-xl bg-black/30 border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Globe className="w-4 h-4 text-accent" />
                      Reveal Time (UTC):
                    </span>
                    <span className="text-sm font-mono text-primary font-semibold">
                      {formatUTC(selectedUtcTime)}
                    </span>
                  </div>
                  <p className="text-muted-foreground/70 text-xs mt-2">
                    The capsule will reveal at this UTC time worldwide.
                  </p>
                </div>
              )}
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
            disabled={isSubmitting || !canSubmit}
            className="w-full h-16 text-lg font-bold rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all neon-glow"
            data-testid="button-seal-capsule"
          >
            {isSubmitting ? (
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

        {!canSubmit && identity?.type === "anonymous" && (
          <p className="text-center text-sm text-muted-foreground">
            Connect your wallet above to seal your capsule.
          </p>
        )}
      </form>
    </Form>
  );
}
