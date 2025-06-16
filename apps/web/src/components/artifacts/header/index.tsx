import { ReflectionsDialog } from "../../reflections-dialog/ReflectionsDialog";
import { ArtifactTitle } from "./artifact-title";
import { NavigateArtifactHistory } from "./navigate-artifact-history";
import { ArtifactCodeV3, ArtifactMarkdownV3 } from "@opencanvas/shared/types";
import { Assistant } from "@langchain/langgraph-sdk";
import { PanelRightClose, BookOpen } from "lucide-react";
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import { AllCardsDialog } from "./all-cards-dialog";
import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { TextRenderer } from "../TextRenderer";
import { Card, CardContent } from "@/components/ui/card";
import { X } from 'lucide-react';
import { useGraphContext } from '@/contexts/GraphContext';

interface ArtifactHeaderProps {
  isBackwardsDisabled: boolean;
  isForwardDisabled: boolean;
  setSelectedArtifact: (index: number) => void;
  currentArtifactContent: ArtifactCodeV3 | ArtifactMarkdownV3;
  isArtifactSaved: boolean;
  totalArtifactVersions: number;
  selectedAssistant: Assistant | undefined;
  artifactUpdateFailed: boolean;
  chatCollapsed: boolean;
  setChatCollapsed: (c: boolean) => void;
  showAllCards: boolean;
  setShowAllCards: (show: boolean) => void;
}

export function ArtifactHeader(props: ArtifactHeaderProps) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [allCards, setAllCards] = useState<{ id: string; index: number; title: string; content: string }[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [selectedCard, setSelectedCard] = useState<null | { id: string; index: number; title: string; content: string }>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [showCardContent, setShowCardContent] = useState<null | { id: string; title: string; content: string }>(null);
  const supabase = createSupabaseClient();
  const { graphData } = useGraphContext();
  const { setArtifact } = graphData;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setThreadId(params.get('threadId'));
    }
  }, []);

  // 拉取所有卡片
  const fetchAllCards = async () => {
    if (!threadId) return;
    setLoadingCards(true);
    try {
      const { data: artifacts } = await supabase
        .from('artifacts')
        .select('id')
        .eq('thread_id', threadId);
      if (!artifacts || artifacts.length === 0) {
        setAllCards([]);
        return;
      }
      const { data: contents } = await supabase
        .from('artifact_contents')
        .select('id, index, title, full_markdown')
        .in('artifact_id', artifacts.map(a => a.id))
        .eq('type', 'text');
      if (contents) {
        setAllCards(contents.map(c => ({
          id: c.id,
          index: c.index,
          title: c.title,
          content: c.full_markdown || ''
        })));
      } else {
        setAllCards([]);
      }
    } finally {
      setLoadingCards(false);
    }
  };

  // 删除卡片
  const handleDeleteCard = async (id: string) => {
    await supabase.from('artifact_contents').delete().eq('id', id);
    fetchAllCards();
  };

  // 点击缩略卡片按钮
  const handleShowAllCards = () => {
    if (props.showAllCards) {
      graphData.setSelectedArtifact(props.currentArtifactContent.index)
      props.setShowAllCards(false)
    } else {
      fetchAllCards()
      props.setShowAllCards(true)
    }
  }

  // 渲染主内容区
  let mainContent = null;
  // 获取当前artifact内容（移除props.currentArtifactContent依赖，直接用context里的artifact）
  const { artifact } = graphData;
  let currentCardContent = null;
  if (artifact && artifact.contents && artifact.currentIndex) {
    const found = artifact.contents.find(
      (c: any) => c.index === artifact.currentIndex
    );
    if (found) {
      currentCardContent = {
        id: found.id || '',
        title: found.title,
        content: found.fullMarkdown || found.code || '',
      };
    }
  }
  if (props.showAllCards) {
    mainContent = (
      <div className="p-8 relative">
        {/* 关闭按钮，右上角 */}
        <button
          className="absolute top-4 right-4 z-20 bg-white rounded-full p-1 shadow hover:bg-gray-100"
          onClick={() => {
            graphData.setSelectedArtifact(props.currentArtifactContent.index)
            props.setShowAllCards(false)
          }}
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
        {/* 只显示卡片列表 */}
        <div style={{ maxHeight: '700px', overflowY: 'auto' }}>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {loadingCards ? (
              <div className="col-span-3 text-center">加载中...</div>
            ) : allCards.length === 0 ? (
              <div className="col-span-3 text-center">暂无卡片</div>
            ) : (
              allCards.map((markdown, idx) => (
                <Card
                  key={markdown.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer relative group"
                  onClick={() => {
                    if (markdown.index !== undefined) {
                      graphData.setSelectedArtifact(markdown.index)
                      props.setShowAllCards(false)
                    }
                  }}
                  onMouseEnter={() => setHoveredCardId(markdown.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                >
                  {/* 删除按钮，仅在悬浮时显示 */}
                  {hoveredCardId === markdown.id && (
                    <button
                      className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                      onClick={e => {
                        e.stopPropagation()
                        handleDeleteCard(markdown.id)
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
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center justify-center gap-2">
          {props.chatCollapsed && (
            <TooltipIconButton
              tooltip="Expand Chat"
              variant="ghost"
              className="ml-2 mb-1 w-8 h-8"
              delayDuration={400}
              onClick={() => props.setChatCollapsed(false)}
            >
              <PanelRightClose className="text-gray-600" />
            </TooltipIconButton>
          )}
          <ArtifactTitle
            title={props.currentArtifactContent.title}
            isArtifactSaved={props.isArtifactSaved}
            artifactUpdateFailed={props.artifactUpdateFailed}
          />
        </div>
        <div className="flex gap-2 items-end mt-[10px] mr-[6px]">
          <TooltipIconButton
            tooltip="缩略卡片"
            variant="ghost"
            className="w-8 h-8 mr-1"
            delayDuration={400}
            onClick={handleShowAllCards}
          >
            <BookOpen className="w-10 h-10 text-gray-600" />
          </TooltipIconButton>
          <NavigateArtifactHistory
            isBackwardsDisabled={props.isBackwardsDisabled}
            isForwardDisabled={props.isForwardDisabled}
            setSelectedArtifact={props.setSelectedArtifact}
            currentArtifactIndex={props.currentArtifactContent.index}
            totalArtifactVersions={props.totalArtifactVersions}
          />
          <ReflectionsDialog selectedAssistant={props.selectedAssistant} />
        </div>
      </div>
      {/* 主内容区互斥显示 */}
      <div className="w-full">
        {mainContent}
      </div>
    </div>
  );
}