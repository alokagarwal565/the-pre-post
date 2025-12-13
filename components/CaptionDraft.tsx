import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Copy, 
  RefreshCw, 
  Check, 
  Linkedin, 
  Twitter, 
  FileText, 
  Trash2, 
  Calendar, 
  Image as ImageIcon,
  Download,
  Loader2,
  Clock,
  ExternalLink
} from "lucide-react";

type Platform = "linkedin" | "x" | "blog";

interface PostTimeSuggestion {
  date: string;
  day: string;
  time: string;
  calendarUrl: string;
}

interface CaptionDraftProps {
  platform: Platform;
  initialDraft: string;
  characterLimit?: number;
  onSave?: (content: string) => void;
  onDelete?: () => void;
  onRegenerate?: () => void;
  onSuggestTime?: () => Promise<PostTimeSuggestion | null>;
  onGenerateImage?: (content: string) => Promise<string | null>;
  onMarkPosted?: () => Promise<void>;
}

const platformConfig = {
  linkedin: {
    icon: Linkedin,
    label: "LinkedIn",
    limit: 3000,
  },
  x: {
    icon: Twitter,
    label: "X (Twitter)",
    limit: 280,
  },
  blog: {
    icon: FileText,
    label: "Blog",
    limit: undefined,
  },
};

export function CaptionDraft({
  platform,
  initialDraft,
  onSave,
  onDelete,
  onRegenerate,
  onSuggestTime,
  onGenerateImage,
  onMarkPosted,
}: CaptionDraftProps) {
  const [content, setContent] = useState(initialDraft);
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarkingPosted, setIsMarkingPosted] = useState(false);
  
  // Post time suggestion state
  const [timeSuggestion, setTimeSuggestion] = useState<PostTimeSuggestion | null>(null);
  const [isLoadingTime, setIsLoadingTime] = useState(false);
  
  // Image generation state
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const config = platformConfig[platform];
  const charCount = content.length;
  const isOverLimit = config.limit && charCount > config.limit;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    setIsRegenerating(true);
    onRegenerate?.();
    setTimeout(() => setIsRegenerating(false), 1000);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSuggestTime = async () => {
    if (!onSuggestTime) return;
    setIsLoadingTime(true);
    try {
      const suggestion = await onSuggestTime();
      setTimeSuggestion(suggestion);
    } finally {
      setIsLoadingTime(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!onGenerateImage) return;
    setIsGeneratingImage(true);
    try {
      const imageUrl = await onGenerateImage(content);
      setGeneratedImageUrl(imageUrl);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleMarkPosted = async () => {
    if (!onMarkPosted) return;
    setIsMarkingPosted(true);
    try {
      await onMarkPosted();
    } finally {
      setIsMarkingPosted(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!generatedImageUrl) return;
    
    try {
      const response = await fetch(generatedImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${platform}-post-image.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  const Icon = config.icon;

  return (
    <Card className="max-w-3xl w-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5" />
            <div>
              <CardTitle className="font-heading text-xl">{config.label} Draft</CardTitle>
              <CardDescription>Edit and refine your content</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {config.limit && (
              <Badge variant={isOverLimit ? "destructive" : "secondary"}>
                {charCount} / {config.limit}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[250px] text-base resize-none"
          data-testid="input-draft-content"
        />

        {/* Post Time Suggestion */}
        {timeSuggestion && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="w-4 h-4 text-primary" />
              Suggested Posting Time
            </div>
            <div className="text-sm">
              <span className="font-medium">{timeSuggestion.day}, {timeSuggestion.date}</span> at{" "}
              <span className="font-medium">{timeSuggestion.time}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(timeSuggestion.calendarUrl, '_blank')}
              className="mt-2"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Add to Google Calendar
              <ExternalLink className="w-3 h-3 ml-2" />
            </Button>
          </div>
        )}

        {/* Generated Image */}
        {generatedImageUrl && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ImageIcon className="w-4 h-4 text-primary" />
              Generated Image
            </div>
            <div className="relative rounded-lg overflow-hidden border">
              <img 
                src={generatedImageUrl} 
                alt="Generated post image" 
                className="w-full h-auto rounded-lg"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadImage}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Image
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        {/* Action Buttons Row 1 */}
        <div className="flex justify-between gap-4 flex-wrap w-full">
          <div className="flex gap-2 flex-wrap">
            {onRegenerate && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isRegenerating}
                data-testid="button-regenerate"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRegenerating ? "animate-spin" : ""}`} />
                Regenerate
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleCopy} data-testid="button-copy">
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
            {onSuggestTime && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSuggestTime}
                disabled={isLoadingTime}
              >
                {isLoadingTime ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Suggest Time
                  </>
                )}
              </Button>
            )}
            {onGenerateImage && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateImage}
                disabled={isGeneratingImage}
              >
                {isGeneratingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Save and Delete Row */}
        <div className="flex justify-end gap-2 w-full pt-4 border-t">
          {onDelete && (
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-destructive mr-auto"
              onClick={handleDelete}
              disabled={isDeleting}
              data-testid="button-delete-draft"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          )}

          {onMarkPosted && (
            <Button
              variant="secondary"
              onClick={handleMarkPosted}
              disabled={isMarkingPosted}
              className="bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
            >
              {isMarkingPosted ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Marking...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Mark as Posted
                </>
              )}
            </Button>
          )}

          <Button
            onClick={() => onSave?.(content)}
            disabled={!!isOverLimit}
            data-testid="button-save-draft"
          >
            Save Draft
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
