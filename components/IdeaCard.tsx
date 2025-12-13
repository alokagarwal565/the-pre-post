import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Trash2, Pencil, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface IdeaCardProps {
  id: string;
  content: string;
  createdAt: Date;
  isRefined?: boolean;
  isRefining?: boolean;
  onRefine?: (id: string) => void;
  onEdit?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
}

export function IdeaCard({
  id,
  content,
  createdAt,
  isRefined,
  isRefining,
  onRefine,
  onEdit,
  onDelete,
}: IdeaCardProps) {
  return (
    <Card className="hover-elevate group" data-testid={`card-idea-${id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{new Date(createdAt.toString() + 'Z').toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}</span>
          </div>
          {isRefined && (
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Refined
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm line-clamp-4">{content}</p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit?.(id, content)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          data-testid={`button-edit-idea-${id}`}
          disabled={isRefining}
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete?.(id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          data-testid={`button-delete-idea-${id}`}
          disabled={isRefining}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
        {!isRefined && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRefine?.(id)}
            disabled={isRefining}
            data-testid={`button-refine-${id}`}
          >
            {isRefining ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Refining...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Refine
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

