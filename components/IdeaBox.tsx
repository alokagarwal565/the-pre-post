import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Save, Mic, MicOff, Loader2 } from "lucide-react";
import { useVoiceToText } from "@/hooks/useVoiceToText";

interface IdeaBoxProps {
  onRefine?: (content: string) => void;
  onSave?: (content: string) => void;
}

export function IdeaBox({ onRefine, onSave }: IdeaBoxProps) {
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");

  const onTranscriptUpdate = useCallback((text: string) => {
    setLiveTranscript(text);
  }, []);

  const onTurnComplete = useCallback((text: string) => {
    setContent(prev => prev + (prev ? "\n" : "") + text);
  }, []);

  const { isLive, start, stop, error } = useVoiceToText(onTranscriptUpdate, onTurnComplete);

  const handleToggleVoice = async () => {
    if (isLive) {
      await stop();
      setLiveTranscript("");
    } else {
      await start();
    }
  };

  const handleSave = async () => {
    if (!content.trim() && !liveTranscript.trim()) return;
    setIsSaving(true);
    const finalContent = content + (liveTranscript ? (content ? "\n" : "") + liveTranscript : "");
    onSave?.(finalContent);
    setTimeout(() => setIsSaving(false), 500);
  };

  const handleRefine = () => {
    const finalContent = content + (liveTranscript ? (content ? "\n" : "") + liveTranscript : "");
    if (!finalContent.trim()) return;
    onRefine?.(finalContent);
  };

  return (
    <Card className="max-w-3xl w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-heading text-xl">Drop your thoughts here</CardTitle>
            <p className="text-sm text-muted-foreground">
              No formatting. No pressure. Just raw ideas.
            </p>
          </div>
          <Button
            variant={isLive ? "destructive" : "outline"}
            size="icon"
            onClick={handleToggleVoice}
            className={isLive ? "animate-pulse" : ""}
            title={isLive ? "Stop recording" : "Start voice input"}
          >
            {isLive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
        </div>
        {error && <p className="text-xs text-destructive mt-2">{error}</p>}
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Textarea
            value={content + (liveTranscript ? (content ? "\n" : "") + liveTranscript : "")}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isLive ? "Listening..." : "What's on your mind? A random thought, half-baked idea, voice note transcription..."}
            className={`min-h-[200px] resize-none text-base transition-colors ${isLive ? "border-primary/50 bg-primary/5" : ""}`}
            data-testid="input-idea-content"
          />
          {isLive && (
            <div className="absolute bottom-3 right-3 flex items-center gap-2 text-xs text-primary animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              Live Transcription
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between gap-4 pt-4">
        <Button
          variant="outline"
          onClick={handleSave}
          disabled={(!content.trim() && !liveTranscript.trim()) || isSaving}
          data-testid="button-save-idea"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save Draft"}
        </Button>
        <Button
          onClick={handleRefine}
          disabled={!content.trim() && !liveTranscript.trim()}
          data-testid="button-refine-idea"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Refine with AI
        </Button>
      </CardFooter>
    </Card>
  );
}
