/**
 * Refiner Page - AI Idea Refinement
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefinerOutput } from '@/components/RefinerOutput';
import { LoadingState } from '@/components/LoadingState';
import { Spinner } from '@/components/Spinner';
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
import { Lightbulb, Sparkles, Calendar, Trash2 } from 'lucide-react';
import { ideasApi, refinedIdeasApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

import { Suspense } from 'react';

// Main component with Suspense
export default function RefinerPage() {
  return (
    <Suspense fallback={<RefinerLoading />}>
      <RefinerContent />
    </Suspense>
  );
}

// Loading component
function RefinerLoading() {
  return (
    <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
      <LoadingState message="Loading..." />
    </div>
  );
}

// Inner component with search params
function RefinerContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ideaId = searchParams.get('ideaId');
  
  const [rawIdea, setRawIdea] = useState<any>(null);
  const [refinedIdea, setRefinedIdea] = useState<any>(null);
  const [refinedIdeas, setRefinedIdeas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isRefining, setIsRefining] = useState(false);
  const [isNavigatingToMindMap, setIsNavigatingToMindMap] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    if (ideaId) {
      loadIdea();
    } else {
      loadRefinedIdeas();
    }
  }, [user, router, ideaId]);

  const loadRefinedIdeas = async () => {
    try {
      setIsLoadingList(true);
      const response = await refinedIdeasApi.list();
      setRefinedIdeas(response.refinedIdeas || []);
    } catch (error) {
      console.error('Failed to load refined ideas:', error);
    } finally {
      setIsLoadingList(false);
    }
  };

  const loadIdea = async () => {
    if (!ideaId) return;
    try {
      setIsLoading(true);
      const ideas = await ideasApi.list();
      const idea = ideas.ideas.find((i: any) => i.id === ideaId);
      if (idea) {
        setRawIdea(idea);
        // Check if already refined
        try {
          const refined = await ideasApi.refine(ideaId);
          setRefinedIdea(refined.refinedIdea);
        } catch (error) {
          // Not refined yet
        }
      }
    } catch (error) {
      console.error('Failed to load idea:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!ideaId || !rawIdea) return;
    setIsRefining(true);
    try {
      const response = await ideasApi.refine(ideaId);
      setRefinedIdea(response.refinedIdea);
    } catch (error: any) {
      console.error('Failed to refine idea:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to refine idea',
        variant: "destructive",
      });
    } finally {
      setIsRefining(false);
    }
  };

  const handleSelectAngle = (angle: string) => {
    console.log('Selected angle:', angle);
  };

  const handleProceedToMindMap = () => {
    if (refinedIdea) {
      setIsNavigatingToMindMap(true);
      router.push(`/mindmap?refinedIdeaId=${refinedIdea.id}`);
    }
  };

  const handleViewRefinedIdea = (refinedIdeaItem: any) => {
    router.push(`/refiner?ideaId=${refinedIdeaItem.idea_id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, refinedIdeaId: string) => {
    e.stopPropagation(); // Prevent card click
    setIdeaToDelete(refinedIdeaId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!ideaToDelete) return;
    try {
      await refinedIdeasApi.delete(ideaToDelete);
      setRefinedIdeas(refinedIdeas.filter((item) => item.id !== ideaToDelete));
      toast({
        title: "Deleted",
        description: "Refined idea has been deleted.",
      });
    } catch (error: any) {
      console.error('Failed to delete refined idea:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to delete refined idea',
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setIdeaToDelete(null);
    }
  };

  // Loading state for specific idea
  if (isLoading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
        <LoadingState message="Loading idea" />
      </div>
    );
  }

  // Show list of refined ideas when no ideaId is provided
  if (!ideaId) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold mb-2">Idea Refiner</h1>
          <p className="text-muted-foreground">
            AI-powered clarity for your raw thoughts
          </p>
        </div>

        {isLoadingList ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Spinner message="Loading refined ideas..." />
          </div>
        ) : refinedIdeas.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No refined ideas yet.</p>
              <p className="text-sm text-muted-foreground">
                Go to the <span className="font-medium text-foreground">Idea Box</span> to create and refine your ideas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Click on any refined idea to view details and proceed to Mind Map
            </p>
            <div className="grid gap-4">
              {refinedIdeas.map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer hover-elevate transition-all group"
                  onClick={() => handleViewRefinedIdea(item)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-primary" />
                        <CardTitle className="font-heading text-base line-clamp-1">
                          {item.original_idea}
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
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.clarified_idea}
                    </p>
                    {item.angles && item.angles.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.angles.slice(0, 4).map((angle: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {angle}
                          </Badge>
                        ))}
                      </div>
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
                This action cannot be undone. This will permanently delete the refined idea
                and any associated mind maps and drafts.
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

  if (!rawIdea) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <p className="text-muted-foreground">Idea not found. Go back to Idea Box to select an idea.</p>
      </div>
    );
  }

  if (isRefining) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
        <LoadingState message="AI is refining your idea" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Idea Refiner</h1>
        <p className="text-muted-foreground">
          AI-powered clarity for your raw thoughts
        </p>
      </div>

      <div className="space-y-6 max-w-3xl">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="font-heading text-lg">Original Idea</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-base bg-muted p-4 rounded-md">{rawIdea.content}</p>
          </CardContent>
        </Card>

        {refinedIdea ? (
          <RefinerOutput
            clarifiedIdea={refinedIdea.clarified_idea}
            questions={Array.isArray(refinedIdea.questions) ? refinedIdea.questions : []}
            angles={Array.isArray(refinedIdea.angles) 
              ? refinedIdea.angles.map((a: string) => ({ name: a, description: `${a} angle` }))
              : []}
            onSelectAngle={handleSelectAngle}
            onProceedToMindMap={handleProceedToMindMap}
            isNavigating={isNavigatingToMindMap}
          />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <button
                onClick={handleRefine}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
              >
                Refine with AI
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


