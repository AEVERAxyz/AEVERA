import { useState } from "react";
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
import { Loader2, Clock, Globe, Calendar } from "lucide-react"; 
import bottleIcon from "@assets/FutureCapsule-removebg_1767123114748.png";
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
  if (isNaN(date.getTime())) return "Invalid Date";
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
    if (!identity) {
      toast({
        title: "Identity Required",
        description: "Please sign in with Farcaster to seal the capsule.",
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
    if (!localDateTimeString) {
      setSelectedUtcTime(null);
      return;
    }
    const localDate = new Date(localDateTimeString);
    if (isNaN(localDate.getTime())) return; 
    setSelectedUtcTime(localDate);
    form.setValue('revealDate', localDate, { shouldValidate: true, shouldDirty: true });
  };

  // Hilfsvariable für die Button-Logik
  const canSubmit = identity && form.formState.isDirty;

  return (
    <div className="space-y-8">
      <IdentityModule identity={identity} onIdentityChange={setIdentity} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xl font-display font-bold text-[#F8FAFC] glow-text mb-2 block">
                  Message to the Future
                </FormLabel>
                <FormControl>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-20 group-focus-within:opacity-50 transition duration-500"></div>
                    <Textarea
                      placeholder="Write your message..."
                      className="relative bg-black/50 border-white/10 min-h-[160px] resize-none text-lg p-6 rounded-xl focus:ring-0 focus:border-transparent placeholder:text-muted-foreground/50 text-white shadow-inner"
                      data-testid="textarea-message"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormDescription className="text-[#CBD5E1] flex items-center gap-2 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1652F0] shadow-[0_0_5px_#1652F0]"></span>
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
                <FormLabel className="text-xl font-display font-bold text-[#F8FAFC] glow-text flex items-center gap-3 mb-2">
                  <Clock className="w-6 h-6 text-[#1652F0] drop-shadow-[0_0_8px_rgba(22,82,240,0.5)]" />
                  Reveal Date & Time
                </FormLabel>
                <FormControl>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-accent to-primary rounded-xl blur opacity-20 group-focus-within:opacity-50 transition duration-500"></div>

                    <div className="datetime-wrapper relative">
                      {/* UPDATE: h-16 für mehr Höhe, px-6 für mehr Abstand, text-lg für bessere Lesbarkeit */}
                      <Input
                        type="datetime-local"
                        onKeyDown={(e) => e.preventDefault()}
                        style={{ colorScheme: 'dark' }} 
                        className={`
                          relative bg-black/50 border-white/10 h-16 rounded-xl 
                          focus:ring-0 focus:border-transparent text-lg px-6 pr-12 
                          cursor-pointer transition-colors duration-300
                          appearance-none shadow-inner
                          [&::-webkit-calendar-picker-indicator]:hidden
                          [&::-webkit-calendar-picker-indicator]:opacity-0
                          ${selectedUtcTime ? "text-white font-medium" : "text-[#CBD5E1]/40"}
                        `}
                        placeholder="Select date and time..."
                        min={getMinDateTime()}
                        onChange={(e) => handleDateChange(e.target.value)}
                        onClick={(e) => e.currentTarget.showPicker && e.currentTarget.showPicker()}
                        data-testid="input-datetime-local"
                      />

                      <Calendar 
                        className={`
                          absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300
                          ${selectedUtcTime ? "text-[#1652F0] drop-shadow-[0_0_5px_rgba(22,82,240,0.5)]" : "text-[#CBD5E1]/30"}
                        `}
                        size={24} // Etwas größer
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>
                </FormControl>

                {selectedUtcTime && !isNaN(selectedUtcTime.getTime()) && (
                  <div className="mt-3 p-4 rounded-xl bg-black/30 border border-[#1652F0]/30 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#CBD5E1] flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[#1652F0]" />
                        Reveal Time (UTC):
                      </span>
                      <span className="text-sm font-mono text-white font-bold drop-shadow-md">
                        {formatUTC(selectedUtcTime)}
                      </span>
                    </div>
                    <p className="text-[#CBD5E1]/70 text-xs mt-2 pl-6">
                      The capsule will reveal at this UTC time worldwide.
                    </p>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <motion.div
            whileHover={identity ? { scale: 1.02 } : {}}
            whileTap={identity ? { scale: 0.98 } : {}}
          >
            {/* UPDATE: Dynamische Klassen für den Button.
               Wenn !identity (nicht eingeloggt): Grau, dunkel, keine Schatten.
               Wenn identity (eingeloggt): Blau, Verlauf, Schatten.
            */}
            <Button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className={`
                w-full h-24 text-3xl font-bold rounded-xl flex items-center justify-center transition-all duration-300
                ${!identity 
                   ? "bg-slate-800/50 text-slate-500 cursor-not-allowed border border-white/5 opacity-70" 
                   : "bg-gradient-to-r from-[#1652F0] to-[#3B82F6] hover:opacity-90 breathing-button text-white"
                }
              `}
              style={identity ? { boxShadow: "0 0 30px rgba(22, 82, 240, 0.7)" } : {}}
              data-testid="button-seal-capsule"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                  Encrypting...
                </>
              ) : (
                <>
                  <img 
                    src={bottleIcon} 
                    alt="" 
                    className={`mr-1 h-20 w-auto transition-all duration-300 ${!identity ? "grayscale opacity-50" : ""}`}
                    style={identity ? { 
                      filter: "drop-shadow(0 0 5px #ffffff) drop-shadow(0 0 20px #3B82F6) drop-shadow(0 0 40px #1652F0) drop-shadow(0 0 60px rgba(59, 130, 246, 0.5))"
                    } : {}}
                  />
                  Seal Capsule
                </>
              )}
            </Button>
          </motion.div>

          {!identity && (
            <p className="text-center text-sm text-[#CBD5E1] animate-pulse">
              Please sign in above to activate the seal mechanism.
            </p>
          )}
        </form>
      </Form>
    </div>
  );
}