import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Plus, Trash2, Edit2, Check, X, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MindMapNode {
  id: string;
  text: string;
  children?: MindMapNode[];
}

interface MindMapViewProps {
  initialData: MindMapNode;
  onSave?: (data: MindMapNode) => Promise<void>;
  onProceedToPlanner?: () => void;
  isNavigating?: boolean;
}

function TreeNode({
  node,
  depth = 0,
  onUpdate,
  onDelete,
  onAddChild,
}: {
  node: MindMapNode;
  depth?: number;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(node.text);

  const hasChildren = node.children && node.children.length > 0;

  const handleSave = () => {
    onUpdate(node.id, editText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(node.text);
    setIsEditing(false);
  };

  return (
    <div className="select-none">
      <div
        className="flex items-center gap-2 py-1.5 px-2 rounded-md hover-elevate group"
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-5 h-5 flex items-center justify-center text-muted-foreground"
          data-testid={`toggle-node-${node.id}`}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
          )}
        </button>

        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="h-7 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
              data-testid={`input-edit-node-${node.id}`}
            />
            <Button size="icon" variant="ghost" onClick={handleSave} className="h-7 w-7">
              <Check className="w-3 h-3" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleCancel} className="h-7 w-7">
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <>
            <span
              className={`flex-1 text-sm ${depth === 0 ? "font-medium" : ""}`}
              data-testid={`text-node-${node.id}`}
            >
              {node.text}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-6 w-6"
                data-testid={`button-edit-node-${node.id}`}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onAddChild(node.id)}
                className="h-6 w-6"
                data-testid={`button-add-child-${node.id}`}
              >
                <Plus className="w-3 h-3" />
              </Button>
              {depth > 0 && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onDelete(node.id)}
                  className="h-6 w-6"
                  data-testid={`button-delete-node-${node.id}`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MindMapView({ initialData, onSave, onProceedToPlanner, isNavigating }: MindMapViewProps) {
  const [data, setData] = useState<MindMapNode>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const updateNode = (id: string, text: string) => {
    const updateRecursive = (node: MindMapNode): MindMapNode => {
      if (node.id === id) {
        return { ...node, text };
      }
      if (node.children) {
        return { ...node, children: node.children.map(updateRecursive) };
      }
      return node;
    };
    setData(updateRecursive(data));
  };

  const deleteNode = (id: string) => {
    const deleteRecursive = (node: MindMapNode): MindMapNode => {
      if (node.children) {
        return {
          ...node,
          children: node.children.filter((c) => c.id !== id).map(deleteRecursive),
        };
      }
      return node;
    };
    setData(deleteRecursive(data));
  };

  const addChild = (parentId: string) => {
    const addRecursive = (node: MindMapNode): MindMapNode => {
      if (node.id === parentId) {
        const newChild: MindMapNode = {
          id: `node-${Date.now()}`,
          text: "New point",
        };
        return {
          ...node,
          children: [...(node.children || []), newChild],
        };
      }
      if (node.children) {
        return { ...node, children: node.children.map(addRecursive) };
      }
      return node;
    };
    setData(addRecursive(data));
  };

  const handleSaveChanges = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(data);
      toast({
        title: "Changes saved",
        description: "Your mind map has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="max-w-3xl w-full">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <CardTitle className="font-heading text-xl">Mind Map</CardTitle>
        <Button 
          variant="outline" 
          onClick={handleSaveChanges} 
          disabled={isSaving}
          data-testid="button-save-mindmap"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md p-2">
          <TreeNode
            node={data}
            onUpdate={updateNode}
            onDelete={deleteNode}
            onAddChild={addChild}
          />
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={onProceedToPlanner} disabled={isNavigating} data-testid="button-proceed-planner">
            {isNavigating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Continue to Planner
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

