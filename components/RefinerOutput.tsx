import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, HelpCircle, Compass, ArrowRight, Loader2 } from "lucide-react";

interface RefinerOutputProps {
  clarifiedIdea: string;
  questions: string[];
  angles: Array<{ name: string; description: string }>;
  onSelectAngle?: (angle: string) => void;
  onProceedToMindMap?: () => void;
  isNavigating?: boolean;
}

export function RefinerOutput({
  clarifiedIdea,
  questions,
  angles,
  onSelectAngle,
  onProceedToMindMap,
  isNavigating,
}: RefinerOutputProps) {
  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            <CardTitle className="font-heading text-lg">Clarified Idea</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-base bg-muted p-4 rounded-md">{clarifiedIdea}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            <CardTitle className="font-heading text-lg">Thinking Questions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {questions.map((question, index) => (
              <li key={index} className="flex gap-3">
                <span className="text-muted-foreground font-medium">{index + 1}.</span>
                <span>{question}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" />
            <CardTitle className="font-heading text-lg">Content Angles</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="overflow-hidden">
          <div className="flex flex-wrap gap-2">
            {angles.map((angle) => (
              <Badge
                key={angle.name}
                variant="outline"
                className="cursor-pointer px-3 py-1.5 text-sm hover-elevate whitespace-normal break-words"
                onClick={() => onSelectAngle?.(angle.name)}
                data-testid={`badge-angle-${angle.name.toLowerCase()}`}
              >
                {angle.name}
              </Badge>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {angles.map((angle) => (
              <div key={angle.name} className="text-sm break-words">
                <span className="font-medium">{angle.name}:</span>{" "}
                <span className="text-muted-foreground">{angle.description}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={onProceedToMindMap} 
          disabled={isNavigating}
          data-testid="button-proceed-mindmap"
        >
          {isNavigating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              Continue to Mind Map
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

