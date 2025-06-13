import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TighterText } from "@/components/ui/header";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

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
  const supabase = createSupabaseClient();

  useEffect(() => {
    console.log('AllCardsDialog收到的threadId:', threadId);
    const fetchMarkdowns = async () => {
      if (!threadId) return;
      
      try {
        setLoading(true);
        // 首先获取artifacts
        const { data: artifacts, error: artifactsError } = await supabase
          .from('artifacts')
          .select('id')
          .eq('thread_id', threadId);

        if (artifactsError) throw artifactsError;

        if (artifacts && artifacts.length > 0) {
          // 然后获取每个artifact的markdown内容
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

    if (open) {
      fetchMarkdowns();
    }
  }, [threadId, open]);

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
            markdowns.map((markdown, idx) => {
              console.log(`渲染卡片[${idx}] full_markdown:`, markdown.content)
              return (
                <Card key={markdown.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <h3 className="font-medium text-lg mb-2">{markdown.title}</h3>
                    <p className="text-gray-600 line-clamp-3">
                      {markdown.content}
                    </p>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 