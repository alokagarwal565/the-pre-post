/**
 * Content Planner Page
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContentPlanner } from '@/components/ContentPlanner';
import { contentPlansApi, mindMapsApi } from '@/lib/api';
import { Spinner } from '@/components/Spinner';
import { useToast } from '@/hooks/use-toast';
import { GitBranch } from 'lucide-react';

interface MindMapTree {
  coreIdea: string;
  supportingPoints: Array<{
    point: string;
    examples: string[];
  }>;
  cta?: string;
}

import { Suspense } from 'react';

// Main component with Suspense
export default function PlannerPage() {
  return (
    <Suspense fallback={<PlannerLoading />}>
      <PlannerContent />
    </Suspense>
  );
}

// Loading component
function PlannerLoading() {
  return (
    <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
      <Spinner message="Loading content planner..." />
    </div>
  );
}

// Inner component with search params
function PlannerContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mindMapId = searchParams.get('mindMapId');

  const [clarifiedIdea, setClarifiedIdea] = useState<string>('');
  const [mindMapTree, setMindMapTree] = useState<MindMapTree | null>(null);
  const [mindMaps, setMindMaps] = useState<any[]>([]);
  const [selectedMindMapId, setSelectedMindMapId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isNavigatingToDraft, setIsNavigatingToDraft] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    if (mindMapId) {
      loadMindMapData(mindMapId);
    } else {
      loadMindMaps();
    }
  }, [user, router, mindMapId]);

  const loadMindMaps = async () => {
    try {
      setLoading(true);
      const response = await mindMapsApi.list();
      setMindMaps(response.mindMaps || []);
      // Auto-select first mind map if available
      if (response.mindMaps && response.mindMaps.length > 0) {
        const firstId = response.mindMaps[0].id;
        setSelectedMindMapId(firstId);
        await loadMindMapData(firstId);
      }
    } catch (error) {
      console.error('Failed to load mind maps:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMindMapData = async (id: string) => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await mindMapsApi.get(id);
      const mindMap = response.mindMap;
      
      // Get the clarified idea
      if (mindMap.clarified_idea) {
        setClarifiedIdea(mindMap.clarified_idea);
      } else if (mindMap.tree?.coreIdea) {
        setClarifiedIdea(mindMap.tree.coreIdea);
      }
      
      // Get the mind map tree structure
      if (mindMap.tree) {
        setMindMapTree(mindMap.tree);
      }
    } catch (error) {
      console.error('Failed to load mind map:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMindMapSelect = (value: string) => {
    setSelectedMindMapId(value);
    loadMindMapData(value);
  };

  const handlePlatformSelect = (platform: 'linkedin' | 'x' | 'blog') => {
    console.log('Selected platform:', platform);
  };

  const handleProceedToDraft = async (platform: 'linkedin' | 'x' | 'blog', suggestion: any) => {
    const activeId = mindMapId || selectedMindMapId;
    if (!activeId) return;
    setIsNavigatingToDraft(true);
    try {
      const response = await contentPlansApi.create(activeId, platform);
      router.push(`/drafts?contentPlanId=${response.plan.id}`);
    } catch (error: any) {
      console.error('Failed to create content plan:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to create content plan',
        variant: "destructive",
      });
      setIsNavigatingToDraft(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
        <Spinner message="Loading content planner..." />
      </div>
    );
  }

  // Show empty state if no mind maps
  if (!mindMapId && mindMaps.length === 0) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold mb-2">Content Planner</h1>
          <p className="text-muted-foreground">
            Get AI-powered recommendations for your content strategy
          </p>
        </div>
        <Card>
          <CardContent className="pt-6 text-center">
            <GitBranch className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No mind maps found.</p>
            <p className="text-sm text-muted-foreground">
              Create a mind map from the <span className="font-medium text-foreground">Mind Map</span> section first.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Content Planner</h1>
        <p className="text-muted-foreground">
          Get AI-powered recommendations for your content strategy
        </p>
      </div>

      {/* Mind Map Selector - only show if accessed directly */}
      {!mindMapId && mindMaps.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-heading">Select Mind Map</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedMindMapId} onValueChange={handleMindMapSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a mind map" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-w-[var(--radix-select-trigger-width)]">
                {mindMaps.map((mm) => (
                  <SelectItem key={mm.id} value={mm.id} className="truncate">
                    <span className="block truncate">
                      {mm.tree?.coreIdea || mm.clarified_idea || 'Mind Map'}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <ContentPlanner
        clarifiedIdea={clarifiedIdea || 'No idea available.'}
        mindMapTree={mindMapTree}
        onPlatformSelect={handlePlatformSelect}
        onProceedToDraft={handleProceedToDraft}
        isNavigating={isNavigatingToDraft}
      />
    </div>
  );
}
