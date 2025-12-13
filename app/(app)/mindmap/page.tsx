/**
 * Mind Map Page
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MindMapView } from '@/components/MindMapView';
import { mindMapsApi } from '@/lib/api';
import { Spinner } from '@/components/Spinner';
import { GitBranch, Calendar, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { Suspense } from 'react';

// Main component with Suspense
export default function MindMapPage() {
  return (
    <Suspense fallback={<MindMapLoading />}>
      <MindMapContent />
    </Suspense>
  );
}

// Loading component
function MindMapLoading() {
  return (
    <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
      <Spinner message="Loading mind map..." />
    </div>
  );
}

// Inner component with search params
function MindMapContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const refinedIdeaId = searchParams.get('refinedIdeaId');
  const mindMapIdParam = searchParams.get('mindMapId');

  const [mindMap, setMindMap] = useState<any>(null);
  const [mindMapId, setMindMapId] = useState<string | null>(null);
  const [mindMaps, setMindMaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isNavigatingToPlanner, setIsNavigatingToPlanner] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mindMapToDelete, setMindMapToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    if (refinedIdeaId) {
      loadMindMap();
    } else if (mindMapIdParam) {
      loadExistingMindMap();
    } else {
      loadMindMaps();
    }
  }, [user, router, refinedIdeaId, mindMapIdParam]);

  const loadMindMaps = async () => {
    try {
      setIsLoadingList(true);
      const response = await mindMapsApi.list();
      setMindMaps(response.mindMaps || []);
    } catch (error) {
      console.error('Failed to load mind maps:', error);
    } finally {
      setIsLoadingList(false);
    }
  };

  const loadExistingMindMap = async () => {
    if (!mindMapIdParam) return;
    try {
      setLoading(true);
      const response = await mindMapsApi.get(mindMapIdParam);
      const tree = response.mindMap.tree;
      
      // Convert to MindMapView format
      const mindMapData = {
        id: 'root',
        text: tree.coreIdea || 'Core Idea',
        children: tree.supportingPoints?.map((point: any, index: number) => ({
          id: `point-${index}`,
          text: point.point || point,
          children: point.examples?.map((ex: string, exIndex: number) => ({
            id: `example-${index}-${exIndex}`,
            text: ex,
          })) || [],
        })) || [],
      };
      
      if (tree.cta) {
        mindMapData.children.push({
          id: 'cta',
          text: tree.cta,
          children: [],
        });
      }
      
      setMindMapId(mindMapIdParam);
      setMindMap(mindMapData);
    } catch (error) {
      console.error('Failed to load mind map:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMindMap = async () => {
    if (!refinedIdeaId) return;
    try {
      setLoading(true);
      // Try to get existing mind map or create new one
      const response = await mindMapsApi.create(refinedIdeaId);
      const tree = response.mindMap.tree;
      
      // Convert to MindMapView format
      const mindMapData = {
        id: 'root',
        text: tree.coreIdea || 'Core Idea',
        children: tree.supportingPoints?.map((point: any, index: number) => ({
          id: `point-${index}`,
          text: point.point || point,
          children: point.examples?.map((ex: string, exIndex: number) => ({
            id: `example-${index}-${exIndex}`,
            text: ex,
          })) || [],
        })) || [],
      };
      
      if (tree.cta) {
        mindMapData.children.push({
          id: 'cta',
          text: tree.cta,
          children: [],
        });
      }
      
      setMindMapId(response.mindMap.id);
      setMindMap(mindMapData);
    } catch (error) {
      console.error('Failed to load mind map:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: any): Promise<void> => {
    if (!mindMapId) return;
    
    // Convert back to API format
    const tree = {
      coreIdea: data.text,
      supportingPoints: data.children?.filter((child: any) => child.id !== 'cta').map((child: any) => ({
        point: child.text,
        examples: child.children?.map((c: any) => c.text) || [],
      })) || [],
      cta: data.children?.find((c: any) => c.id === 'cta')?.text || '',
    };
    
    await mindMapsApi.update(mindMapId, tree);
  };

  const handleProceedToPlanner = () => {
    if (mindMapId) {
      setIsNavigatingToPlanner(true);
      router.push(`/planner?mindMapId=${mindMapId}`);
    }
  };

  const handleViewMindMap = (mindMapItem: any) => {
    router.push(`/mindmap?mindMapId=${mindMapItem.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, mindMapId: string) => {
    e.stopPropagation(); // Prevent card click
    setMindMapToDelete(mindMapId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!mindMapToDelete) return;
    try {
      await mindMapsApi.delete(mindMapToDelete);
      setMindMaps(mindMaps.filter((item) => item.id !== mindMapToDelete));
      toast({
        title: "Deleted",
        description: "Mind map has been deleted.",
      });
    } catch (error: any) {
      console.error('Failed to delete mind map:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to delete mind map',
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setMindMapToDelete(null);
    }
  };

  // Loading state for specific mind map
  if ((refinedIdeaId || mindMapIdParam) && loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
        <Spinner message="Loading mind map..." />
      </div>
    );
  }

  // Show list of mind maps when no refinedIdeaId is provided
  if (!refinedIdeaId) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold mb-2">Mind Map</h1>
          <p className="text-muted-foreground">
            Structure your thinking visually
          </p>
        </div>

        {isLoadingList ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Spinner message="Loading mind maps..." />
          </div>
        ) : mindMaps.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <GitBranch className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No mind maps yet.</p>
              <p className="text-sm text-muted-foreground">
                Go to the <span className="font-medium text-foreground">Refiner</span> to create a mind map from your refined ideas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Click on any mind map to view and edit it
            </p>
            <div className="grid gap-4">
              {mindMaps.map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer hover-elevate transition-all group"
                  onClick={() => handleViewMindMap(item)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-5 h-5 text-primary" />
                        <CardTitle className="font-heading text-base line-clamp-1">
                          {item.tree?.coreIdea || 'Mind Map'}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.created_at).toLocaleDateString()}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDeleteClick(e, item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {item.tree?.supportingPoints && item.tree.supportingPoints.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tree.supportingPoints.slice(0, 4).map((point: any, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {typeof point === 'string' ? point : point.point}
                          </Badge>
                        ))}
                        {item.tree.supportingPoints.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{item.tree.supportingPoints.length - 4} more
                          </Badge>
                        )}
                      </div>
                    )}
                    {item.clarified_idea && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.clarified_idea}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the mind map
                and any associated content plans and drafts.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  if (!mindMap) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <p className="text-muted-foreground">Mind map not found. Go back to Refiner to create one.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Mind Map</h1>
        <p className="text-muted-foreground">
          Structure your thinking visually
        </p>
      </div>

      <MindMapView
        initialData={mindMap}
        onSave={handleSave}
        onProceedToPlanner={handleProceedToPlanner}
        isNavigating={isNavigatingToPlanner}
      />
    </div>
  );
}


