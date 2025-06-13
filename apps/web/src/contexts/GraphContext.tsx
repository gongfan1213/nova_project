"use client";

import { v4 as uuidv4 } from "uuid";
import { useUserContext } from "@/contexts/UserContext";
import {
  isArtifactMarkdownContent,
  isDeprecatedArtifactType,
} from "@opencanvas/shared/utils/artifacts";
import { reverseCleanContent } from "@/lib/normalize_string";
import {
  ArtifactV3,
  CustomModelConfig,
  GraphInput,
  TextHighlight,
} from "@opencanvas/shared/types";
import { AIMessage, BaseMessage } from "@langchain/core/messages";
import { WEB_SEARCH_RESULTS_QUERY_PARAM } from "@/constants";
import {
  ALL_MODEL_NAMES,
  DEFAULT_MODEL_CONFIG,
  DEFAULT_MODEL_NAME,
} from "@opencanvas/shared/models";
import { useToast } from "@/hooks/use-toast";
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { convertToArtifactV3, updateHighlightedMarkdown } from "./utils";
import { debounce } from "lodash";
import { useThreadContext } from "./ThreadProvider";
import { useAssistantContext } from "./AssistantContext";
import { useQueryState } from "nuqs";
import { Thread, createSupabaseClient } from "@/lib/supabase-thread-client";
import { useBgData } from "@/hooks/useBgData";

// 定义对话数据类型
interface ThreadData {
  messages: BaseMessage[];
  artifact?: ArtifactV3;
  conversationId?: string;
}

interface GraphData {
  runId: string | undefined;
  isStreaming: boolean;
  error: boolean;
  selectedBlocks: TextHighlight | undefined;
  messages: BaseMessage[];
  artifact: ArtifactV3 | undefined;
  updateRenderedArtifactRequired: boolean;
  isArtifactSaved: boolean;
  firstTokenReceived: boolean;
  feedbackSubmitted: boolean;
  artifactUpdateFailed: boolean;
  chatStarted: boolean;
  searchEnabled: boolean;
  setSearchEnabled: Dispatch<SetStateAction<boolean>>;
  setChatStarted: Dispatch<SetStateAction<boolean>>;
  setIsStreaming: Dispatch<SetStateAction<boolean>>;
  setFeedbackSubmitted: Dispatch<SetStateAction<boolean>>;
  setArtifact: Dispatch<SetStateAction<ArtifactV3 | undefined>>;
  setSelectedBlocks: Dispatch<SetStateAction<TextHighlight | undefined>>;
  setSelectedArtifact: (index: number) => void;
  setMessages: Dispatch<SetStateAction<BaseMessage[]>>;
  streamMessage: (params: GraphInput) => Promise<void>;
  setArtifactContent: (index: number, content: string) => void;
  clearState: () => void;
  switchSelectedThread: (thread: Thread) => void;
  setUpdateRenderedArtifactRequired: Dispatch<SetStateAction<boolean>>;
}

type GraphContentType = {
  graphData: GraphData;
};

const GraphContext = createContext<GraphContentType | undefined>(undefined);

export function GraphProvider({ children }: { children: ReactNode }) {
  const userData = useUserContext();
  const assistantsData = useAssistantContext();
  const threadData = useThreadContext();
  const { toast } = useToast();
  const [chatStarted, setChatStarted] = useState(false);
  const [currentThreadData, setCurrentThread] = useState<any>(undefined);
  const [metadata, setMetadata] = useState<any>(undefined);
  const [messages, setMessages] = useState<BaseMessage[]>([]);
  const [artifact, setArtifact] = useState<ArtifactV3>();
  const [selectedBlocks, setSelectedBlocks] = useState<TextHighlight>();
  const [isStreaming, setIsStreaming] = useState(false);
  const [updateRenderedArtifactRequired, setUpdateRenderedArtifactRequired] =
    useState(false);
  const lastSavedArtifact = useRef<ArtifactV3 | undefined>(undefined);
  const debouncedAPIUpdate = useRef(
    debounce(
      (artifact: ArtifactV3, messages: BaseMessage[], threadId: string) =>
        updateArtifact(artifact, messages, threadId),
      5000
    )
  ).current;
  const [isArtifactSaved, setIsArtifactSaved] = useState(true);
  const [threadSwitched, setThreadSwitched] = useState(false);
  const [firstTokenReceived, setFirstTokenReceived] = useState(false);
  const [runId, setRunId] = useState<string>();
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const [artifactUpdateFailed, setArtifactUpdateFailed] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const { personalities, intentions, resources, accountStyles } = useBgData();
  const [_] = useQueryState(WEB_SEARCH_RESULTS_QUERY_PARAM);

  useEffect(() => {
    if (typeof window === "undefined" || !userData.user) return;

    // Get or create a new assistant if there isn't one set in state, and we're not
    // loading all assistants already.
    if (
      !assistantsData.selectedAssistant &&
      !assistantsData.isLoadingAllAssistants
    ) {
      assistantsData.getOrCreateAssistant(userData.user.id);
    }
  }, [userData.user]);

  // Very hacky way of ensuring updateState is not called when a thread is switched
  useEffect(() => {
    if (threadSwitched) {
      const timer = setTimeout(() => {
        setThreadSwitched(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [threadSwitched]);

  useEffect(() => {
    return () => {
      debouncedAPIUpdate.cancel();
    };
  }, [debouncedAPIUpdate]);

  useEffect(() => {
    // 如果没有 threadId，或者正在流式传输，或者线程刚切换，则不执行
    if (!threadData.threadId || isStreaming || threadSwitched) return;

    // 如果没有 artifact，不需要保存
    if (!artifact) return;

    // 如果需要更新渲染状态，等待渲染完成后再保存
    if (updateRenderedArtifactRequired) return;
    
    // 如果 artifact 已经保存，不需要再次保存
    // if (isArtifactSaved) return;
    
    const currentIndex = artifact.currentIndex;
    const currentContent = artifact.contents.find(
      (c) => c.index === currentIndex
    );
    if (!currentContent) return;

    // 如果 artifact 内容为空，不保存
    if (
      (artifact.contents.length === 1 &&
        artifact.contents[0].type === "text" &&
        !artifact.contents[0].fullMarkdown) ||
      (artifact.contents[0].type === "code" && !artifact.contents[0].code)
    ) {
      return;
    }

    // 只有当 artifact 内容真正发生变化时才保存
    if (
      !lastSavedArtifact.current ||
      JSON.stringify(lastSavedArtifact.current.contents) !==
        JSON.stringify(artifact.contents)
    ) {
      setIsArtifactSaved(false);
      debouncedAPIUpdate(artifact, messages, threadData.threadId);
    }
  }, [
    messages,
    artifact,
    threadData.threadId,
    isStreaming,
    threadSwitched,
    updateRenderedArtifactRequired,
  ]);

  const searchOrCreateEffectRan = useRef(false);

  // Attempt to load the thread if an ID is present in query params.
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !userData.user ||
      threadData.createThreadLoading ||
      !threadData.threadId
    ) {
      return;
    }

    // Only run effect once in development
    if (searchOrCreateEffectRan.current) {
      return;
    }
    searchOrCreateEffectRan.current = true;

    if (
      currentThreadData?.thread_id &&
      currentThreadData.thread_id === threadData.threadId
    ) {
      // 没变
      return;
    }

    threadData.getThread(threadData.threadId).then((thread) => {
      if (thread) {
        switchSelectedThread(thread);
        return;
      }

      // Failed to fetch thread. Remove from query params
      threadData.setThreadId(null);
    });
  }, [threadData.threadId, userData.user, threadData.createThreadLoading]);

  // useEffect(() => {
  //   const lastMessage: any = messages.length
  //     ? messages?.[messages.length - 1]
  //     : undefined;
  //   if (lastMessage?.type !== "ai") {
  //     // 当模型回复 才存储
  //     return;
  //   }

  //   saveThreadAfterConversation(
  //     currentThreadData?.thread_id,
  //     {},
  //     {
  //       messages: messages as BaseMessage[],
  //       artifact: artifact as ArtifactV3,
  //     }
  //   );
  // }, [messages]);

  const updateArtifact = async (
    artifactToUpdate: ArtifactV3,
    messagesToUpdate: BaseMessage[],
    threadId: string
  ) => {
    setArtifactUpdateFailed(false);
    if (isStreaming) return;

    try {
      const client = createSupabaseClient();
      await client.threads.updateState(threadId, {
        values: {
          artifact: artifactToUpdate,
          messages: messagesToUpdate,
        },
      });
      setIsArtifactSaved(true);
      lastSavedArtifact.current = artifactToUpdate;
    } catch (_) {
      setArtifactUpdateFailed(true);
    }
  };

  const clearState = () => {
    setMessages([]);
    setArtifact(undefined);
    setFirstTokenReceived(true);
    setMetadata(undefined);
    setCurrentThread(undefined);
  };

  // 新增：处理第一种交互模式的函数
  const streamFirstTimeGeneration = async (
    params: GraphInput
  ): Promise<ThreadData> => {
    setFirstTokenReceived(false);
    setError(false);
    setIsStreaming(true);
    setRunId(undefined);
    setFeedbackSubmitted(false);

    // 初始化返回数据
    // 从当前状态获取初始消息，确保包含用户输入
    let finalMessages: BaseMessage[] = [...messages];
    let followupContentRef = { current: "" }
    let finalFunctionTools: any[] = []
    const followupMessageId = `followup-${uuidv4()}`

    // 如果有新的用户消息需要添加，确保它们包含必要的内容
    if (params.messages && params.messages.length > 0) {
      const lastMessage = params.messages[params.messages.length - 1];
      if (
        lastMessage &&
        typeof lastMessage === "object" &&
        "content" in lastMessage
      ) {
        // 确保消息有有效的内容
        const messageContent = lastMessage.content || "";
        if (messageContent.trim()) {
          finalMessages = [...messages, lastMessage as BaseMessage];
        }
      }
    }

    let finalArtifact: ArtifactV3 | undefined;
    let finalConversationId: string | undefined;

    try {
      // 第一步：调用generateArtifact API
      const userQuery =
        params.messages && params.messages.length > 0
          ? params.messages[params.messages.length - 1]?.content || ""
          : "";

      const generateResponse = await fetch("/api/agent/artifact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: {
            character: `
              人设：${personalities.map((p) => p.name).join(", ")}\n\n
              核心目标：${intentions.map((i) => i.name).join(", ")}\n\n
              独家资源：${resources.map((r) => r.name).join(", ")}\n\n
              内容风格：${accountStyles.map((a) => a.name).join(", ")}\n\n
            `,
          },
          query: userQuery,
        }),
      });

      if (!generateResponse.ok) {
        throw new Error("Failed to generate artifact");
      }

      const reader = generateResponse.body?.getReader();
      const decoder = new TextDecoder();
      let artifactContent = "";
      followupContentRef.current = "";
      let receivedConversationId = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          
          for (const line of lines) {
            if (line.trim() && line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                console.log("hans-web-streamFirstTimeGeneration", data);
                if (
                  data.event === "function_call" ||
                  data.event === "agent_thought"
                ) {
                  console.log(
                    "hans-web-streamFirstTimeGeneration-function_call",
                    data
                  );

                  console.log(
                    "hans-web-streamFirstTimeGeneration-agent_ data.thought",
                    data.thought
                  );
                  setAgentMessage(
                    followupContentRef,
                    followupMessageId,
                    finalMessages,
                    finalFunctionTools,
                    data
                  );

                  continue;
                }
                if (
                  data.event === "message" ||
                  data.event === "agent_message"
                ) {
                  // 提取 conversation_id
                  if (data.conversation_id && !receivedConversationId) {
                    receivedConversationId = data.conversation_id;
                    finalConversationId = receivedConversationId;
                  }

                  if (data.answer) {
                    artifactContent += data.answer;
                    // 如果有 <<think>xxx</think> 则只保留 <message>xxx</message>中的内容，则去掉 <<think>xxx</think>和<message>xxx</message>
                    followupContentRef.current =
                      followupContentRef.current.replace(
                        /<think>[\s\S]*<\/think>[\s\S]*<message>[\s\S]*<\/message>/g,
                        ""
                      );

                    // 实时更新artifact显示
                    const newArtifact: ArtifactV3 = {
                      currentIndex: 1,
                      contents: [
                        {
                          index: 1,
                          type: "text" as const, // 这里可以根据内容判断是code还是text
                          title: "Generated Artifact",
                          fullMarkdown: artifactContent,
                        },
                      ],
                    };

                    if (!firstTokenReceived) {
                      setFirstTokenReceived(true);
                    }
                    setArtifact(newArtifact);
                    finalArtifact = newArtifact;
                  }
                }

              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      }

    } catch (error) {
      console.error("Error in first time generation:", error);
      toast({
        title: "Error generating content",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
        duration: 5000,
      });
      setError(true);
    } finally {
      setIsStreaming(false);
    }

    // 返回收集的对话数据
    return {
      messages: finalMessages,
      artifact: finalArtifact,
      conversationId: finalConversationId,
    };
  };

  // 新增：处理重写artifact的函数
  const streamRewriteArtifact = async (
    params: GraphInput,
    providedConversationId?: string
  ) => {
    const activeConversationId = providedConversationId;

    if (!activeConversationId) {
      toast({
        title: "Error",
        description:
          "No conversation ID found. Please start a new conversation.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    let followupContentRef = { current: "" }
    let finalMessages: BaseMessage[] = []
    let finalFunctionTools: any[] = []
    const followupMessageId = `followup-${uuidv4()}`

    setFirstTokenReceived(false);
    setError(false);
    setIsStreaming(true);
    setRunId(undefined);
    setFeedbackSubmitted(false);

    try {
      // 第一步：调用generateArtifact API，传入conversation_id
      const userQuery =
        params.messages && params.messages.length > 0
          ? params.messages[params.messages.length - 1]?.content || ""
          : "";

      const generateResponse = await fetch("/api/agent/artifact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: {
            character: `
              人设：${personalities.map((p) => p.name).join(", ")}\n\n
              核心目标：${intentions.map((i) => i.name).join(", ")}\n\n
              独家资源：${resources.map((r) => r.name).join(", ")}\n\n
              内容风格：${accountStyles.map((a) => a.name).join(", ")}\n\n
            `,
          },
          query: userQuery,
          conversation_id: activeConversationId,
        }),
      });


      if (!generateResponse.ok) {
        throw new Error("Failed to rewrite artifact");
      }

      const reader = generateResponse.body?.getReader();
      const decoder = new TextDecoder();
      let artifactContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.trim() && line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                console.log('hans-web-streamRewriteArtifact-data', data);
                if (data.event === "function_call" || data.event === "agent_thought") {
                  console.log('hans-web-streamFirstTimeGeneration-function_call', data);
                  continue;
                }
                if (
                  data.event === "function_call" ||
                  data.event === "agent_thought"
                ) {
                  console.log(
                    "hans-web-streamFirstTimeGeneration-function_call",
                    data
                  );

                  console.log(
                    "hans-web-streamFirstTimeGeneration-agent_ data.thought",
                    data.thought
                  );
                  setAgentMessage(
                    followupContentRef,
                    followupMessageId,
                    finalMessages,
                    finalFunctionTools,
                    data
                  );

                  continue;
                }
                if (data.event === "message" || data.event === "agent_message" && data.answer) {
                  artifactContent += data.answer;
                  // index 从1 开始
                  let currentIndex = artifact?.currentIndex || 0;
                  const contents = artifact?.contents || [];
                  currentIndex = currentIndex + 1;

                  // 覆盖更新artifact显示（不是追加）
                  const newArtifact: ArtifactV3 = {
                    currentIndex: currentIndex,
                    contents: [
                      ...contents,
                      {
                        index: currentIndex,
                        type: "text" as const,
                        title: "Generated Artifact",
                        fullMarkdown: artifactContent,
                      },
                    ],
                  };

                  if (!firstTokenReceived) {
                    setFirstTokenReceived(true);
                  }
                  setArtifact(newArtifact);
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      }

    } catch (error) {
      console.error("Error in rewrite artifact:", error);
      toast({
        title: "Error rewriting artifact",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
        duration: 5000,
      });
      setError(true);
    } finally {
      setIsStreaming(false);
    }
  };

  // 新增：处理重写划线编辑的函数
  const streamRewriteHighlightedText = async (params: GraphInput) => {
    setFirstTokenReceived(false);
    setError(false);
    setIsStreaming(true);
    setRunId(undefined);
    setFeedbackSubmitted(false);

    try {
      // 第一步：调用generateArtifact API，传入conversation_id
      const userQuery =
        params.messages && params.messages.length > 0
          ? params.messages[params.messages.length - 1]?.content || ""
          : "";

      const generateResponse = await fetch(
        "/api/agent/update-highlighted-text",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: {
              artifact: params?.highlightedText?.fullMarkdown,
              block: params?.highlightedText?.markdownBlock,
              highlightedText: params?.highlightedText?.selectedText,
              text: userQuery,
            },
            query: userQuery,
            response_mode: "streaming",
            user: userData?.user?.id,
          }),
        }
      );

      if (!generateResponse.ok) {
        throw new Error("Failed to rewrite artifact");
      }

      const reader = generateResponse.body?.getReader();
      const decoder = new TextDecoder();

      // 用于处理增量更新的变量
      const highlightedText = params.highlightedText;
      const prevCurrentContent = artifact
        ? artifact.contents.find((a) => a.index === artifact.currentIndex)
        : undefined;
      const newArtifactIndex = artifact ? artifact.contents.length + 1 : 1;
      let updatedArtifactStartContent: string | undefined = undefined;
      let updatedArtifactRestContent: string | undefined = undefined;
      let isFirstUpdate = true;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          console.log("hans-web-chunk", chunk);

          for (const line of lines) {
            if (line.trim() && line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.event === "message" && data.answer) {
                  // 模拟 langgraphNode === "updateHighlightedText" 的处理逻辑
                  const partialUpdatedContent = data.answer;

                  if (!artifact) {
                    console.error(
                      "No artifacts found when updating highlighted markdown..."
                    );
                    continue;
                  }

                  if (!highlightedText) {
                    toast({
                      title: "Error",
                      description: "No highlighted text found",
                      variant: "destructive",
                      duration: 5000,
                    });
                    continue;
                  }

                  if (!prevCurrentContent) {
                    toast({
                      title: "Error",
                      description: "Original artifact not found",
                      variant: "destructive",
                      duration: 5000,
                    });
                    return;
                  }

                  if (!isArtifactMarkdownContent(prevCurrentContent)) {
                    toast({
                      title: "Error",
                      description: "Received non markdown block update",
                      variant: "destructive",
                      duration: 5000,
                    });
                    return;
                  }

                  const startIndexOfHighlightedText =
                    highlightedText.fullMarkdown.indexOf(
                      highlightedText.markdownBlock
                    );

                  if (
                    updatedArtifactStartContent === undefined &&
                    updatedArtifactRestContent === undefined
                  ) {
                    // Initialize the start and rest content on first chunk
                    updatedArtifactStartContent =
                      highlightedText.fullMarkdown.slice(
                        0,
                        startIndexOfHighlightedText
                      );
                    updatedArtifactRestContent =
                      highlightedText.fullMarkdown.slice(
                        startIndexOfHighlightedText +
                          highlightedText.markdownBlock.length
                      );
                  }

                  if (
                    updatedArtifactStartContent !== undefined &&
                    updatedArtifactRestContent !== undefined
                  ) {
                    updatedArtifactStartContent += partialUpdatedContent;
                  }

                  const firstUpdateCopy = isFirstUpdate;
                  if (!firstTokenReceived) {
                    setFirstTokenReceived(true);
                  }

                  console.log(
                    "hans-web-updatedArtifactStartContent",
                    `${updatedArtifactStartContent}${updatedArtifactRestContent}`
                  );

                  setArtifact((prev) => {
                    if (!prev) {
                      throw new Error(
                        "No artifact found when updating markdown"
                      );
                    }

                    return updateHighlightedMarkdown(
                      prev,
                      `${updatedArtifactStartContent}${updatedArtifactRestContent}`,
                      newArtifactIndex,
                      prevCurrentContent,
                      firstUpdateCopy
                    );
                  });

                  if (isFirstUpdate) {
                    isFirstUpdate = false;
                  }
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      }

      // 第二步：调用generateFollowup API
      const chatHistory = params.messages
        ? params.messages
            .map((msg) => `${msg.constructor.name}: ${msg.content}`)
            .join("\n")
        : "";

      await generateFollowup(params?.highlightedText?.fullMarkdown || '', chatHistory);

    } catch (error) {
      console.error("Error in rewrite artifact:", error);
      toast({
        title: "Error rewriting artifact",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
        duration: 5000,
      });
      setError(true);
    } finally {
      setIsStreaming(false);
    }
  };

  // 修改原来的streamMessage函数，添加条件判断
  const streamMessageV2 = async (params: GraphInput) => {
    let currentThreadId = threadData.threadId;

    let newMetadata = undefined;
    if (!currentThreadId) {
      const newThread = await threadData.createThread(
        params?.messages?.[0]?.content?.slice(0, 50) || ""
      );
      if (!newThread) {
        toast({
          title: "Error",
          description: "Failed to create thread",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }
      currentThreadId = newThread.thread_id;
      setMetadata(newThread.metadata);
      setCurrentThread(newThread);
      newMetadata = newThread.metadata;
    }

    // 判断是否为重写artifact的情况
    // 检查当前 Thread 是否有 conversation_id（表示已有对话）
    // 优化：只在需要时获取线程信息，避免频繁调用API
    let hasConversationId = false;
    let conversationId = undefined;

    // 只有在有artifact且没有highlightedText时才需要检查conversation_id
    if (
      currentThreadId &&
      artifact &&
      !params.highlightedText &&
      params.messages &&
      params.messages.length > 0
    ) {
      try {
        conversationId =
          newMetadata?.conversation_id || metadata?.conversation_id;
        hasConversationId = !!conversationId;
      } catch (error) {
        console.warn("Failed to get current thread metadata:", error);
      }
    }

    // 判断是否为第一次生成新artifact的情况
    if (!artifact && params.messages && params.messages.length > 0) {
      const client = createSupabaseClient();
      // 第一种交互模式：第一次生成新artifact
      const generatedThreadData = await streamFirstTimeGeneration(params);
      // 如果有 conversationId，更新 Thread 的 metadata
      const conversationIdToSave = generatedThreadData?.conversationId;
      if (conversationIdToSave) {
        try {
          setMetadata({
            ...metadata,
            conversation_id: conversationIdToSave,
          });
          // 使用 Thread 更新 API 来更新 conversation_id
          await client.threads.update(currentThreadId, {
            metadata: {
              conversation_id: conversationIdToSave,
            },
          });
          console.log(
            `Updated thread ${currentThreadId} with conversation_id: ${conversationIdToSave}`
          );
        } catch (error) {
          console.error("Failed to update thread conversation_id:", error);
        }
      }

      console.log("Generated thread data:", generatedThreadData);
      return;
    }

    // 重写artifact的交互模式
    if (
      !params.highlightedText &&
      artifact &&
      params.messages &&
      params.messages.length > 0 &&
      hasConversationId
    ) {
      // 重写artifact的交互模式
      await streamRewriteArtifact(params, conversationId);
      return;
    }

    // 划线编辑
    if (params.highlightedText) {
      await streamRewriteHighlightedText(params);
      return;
    }
  };

  const setSelectedArtifact = (index: number) => {
    setUpdateRenderedArtifactRequired(true);
    setThreadSwitched(true);

    setArtifact((prev) => {
      if (!prev) {
        toast({
          title: "Error",
          description: "No artifactV2 found",
          variant: "destructive",
          duration: 5000,
        });
        return prev;
      }
      const newArtifact = {
        ...prev,
        currentIndex: index,
      };
      lastSavedArtifact.current = newArtifact;
      return newArtifact;
    });
  };

  const setArtifactContent = (index: number, content: string) => {
    setArtifact((prev) => {
      if (!prev) {
        toast({
          title: "Error",
          description: "No artifact found",
          variant: "destructive",
          duration: 5000,
        });
        return prev;
      }
      const newArtifact = {
        ...prev,
        currentIndex: index,
        contents: prev.contents.map((a) => {
          if (a.index === index && a.type === "code") {
            return {
              ...a,
              code: reverseCleanContent(content),
            };
          }
          return a;
        }),
      };
      return newArtifact;
    });
  };

  const switchSelectedThread = (thread: Thread) => {
    setUpdateRenderedArtifactRequired(true);
    setThreadSwitched(true);
    setChatStarted(true);

    // Set the thread ID in state. Then set in cookies so a new thread
    // isn't created on page load if one already exists.
    threadData.setThreadId(thread.thread_id);

    // Set the model name and config
    if (thread.metadata?.customModelName) {
      threadData.setModelName(
        thread.metadata.customModelName as ALL_MODEL_NAMES
      );
      threadData.setModelConfig(
        thread.metadata.customModelName as ALL_MODEL_NAMES,
        thread.metadata.modelConfig as CustomModelConfig
      );
    } else {
      threadData.setModelName(DEFAULT_MODEL_NAME);
      threadData.setModelConfig(DEFAULT_MODEL_NAME, DEFAULT_MODEL_CONFIG);
    }

    const castValues: {
      artifact: ArtifactV3 | undefined;
      messages: Record<string, any>[] | undefined;
    } = {
      artifact: undefined,
      messages: (thread.values as Record<string, any>)?.messages || undefined,
    };
    const castThreadValues = thread.values as Record<string, any>;
    if (castThreadValues?.artifact) {
      if (isDeprecatedArtifactType(castThreadValues.artifact)) {
        castValues.artifact = convertToArtifactV3(castThreadValues.artifact);
      } else {
        castValues.artifact = castThreadValues.artifact;
      }
    } else {
      castValues.artifact = undefined;
    }
    lastSavedArtifact.current = castValues?.artifact;

    if (!castValues?.messages?.length) {
      setMessages([]);
      setArtifact(castValues?.artifact);
      setMetadata(thread.metadata);
      setCurrentThread(thread);
      return;
    }

    setArtifact(castValues?.artifact);
    setMessages(
      castValues.messages.map((msg: Record<string, any>) => {
        if (msg.response_metadata?.langSmithRunURL) {
          msg.tool_calls = msg.tool_calls ?? [];
          msg.tool_calls.push({
            name: "langsmith_tool_ui",
            args: { sharedRunURL: msg.response_metadata.langSmithRunURL },
            id: msg.response_metadata.langSmithRunURL
              ?.split("https://smith.langchain.com/public/")[1]
              .split("/")[0],
          });
        }
        return msg as BaseMessage;
      })
    );
    setMetadata(thread.metadata);
    setCurrentThread(thread);
  };

  const setAgentMessage = (
    followupContentRef: { current: string },
    followupMessageId: any,
    finalMessages: any,
    finalFunctionTools: any,
    data: any
  ) => {
    // if(data.answer){
    //   followupContentRef.current = followupContentRef.current + data.answer;
    // }
    data.thought &&
      (followupContentRef.current = followupContentRef.current + data.thought);
    // 需要替换掉 <artifact>xxx</artifact>
    followupContentRef.current = followupContentRef.current.replace(
      /<artifact>[\s\S]*<\/artifact>/g,
      ""
    );

    //   export type ToolCall = {
    //     name: string;
    //     args: Record<string, any>;
    //     id?: string;
    //     type?: "tool_call";
    // };
    finalFunctionTools.push({
      ...data,
      name: data.tool,
      args: data.tool_input,
      type: "tool_call",
    });

    // 创建 followup 消息
    const followupMessage = new AIMessage({
      id: followupMessageId,
      content: followupContentRef.current,
      tool_calls: finalFunctionTools,
      additional_kwargs: {
        tool_calls: finalFunctionTools,
      },
    });

    // 更新 UI 状态中的消息
    setMessages((prevMessages) => {
      const existingIndex = prevMessages.findIndex(
        (msg) => msg.id === followupMessageId
      );
      if (existingIndex >= 0) {
        // 更新已存在的消息内容
        const newMessages = [...prevMessages];
        newMessages[existingIndex] = followupMessage;
        return newMessages;
      } else {
        // 追加新消息
        return [...prevMessages, followupMessage];
      }
    });

    // 如果提供了 finalMessages 数组，也更新它（用于第一次生成的场景）
    if (finalMessages) {
      const existingIndex = finalMessages.findIndex(
        (msg: any) => msg.id === followupMessageId
      );
      if (existingIndex >= 0) {
        // 直接更新现有消息的内容
        finalMessages[existingIndex] = followupMessage;
        console.log("Updated existing followup message in finalMessages", {
          index: existingIndex,
          contentLength: followupContentRef.current.length,
          totalMessages: finalMessages.length,
        });
      } else {
        // 只在第一次添加消息时添加到数组
        finalMessages.push(followupMessage);
        console.log("Added new followup message to finalMessages", {
          messageId: followupMessageId,
          contentLength: followupContentRef.current.length,
          totalMessages: finalMessages.length,
        });
      }
    }
  };

  // 通用的 followup 生成方法
  const generateFollowup = async (
    artifactContent: string,
    chatHistory: string,
    finalMessages?: BaseMessage[]
  ) => {
    const followupResponse = await fetch("/api/agent/generate-followup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        artifact: artifactContent,
        query: chatHistory,
      }),
    })

    if (!followupResponse.ok) {
      throw new Error("Failed to generate followup")
    }

    const followupReader = followupResponse.body?.getReader()
    let followupContent = ""
    const followupMessageId = `followup-${uuidv4()}`

    if (followupReader) {
      const decoder = new TextDecoder()
      
      while (true) {
        const { done, value } = await followupReader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.trim() && line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.event === "message" && data.answer) {
                followupContent += data.answer

                // 创建 followup 消息
                const followupMessage = new AIMessage({
                  id: followupMessageId,
                  content: followupContent,
                })

                // 更新 UI 状态中的消息
                setMessages((prevMessages) => {
                  const existingIndex = prevMessages.findIndex(
                    (msg) => msg.id === followupMessageId
                  )
                  if (existingIndex >= 0) {
                    // 更新已存在的消息内容
                    const newMessages = [...prevMessages]
                    newMessages[existingIndex] = followupMessage
                    return newMessages
                  } else {
                    // 追加新消息
                    return [...prevMessages, followupMessage]
                  }
                })

                // 如果提供了 finalMessages 数组，也更新它（用于第一次生成的场景）
                if (finalMessages) {
                  const existingIndex = finalMessages.findIndex(
                    (msg) => msg.id === followupMessageId
                  )
                  if (existingIndex >= 0) {
                    // 直接更新现有消息的内容
                    finalMessages[existingIndex] = followupMessage
                    console.log(
                      "Updated existing followup message in finalMessages",
                      {
                        index: existingIndex,
                        contentLength: followupContent.length,
                        totalMessages: finalMessages.length,
                      }
                    )
                  } else {
                    // 只在第一次添加消息时添加到数组
                    finalMessages.push(followupMessage)
                    console.log("Added new followup message to finalMessages", {
                      messageId: followupMessageId,
                      contentLength: followupContent.length,
                      totalMessages: finalMessages.length,
                    })
                  }
                }
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    }
  }

  const contextValue: GraphContentType = {
    graphData: {
      runId,
      isStreaming,
      error,
      selectedBlocks,
      messages,
      artifact,
      updateRenderedArtifactRequired,
      isArtifactSaved,
      firstTokenReceived,
      feedbackSubmitted,
      chatStarted,
      artifactUpdateFailed,
      searchEnabled,
      setSearchEnabled,
      setChatStarted,
      setIsStreaming,
      setFeedbackSubmitted,
      setArtifact,
      setSelectedBlocks,
      setSelectedArtifact,
      setMessages,
      streamMessage: streamMessageV2,
      setArtifactContent,
      clearState,
      switchSelectedThread,
      setUpdateRenderedArtifactRequired,
    },
  };

  return (
    <GraphContext.Provider value={contextValue}>
      {children}
    </GraphContext.Provider>
  );
}

export function useGraphContext() {
  const context = useContext(GraphContext);
  if (context === undefined) {
    throw new Error("useGraphContext must be used within a GraphProvider");
  }
  return context;
}
