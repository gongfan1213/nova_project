"use client";

import { ArtifactRenderer } from "@/components/artifacts/ArtifactRenderer";
import { WebSearchResults } from "@/components/web-search-results";
import {
  ALL_MODEL_NAMES,
  DEFAULT_MODEL_CONFIG,
  DEFAULT_MODEL_NAME,
} from "@opencanvas/shared/models";
import { useGraphContext } from "@/contexts/GraphContext";
import { useToast } from "@/hooks/use-toast";
import { getLanguageTemplate } from "@/lib/get_language_template";
import {
  ArtifactCodeV3,
  ArtifactMarkdownV3,
  ArtifactV3,
  CustomModelConfig,
  ProgrammingLanguageOptions,
} from "@opencanvas/shared/types";
import React, { useEffect, useState } from "react";
import { ContentComposerChatInterface } from "./content-composer";
import NoSSRWrapper from "../NoSSRWrapper";
import { useThreadContext } from "@/contexts/ThreadProvider";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { CHAT_COLLAPSED_QUERY_PARAM } from "@/constants";
import { useRouter, useSearchParams } from "next/navigation";
import MyNoteDialog from "@/components/MyNoteDialog";
import { createSupabaseClient } from "@/lib/supabase/client";
import { ProjectHistoryComponent } from "../chat-interface/thread-history";

const supabase = createSupabaseClient();

export function CanvasComponent({ projectId }: { projectId?: string }) {
  const { graphData } = useGraphContext();
  const { setModelName, setModelConfig } = useThreadContext();
  const { setArtifact, chatStarted, setChatStarted } = graphData;
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [webSearchResultsOpen, setWebSearchResultsOpen] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [projectCollapsed, setProjectCollapsed] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const chatCollapsedSearchParam = searchParams.get(CHAT_COLLAPSED_QUERY_PARAM);

  useEffect(() => {
    try {
      if (chatCollapsedSearchParam) {
        setChatCollapsed(JSON.parse(chatCollapsedSearchParam));
      }
    } catch (e) {
      setChatCollapsed(false);
      const queryParams = new URLSearchParams(searchParams.toString());
      queryParams.delete(CHAT_COLLAPSED_QUERY_PARAM);
      router.replace(`?${queryParams.toString()}`, { scroll: false });
    }
  }, [chatCollapsedSearchParam]);

  // 加载项目内容
  useEffect(() => {
    const loadProject = async () => {
      if (projectId) {
        try {
          const { data: thread, error } = await supabase
            .from("threads")
            .select(`
              id,
              title,
              artifacts (
                id,
                artifact_contents (
                  id,
                  full_markdown,
                  code,
                  index
                )
              )
            `)
            .eq("id", projectId)
            .single();

          if (error) throw error;

          // 日志：打印项目内容
          console.log('加载到的项目内容:', thread);

          const artifact = thread.artifacts?.[0];
          let content = null;
          if (artifact?.artifact_contents && artifact.artifact_contents.length > 0) {
            // 按 index 降序排序，取 index 最大的那条
            content = [...artifact.artifact_contents].sort((a, b) => b.index - a.index)[0];
          }
          const fullMarkdown = content?.full_markdown || content?.code || '';

          const artifactContent: ArtifactMarkdownV3 = {
            index: 1,
            type: "text",
            title: thread.title,
            fullMarkdown,
          };

          const newArtifact: ArtifactV3 = {
            currentIndex: 1,
            contents: [artifactContent],
          };

          setArtifact(newArtifact);
          setChatStarted(true);
          setIsEditing(true);
        } catch (error) {
          console.error("Error loading project:", error);
          toast({
            title: "加载失败",
            description: "无法加载项目内容",
            variant: "destructive",
          });
        }
      }
    };

    loadProject();
  }, [projectId, setArtifact, setChatStarted, toast]);

  const handleQuickStart = (
    type: "text" | "code",
    language?: ProgrammingLanguageOptions
  ) => {
    if (type === "code" && !language) {
      toast({
        title: "Language not selected",
        description: "Please select a language to continue",
        duration: 5000,
      });
      return;
    }
    setChatStarted(true);

    let artifactContent: ArtifactCodeV3 | ArtifactMarkdownV3;
    if (type === "code" && language) {
      artifactContent = {
        index: 1,
        type: "code",
        title: `Quick start ${type}`,
        code: getLanguageTemplate(language),
        language,
      };
    } else {
      artifactContent = {
        index: 1,
        type: "text",
        title: `Quick start ${type}`,
        fullMarkdown: "",
      };
    }

    const newArtifact: ArtifactV3 = {
      currentIndex: 1,
      contents: [artifactContent],
    };
    // Do not worry about existing items in state. This should
    // never occur since this action can only be invoked if
    // there are no messages/artifacts in the thread.
    setArtifact(newArtifact);
    setIsEditing(true);
  };

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-screen flex !flex-row-reverse"
    >
      {!chatStarted && (
        <NoSSRWrapper>
          <ContentComposerChatInterface
            chatCollapsed={chatCollapsed}
            setChatCollapsed={(c) => {
              setChatCollapsed(c);
              const queryParams = new URLSearchParams(searchParams.toString());
              queryParams.set(CHAT_COLLAPSED_QUERY_PARAM, JSON.stringify(c));
              router.replace(`?${queryParams.toString()}`, { scroll: false });
            }}
            switchSelectedThreadCallback={(thread) => {
              // Chat should only be "started" if there are messages present
              if ((thread.values as Record<string, any>)?.messages?.length) {
                setChatStarted(true);
                if (thread?.metadata?.customModelName) {
                  setModelName(
                    thread.metadata.customModelName as ALL_MODEL_NAMES
                  );
                } else {
                  setModelName(DEFAULT_MODEL_NAME);
                }

                if (thread?.metadata?.modelConfig) {
                  setModelConfig(
                    (thread?.metadata?.customModelName ??
                      DEFAULT_MODEL_NAME) as ALL_MODEL_NAMES,
                    (thread.metadata?.modelConfig ??
                      DEFAULT_MODEL_CONFIG) as CustomModelConfig
                  );
                } else {
                  setModelConfig(DEFAULT_MODEL_NAME, DEFAULT_MODEL_CONFIG);
                }
              } else {
                setChatStarted(false);
              }
            }}
            setChatStarted={setChatStarted}
            hasChatStarted={chatStarted}
            handleQuickStart={handleQuickStart}
          />
        </NoSSRWrapper>
      )}
      {!chatCollapsed && chatStarted && (
        <ResizablePanel
          defaultSize={40}
          minSize={15}
          maxSize={50}
          className="transition-all duration-700 h-[calc(100vh-64px)] mr-auto bg-gray-50/70 shadow-inner-right"
          id="chat-panel-main"
          order={1}
        >
          <NoSSRWrapper>
            <ContentComposerChatInterface
              chatCollapsed={chatCollapsed}
              setChatCollapsed={(c) => {
                setChatCollapsed(c);
                const queryParams = new URLSearchParams(
                  searchParams.toString()
                );
                queryParams.set(CHAT_COLLAPSED_QUERY_PARAM, JSON.stringify(c));
                router.replace(`?${queryParams.toString()}`, { scroll: false });
              }}
              switchSelectedThreadCallback={(thread) => {
                // Chat should only be "started" if there are messages present
                if ((thread.values as Record<string, any>)?.messages?.length) {
                  setChatStarted(true);
                  if (thread?.metadata?.customModelName) {
                    setModelName(
                      thread.metadata.customModelName as ALL_MODEL_NAMES
                    );
                  } else {
                    setModelName(DEFAULT_MODEL_NAME);
                  }

                  if (thread?.metadata?.modelConfig) {
                    setModelConfig(
                      (thread?.metadata.customModelName ??
                        DEFAULT_MODEL_NAME) as ALL_MODEL_NAMES,
                      (thread.metadata.modelConfig ??
                        DEFAULT_MODEL_CONFIG) as CustomModelConfig
                    );
                  } else {
                    setModelConfig(DEFAULT_MODEL_NAME, DEFAULT_MODEL_CONFIG);
                  }
                } else {
                  setChatStarted(false);
                }
              }}
              setChatStarted={setChatStarted}
              hasChatStarted={chatStarted}
              handleQuickStart={handleQuickStart}
            />
          </NoSSRWrapper>
        </ResizablePanel>
      )}

      {chatStarted && (
        <>
          <ResizableHandle />
          <ResizablePanel
            defaultSize={chatCollapsed ? 100 : 100}
            maxSize={85}
            minSize={10}
            id="canvas-panel"
            order={2}
            className="flex flex-row w-full"
          >
            <div className="w-full ml-auto">
              <ArtifactRenderer
                chatCollapsed={chatCollapsed}
                setChatCollapsed={(c) => {
                  setChatCollapsed(c);
                  const queryParams = new URLSearchParams(
                    searchParams.toString()
                  );
                  queryParams.set(
                    CHAT_COLLAPSED_QUERY_PARAM,
                    JSON.stringify(c)
                  );
                  router.replace(`?${queryParams.toString()}`, {
                    scroll: false,
                  });
                }}
                setIsEditing={setIsEditing}
                isEditing={isEditing}
                projectId={projectId}
              />
            </div>
            <WebSearchResults
              open={webSearchResultsOpen}
              setOpen={setWebSearchResultsOpen}
            />
          </ResizablePanel>
          {/*  */}
          {!projectCollapsed && (
            <>
              <ResizableHandle />
              {/*  */}
              <ResizablePanel
                defaultSize={projectCollapsed ? 10 : 10}
                maxSize={85}
                minSize={10}
                id="canvas-project-history"
                order={2}
                className="flex flex-row w-full"
              >
                <div className="flex flex-col w-full">
                  {/* <div className="w-full text-right">
                    <button onClick={() => setProjectCollapsed(true)}>
                      隐藏
                    </button>
                  </div> */}
                  <div className="">
                    <ProjectHistoryComponent
                      switchSelectedThreadCallback={() => {
                        //
                      }}
                    />
                  </div>
                </div>
              </ResizablePanel>
            </>
          )}
        </>
      )}
    </ResizablePanelGroup>
  );
}

export const Canvas = React.memo(CanvasComponent);
