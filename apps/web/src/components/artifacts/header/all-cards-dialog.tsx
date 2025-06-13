import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TighterText } from "@/components/ui/header";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { X } from 'lucide-react';

interface AllCardsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threadId: string;
}

interface MarkdownCard {
  id: string;
  title: string;
  content: string;
}

export function AllCardsDialog({ open, onOpenChange, threadId }: AllCardsDialogProps) {
  const [markdowns, setMarkdowns] = useState<MarkdownCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<MarkdownCard | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const supabase = createSupabaseClient();

  const fetchMarkdowns = async () => {
    if (!threadId) return;
    try {
      setLoading(true);
      const { data: artifacts, error: artifactsError } = await supabase
        .from('artifacts')
        .select('id')
        .eq('thread_id', threadId);
      if (artifactsError) throw artifactsError;
      if (artifacts && artifacts.length > 0) {
        const { data: contents, error: contentsError } = await supabase
          .from('artifact_contents')
          .select('id, title, full_markdown')
          .in('artifact_id', artifacts.map(a => a.id))
          .eq('type', 'text');
        if (contentsError) throw contentsError;
        if (contents) {
          setMarkdowns(contents.map(c => ({
            id: c.id,
            title: c.title,
            content: c.full_markdown || ''
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching markdowns:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchMarkdowns();
    }
    // eslint-disable-next-line
  }, [threadId, open]);

  // 删除卡片
  const handleDeleteCard = async (id: string) => {
    await supabase.from('artifact_contents').delete().eq('id', id);
    fetchMarkdowns();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-8 bg-white rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-light text-gray-800">
            <TighterText>所有卡片</TighterText>
          </DialogTitle>
        </DialogHeader>
        <div className="mt-6 grid grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-3 text-center">加载中...</div>
          ) : markdowns.length === 0 ? (
            <div className="col-span-3 text-center">暂无卡片</div>
          ) : (
            markdowns.map((markdown) => (
              <Card
                key={markdown.id}
                className="hover:shadow-lg transition-shadow cursor-pointer relative group"
                onClick={() => setSelectedCard(markdown)}
                onMouseEnter={() => setHoveredCardId(markdown.id)}
                onMouseLeave={() => setHoveredCardId(null)}
              >
                {/* 删除按钮，仅在悬浮时显示 */}
                {hoveredCardId === markdown.id && (
                  <button
                    className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteCard(markdown.id);
                    }}
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                )}
                <CardContent className="p-4">
                  <h3 className="font-medium text-lg mb-2">{markdown.title}</h3>
                  <p className="text-gray-600 line-clamp-3">
                    {markdown.content}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>

      {/* 正文弹窗 */}
      {selectedCard && (
        <Dialog open={true} onOpenChange={() => setSelectedCard(null)}>
          <DialogContent className="max-w-2xl p-8 bg-white rounded-lg shadow-xl fixed left-1/2 top-1/2 z-[9999] -translate-x-1/2 -translate-y-1/2">
            <DialogHeader>
              <DialogTitle className="text-2xl font-light text-gray-800 flex items-center justify-between">
                <span>{selectedCard.title}</span>
                <div className="flex items-center gap-2">
                  <button
                    className="ml-2 px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-sm text-white border border-red-500"
                    onClick={() => alert('TODO: 编辑功能')}
                  >
                    编辑
                  </button>
                  <button
                    className="ml-2 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm text-gray-700 border border-gray-200"
                    onClick={() => setSelectedCard(null)}
                  >
                    取消
                  </button>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 whitespace-pre-wrap break-words max-h-[60vh] overflow-auto text-gray-800 text-base">
              {selectedCard.content}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
} 