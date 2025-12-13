/**
 * Ideas Page - Idea Box
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { IdeaBox } from '@/components/IdeaBox';
import { IdeaCard } from '@/components/IdeaCard';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Lightbulb } from 'lucide-react';
import { ideasApi } from '@/lib/api';
import { Spinner } from '@/components/Spinner';
import { useToast } from '@/hooks/use-toast';

export default function IdeasPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<{ id: string; content: string } | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [refiningId, setRefiningId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    loadIdeas();
  }, [user, router]);

  const loadIdeas = async () => {
    try {
      const response = await ideasApi.list();
      setIdeas(response.ideas);
    } catch (error) {
      console.error('Failed to load ideas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (content: string) => {
    try {
      const response = await ideasApi.create(content, 'text');
      setIdeas([response.idea, ...ideas]);
    } catch (error: any) {
      console.error('Failed to save idea:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to save idea',
        variant: "destructive",
      });
    }
  };

  const handleRefine = async (content: string) => {
    try {
      const response = await ideasApi.create(content, 'text');
      router.push(`/refiner?ideaId=${response.idea.id}`);
    } catch (error: any) {
      console.error('Failed to refine idea:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to refine idea',
        variant: "destructive",
      });
    }
  };

  const handleRefineExisting = async (id: string) => {
    setRefiningId(id);
    router.push(`/refiner?ideaId=${id}`);
  };

  const handleEdit = (id: string, content: string) => {
    setEditingIdea({ id, content });
    setEditContent(content);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingIdea || !editContent.trim()) return;
    
    setSaving(true);
    try {
      const response = await ideasApi.update(editingIdea.id, editContent.trim());
      setIdeas(ideas.map((idea) => 
        idea.id === editingIdea.id ? response.idea : idea
      ));
      setEditDialogOpen(false);
      setEditingIdea(null);
      setEditContent('');
    } catch (error: any) {
      console.error('Failed to update idea:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to update idea',
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await ideasApi.delete(id);
      setIdeas(ideas.filter((idea) => idea.id !== id));
    } catch (error: any) {
      console.error('Failed to delete idea:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to delete idea',
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
        <Spinner message="Loading ideas..." />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Idea Box</h1>
        <p className="text-muted-foreground">
          Drop your raw thoughts here. No pressure, no formatting.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <IdeaBox onSave={handleSave} onRefine={handleRefine} />
        </div>

        <div className="space-y-4">
          <h2 className="font-heading text-lg font-medium">Recent Ideas</h2>
          {ideas.length > 0 ? (
            <div className="space-y-4">
              {ideas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  id={idea.id}
                  content={idea.content}
                  createdAt={new Date(idea.created_at)}
                  isRefined={false}
                  isRefining={refiningId === idea.id}
                  onRefine={handleRefineExisting}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Lightbulb}
              title="No ideas yet"
              description="Your saved ideas will appear here."
            />
          )}
        </div>
      </div>

      {/* Edit Idea Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Idea</DialogTitle>
            <DialogDescription>
              Make changes to your idea below.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Your idea..."
              className="min-h-[150px] resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={saving || !editContent.trim()}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

