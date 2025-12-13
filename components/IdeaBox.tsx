import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Save } from "lucide-react";

interface IdeaBoxProps {
  onRefine?: (content: string) => void;
  onSave?: (content: string) => void;
}

export function IdeaBox({ onRefine, onSave }: IdeaBoxProps) {
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    setIsSaving(true);
    onSave?.(content);
    setTimeout(() => setIsSaving(false), 500);
  };

  const handleRefine = () => {
    if (!content.trim()) return;
    onRefine?.(content);
  };

  return (
    <Card className="max-w-3xl w-full">
      <CardHeader className="pb-4">
        <CardTitle className="font-heading text-xl">Drop your thoughts here</CardTitle>
        <p className="text-sm text-muted-foreground">
          No formatting. No pressure. Just raw ideas.
        </p>
      </CardHeader>
      <CardContent>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind? A random thought, half-baked idea, voice note transcription..."
          className="min-h-[200px] resize-none text-base"
          data-testid="input-idea-content"
        />
      </CardContent>
      <CardFooter className="flex justify-between gap-4 pt-4">
        <Button
          variant="outline"
          onClick={handleSave}
          disabled={!content.trim() || isSaving}
          data-testid="button-save-idea"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save Draft"}
        </Button>
        <Button
          onClick={handleRefine}
          disabled={!content.trim()}
          data-testid="button-refine-idea"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Refine with AI
        </Button>
      </CardFooter>
    </Card>
  );
}
