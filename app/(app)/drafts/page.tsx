/**
 * Drafts Page - Caption Draft
 */

'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CaptionDraft } from '@/components/CaptionDraft';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, Linkedin, Twitter } from 'lucide-react';
import { draftsApi } from '@/lib/api';
import { Spinner } from '@/components/Spinner';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

// Main component with Suspense
export default function DraftsPage() {
  return (
    <Suspense fallback={<DraftsLoading />}>
      <DraftsContent />
    </Suspense>
  );
}

// Loading component
function DraftsLoading() {
  return (
    <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
      <Spinner message="Loading drafts..." />
    </div>
  );
}

// Inner component with search params
function DraftsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const contentPlanId = searchParams.get('contentPlanId');

  const [drafts, setDrafts] = useState<any[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isGeneratingRef = useRef(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    if (contentPlanId) {
      generateDraft();
    } else {
      loadDrafts();
    }
  }, [user, router, contentPlanId]);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const response = await draftsApi.list();
      setDrafts(response.drafts || []);
      // Auto-select the first draft if available
      if (response.drafts && response.drafts.length > 0) {
        setSelectedDraft(response.drafts[0]);
      }
    } catch (error) {
      console.error('Failed to load drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDraft = async () => {
    if (!contentPlanId || isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    try {
      setLoading(true);
      const response = await draftsApi.create(contentPlanId);
      setSelectedDraft(response.draft);
      // Reload drafts list
      const listResponse = await draftsApi.list();
      setDrafts(listResponse.drafts || []);
    } catch (error: any) {
      console.error('Failed to generate draft:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to generate draft',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      isGeneratingRef.current = false;
    }
  };

  const handleSave = async (content: string) => {
    if (!selectedDraft) return;
    try {
      const response = await draftsApi.update(selectedDraft.id, content);
      setSelectedDraft(response.draft);
      // Update in list
      setDrafts(drafts.map(d => d.id === selectedDraft.id ? response.draft : d));
      toast({
        title: "Success",
        description: "Draft saved successfully!",
      });
    } catch (error: any) {
      console.error('Failed to save draft:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to save draft',
        variant: "destructive",
      });
    }
  };

  const handleRegenerate = async () => {
    if (contentPlanId) {
      await generateDraft();
    }
  };

  const handleDelete = async () => {
    if (!selectedDraft) return;
    try {
      await draftsApi.delete(selectedDraft.id);
      setDrafts(drafts.filter(d => d.id !== selectedDraft.id));
      setSelectedDraft(drafts.length > 1 ? drafts.find(d => d.id !== selectedDraft.id) || null : null);
      toast({
        title: "Success",
        description: "Draft deleted successfully!",
      });
    } catch (error: any) {
      console.error('Failed to delete draft:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to delete draft',
        variant: "destructive",
      });
    }
  };

  const handleSuggestTime = async () => {
    if (!selectedDraft) return null;
    try {
      const response = await draftsApi.suggestPostTime(selectedDraft.id);
      return response.suggestion;
    } catch (error: any) {
      console.error('Failed to get time suggestion:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to suggest post time',
        variant: "destructive",
      });
      return null;
    }
  };

  const handleGenerateImage = async (content: string) => {
    if (!selectedDraft) return null;
    try {
      const response = await draftsApi.generateImage(content, selectedDraft.platform);
      return response.imageUrl;
    } catch (error: any) {
      console.error('Failed to generate image:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to generate image',
        variant: "destructive",
      });
      return null;
    }
  };

  const handleMarkPosted = async () => {
    if (!selectedDraft) return;
    try {
      await draftsApi.markAsPosted(selectedDraft.id);
      setDrafts(drafts.filter(d => d.id !== selectedDraft.id));
      setSelectedDraft(drafts.length > 1 ? drafts.find(d => d.id !== selectedDraft.id) || null : null);
      toast({
        title: "Success",
        description: "Draft marked as posted and moved to history!",
      });
    } catch (error: any) {
      console.error('Failed to mark as posted:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to mark as posted',
        variant: "destructive",
      });
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      case 'x': return <Twitter className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
        <Spinner message={contentPlanId ? "Generating draft..." : "Loading drafts..."} />
      </div>
    );
  }

  if (drafts.length === 0 && !selectedDraft) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={FileText}
          title="No drafts yet"
          description="Complete the planning step to generate your first draft."
          actionLabel="Go to Ideas"
          onAction={() => router.push('/ideas')}
        />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Caption Drafts</h1>
        <p className="text-muted-foreground">
          Edit and refine your AI-generated content
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Drafts List */}
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-medium">Your Drafts</h2>
          <div className="space-y-3">
            {drafts.map((draft) => (
              <Card 
                key={draft.id}
                className={`cursor-pointer hover-elevate ${selectedDraft?.id === draft.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedDraft(draft)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getPlatformIcon(draft.platform)}
                      {draft.platform}
                    </Badge>
                    {/* Timestamp removed as requested */}
                  </div>
                  <p className="text-sm line-clamp-3">{draft.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Draft Editor */}
        <div className="lg:col-span-2">
          {selectedDraft ? (
            <CaptionDraft
              key={selectedDraft.id}
              platform={selectedDraft.platform as 'linkedin' | 'x' | 'blog'}
              initialDraft={selectedDraft.content}
              onSave={handleSave}
              onDelete={handleDelete}
              onRegenerate={contentPlanId ? handleRegenerate : undefined}
              onSuggestTime={handleSuggestTime}
              onGenerateImage={handleGenerateImage}
              onMarkPosted={handleMarkPosted}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Select a draft to edit</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}


