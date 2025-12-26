import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { shareTaskSchema, type LogMessage } from "@shared/schema";
import { api } from "@shared/routes";
import { useValidateKey } from "@/hooks/use-settings";
import { Navbar } from "@/components/layout/Navbar";
import { Terminal } from "@/components/Terminal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Send, Lock, AlertTriangle, Clock, Link as LinkIcon, Cookie as CookieIcon, Hash } from "lucide-react";

const formSchema = shareTaskSchema.extend({
  cookies: z.string().min(1, "At least one cookie is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function Home() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumUsageCount, setPremiumUsageCount] = useState(0);
  
  useEffect(() => {
    const stored = localStorage.getItem("premium_usage_count");
    if (stored) setPremiumUsageCount(parseInt(stored, 10));
  }, []);

  const validateKeyMutation = useValidateKey();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mode: "normal",
      limit: 100,
      delay: 1000,
      link: "",
      cookies: "",
      premiumKey: "",
    },
  });

  const watchMode = form.watch("mode");
  useEffect(() => {
    setIsPremium(watchMode === "premium");
  }, [watchMode]);

  const onSubmit = async (data: FormData) => {
    setLogs([]);
    setIsStreaming(true);

    const cookieArray = data.cookies.split("\n").filter(c => c.trim().length > 0);
    const payload = {
      ...data,
      cookies: cookieArray,
    };

    if (data.mode === "premium") {
      if (premiumUsageCount >= 3) {
        if (!data.premiumKey) {
          toast({
            title: "Premium Key Required",
            description: "You have used up your 3 free premium trials.",
            variant: "destructive",
          });
          setIsStreaming(false);
          return;
        }

        try {
          const isValid = await validateKeyMutation.mutateAsync({ key: data.premiumKey });
          if (!isValid.valid) {
            toast({
              title: "Invalid Key",
              description: "The provided premium key is incorrect.",
              variant: "destructive",
            });
            setIsStreaming(false);
            return;
          }
        } catch (e) {
          toast({
            title: "Validation Error",
            description: "Could not validate premium key.",
            variant: "destructive",
          });
          setIsStreaming(false);
          return;
        }
      } else {
        const newCount = premiumUsageCount + 1;
        setPremiumUsageCount(newCount);
        localStorage.setItem("premium_usage_count", newCount.toString());
      }
    }

    try {
      const response = await fetch(api.share.start.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to start share process");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(line => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonStr = line.replace("data: ", "");
              const log: LogMessage = JSON.parse(jsonStr);
              setLogs(prev => [...prev, log]);
            } catch (e) {
              console.error("Failed to parse log", e);
            }
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Execution Error",
        description: error.message,
        variant: "destructive",
      });
      setLogs(prev => [...prev, {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        level: "error",
        message: `Error: ${error.message}`
      }]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 grid lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Share Configuration</CardTitle>
              <CardDescription>Set up your sharing parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Mode Switch */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Mode</Label>
                    <Switch 
                      checked={isPremium}
                      onCheckedChange={(checked) => form.setValue("mode", checked ? "premium" : "normal")}
                      data-testid="switch-premium-mode"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isPremium ? "Premium: Fast sharing with anti-ban protection" : "Normal: Standard speed sharing"}
                  </p>
                </div>

                {/* Post Link */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2" htmlFor="link">
                    <LinkIcon className="w-4 h-4" /> Post URL
                  </Label>
                  <Input 
                    id="link"
                    {...form.register("link")}
                    placeholder="https://facebook.com/..." 
                    data-testid="input-link"
                  />
                  {form.formState.errors.link && (
                    <p className="text-xs text-destructive">{form.formState.errors.link.message}</p>
                  )}
                </div>

                {/* Cookies */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2" htmlFor="cookies">
                    <CookieIcon className="w-4 h-4" /> Cookies
                  </Label>
                  <Textarea 
                    id="cookies"
                    {...form.register("cookies")}
                    placeholder="datr=...; sb=...;" 
                    className="min-h-[100px]"
                    data-testid="textarea-cookies"
                  />
                  <p className="text-xs text-muted-foreground">One cookie per line</p>
                  {form.formState.errors.cookies && (
                    <p className="text-xs text-destructive">{form.formState.errors.cookies.message}</p>
                  )}
                </div>

                {/* Limit & Delay */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2" htmlFor="limit">
                      <Hash className="w-4 h-4" /> Limit
                    </Label>
                    <Input 
                      id="limit"
                      type="number"
                      {...form.register("limit", { valueAsNumber: true })}
                      data-testid="input-limit"
                    />
                  </div>

                  {!isPremium && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2" htmlFor="delay">
                        <Clock className="w-4 h-4" /> Delay (ms)
                      </Label>
                      <Input 
                        id="delay"
                        type="number"
                        {...form.register("delay", { valueAsNumber: true })}
                        data-testid="input-delay"
                      />
                    </div>
                  )}
                </div>

                {/* Premium Key */}
                {isPremium && premiumUsageCount >= 3 && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-4">
                    <Label className="flex items-center gap-2" htmlFor="key">
                      <Lock className="w-4 h-4" /> Premium Key
                    </Label>
                    <Input 
                      id="key"
                      type="password"
                      {...form.register("premiumKey")}
                      placeholder="Enter key..." 
                      data-testid="input-premium-key"
                    />
                    <p className="text-xs text-muted-foreground">Trial expired. Key required.</p>
                  </div>
                )}

                {/* Trial Warning */}
                {isPremium && premiumUsageCount < 3 && (
                  <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary rounded text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Free trials remaining: {3 - premiumUsageCount}</span>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isStreaming}
                  className="w-full"
                  data-testid="button-start-share"
                >
                  {isStreaming ? (
                    <span className="flex items-center gap-2">
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" /> Start Sharing
                    </span>
                  )}
                </Button>

              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-7">
          <Terminal logs={logs} isStreaming={isStreaming} />
        </div>
      </main>
    </div>
  );
}
