"use client";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

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
import { CHAT_COLLAPSED_QUERY_PARAM } from "@/constants";
import { useRouter, useSearchParams } from "next/navigation";
import { ProjectHistoryComponent } from "../chat-interface/thread-history";


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
    <PanelGroup direction="horizontal">
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

      {!projectCollapsed && (
        <>
          <Panel
            className="h-[calc(100vh-64px)]"
            defaultSize={10}
            minSize={10}
            maxSize={40}
          >
            <div className="flex flex-col w-full">
              <div className="">
                <ProjectHistoryComponent
                  switchSelectedThreadCallback={() => {
                    //
                  }}
                />
              </div>
            </div>
          </Panel>
        </>
      )}
      <PanelResizeHandle className="z-10 flex h-[calc(100vh-64px)] w-[3px] items-center justify-center rounded-sm border bg-border" />

      {chatStarted && (
        <>
          <Panel className="h-[calc(100vh-64px)]" defaultSize={45} minSize={20}>
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
          </Panel>

          <PanelResizeHandle className="z-10 flex h-[calc(100vh-64px)] w-[3px] items-center justify-center rounded-sm border bg-border" />

          {/*  */}
          {!chatCollapsed && chatStarted && (
            <Panel
              className=" h-[calc(100vh-64px)]"
              defaultSize={45}
              minSize={15}
              maxSize={85}
            >
              <NoSSRWrapper>
                <ContentComposerChatInterface
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
                  switchSelectedThreadCallback={(thread) => {
                    // Chat should only be "started" if there are messages present
                    if (
                      (thread.values as Record<string, any>)?.messages?.length
                    ) {
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
                        setModelConfig(
                          DEFAULT_MODEL_NAME,
                          DEFAULT_MODEL_CONFIG
                        );
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
            </Panel>
          )}
        </>
      )}
    </PanelGroup>
  );
}

export const Canvas = React.memo(CanvasComponent);
