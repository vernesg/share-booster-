import { useEffect, useRef } from "react";
import { type LogMessage } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface TerminalProps {
  logs: LogMessage[];
  isStreaming: boolean;
}

export function Terminal({ logs, isStreaming }: TerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Execution Logs</h3>
          <div className={`w-2 h-2 rounded-full transition-colors ${isStreaming ? "bg-green-500" : "bg-muted"}`} />
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="space-y-2 font-mono text-sm pr-4">
            <AnimatePresence initial={false}>
              {logs.length === 0 && (
                <div className="text-muted-foreground italic">
                  Logs will appear here when you start a task...
                </div>
              )}
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 py-1"
                >
                  <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                    [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                  </span>
                  
                  <div className="mt-0.5 shrink-0">
                    {log.level === 'error' && <AlertCircle className="w-4 h-4 text-destructive" />}
                    {log.level === 'success' && <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-500" />}
                    {log.level === 'info' && <Info className="w-4 h-4 text-primary" />}
                    {log.level === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />}
                  </div>

                  <span className={`break-all ${
                    log.level === 'error' ? 'text-destructive' :
                    log.level === 'success' ? 'text-green-600 dark:text-green-500' :
                    log.level === 'warning' ? 'text-yellow-600 dark:text-yellow-500' :
                    'text-foreground'
                  }`}>
                    {log.message}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
