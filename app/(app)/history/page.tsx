/**
 * Content History Page
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ContentHistory } from '@/components/ContentHistory';
import { contentHistoryApi } from '@/lib/api';
import { Spinner } from '@/components/Spinner';

export default function HistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    loadHistory();
  }, [user, router]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await contentHistoryApi.list();
      setHistory(
        response.history.map((item: any) => ({
          id: item.id,
          idea: item.idea,
          angle: item.angle,
          platform: item.platform,
          createdAt: new Date(item.posted_at),
        }))
      );
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    console.log('Exporting history...');
    // TODO: Implement export functionality
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
        <Spinner message="Loading history..." />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Content History</h1>
        <p className="text-muted-foreground">
          Track your content patterns and get AI-powered insights
        </p>
      </div>

      <ContentHistory
        items={history}
        insights={insights}
        onExport={handleExport}
      />
    </div>
  );
}

