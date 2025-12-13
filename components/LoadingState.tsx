import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Processing..." }: LoadingStateProps) {
  return (
    <Card className="max-w-md w-full">
      <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">{message}</span>
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
