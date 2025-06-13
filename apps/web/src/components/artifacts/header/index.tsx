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
}

export function ArtifactHeader(props: ArtifactHeaderProps) {
  const [showAllCardsDialog, setShowAllCardsDialog] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setThreadId(params.get('threadId'));
    }
  }, []);

  // 页面加载自动打印所有 full_markdown
  useEffect(() => {
    const fetchAndLogMarkdowns = async () => {
      if (!threadId) return;
      const supabase = createSupabaseClient();
      const { data: artifacts } = await supabase
        .from('artifacts')
        .select('id')
        .eq('thread_id', threadId);
      if (!artifacts || artifacts.length === 0) return;
      const { data: contents } = await supabase
        .from('artifact_contents')
        .select('full_markdown')
        .in('artifact_id', artifacts.map(a => a.id))
        .eq('type', 'text');
      if (contents) {
        contents.forEach((c, i) => {
          console.log(`full_markdown[${i}]:`, c.full_markdown);
        });
      }
    };
    if (threadId) {
      fetchAndLogMarkdowns();
    }
  }, [threadId]);

  return (
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
          onClick={() => setShowAllCardsDialog(true)}
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

      {threadId && (
        <AllCardsDialog
          open={showAllCardsDialog}
          onOpenChange={setShowAllCardsDialog}
          threadId={threadId}
        />
      )}
    </div>
  );
}
