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
import {
  convertToArtifactV3,
  updateHighlightedMarkdown,
} from "./utils";
import { debounce } from "lodash";
import { useThreadContext } from "./ThreadProvider";
import { useAssistantContext } from "./AssistantContext";
import { useQueryState } from "nuqs";
import { Thread, createSupabaseClient } from "@/lib/supabase-thread-client";

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
  const [messages, setMessages] = useState<BaseMessage[]>([]);
  const [artifact, setArtifact] = useState<ArtifactV3>();
  const [selectedBlocks, setSelectedBlocks] = useState<TextHighlight>();
  const [isStreaming, setIsStreaming] = useState(false);
  const [updateRenderedArtifactRequired, setUpdateRenderedArtifactRequired] =
    useState(false);
  const lastSavedArtifact = useRef<ArtifactV3 | undefined>(undefined);
  const debouncedAPIUpdate = useRef(
    debounce(
      (artifact: ArtifactV3, threadId: string) =>
        updateArtifact(artifact, threadId),
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
    if (isArtifactSaved) return;
    
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
      JSON.stringify(lastSavedArtifact.current.contents) !== JSON.stringify(artifact.contents)
    ) {
      debouncedAPIUpdate(artifact, threadData.threadId);
    }
  }, [artifact, threadData.threadId, isStreaming, threadSwitched, updateRenderedArtifactRequired, isArtifactSaved]);

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

    threadData.getThread(threadData.threadId).then((thread) => {
      if (thread) {
        switchSelectedThread(thread);
        return;
      }

      // Failed to fetch thread. Remove from query params
      threadData.setThreadId(null);
    });
  }, [threadData.threadId, userData.user, threadData.createThreadLoading]);

  const updateArtifact = async (
    artifactToUpdate: ArtifactV3,
    threadId: string
  ) => {
    setArtifactUpdateFailed(false);
    if (isStreaming) return;

    try {
      const client = createSupabaseClient();
      await client.threads.updateState(threadId, {
        values: {
          artifact: artifactToUpdate,
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

      const generateResponse = await fetch("/api/dify/generate-artifact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: userQuery,
        }),
      });

      if (!generateResponse.ok) {
        throw new Error("Failed to generate artifact");
      }

      const reader = generateResponse.body?.getReader();
      const decoder = new TextDecoder();
      let artifactContent = "";
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
                if (data.event === "message") {
                  // 提取 conversation_id
                  if (data.conversation_id && !receivedConversationId) {
                    receivedConversationId = data.conversation_id;
                    finalConversationId = receivedConversationId;
                  }

                  if (data.answer) {
                    artifactContent += data.answer;

                    // 实时更新artifact显示
                    const newArtifact: ArtifactV3 = {
                      currentIndex: 1,
                      contents: [
                        {
                          index: 1,
                          type: "text" as const, // 这里可以根据内容判断是code还是text
                          title: "Generated Content",
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

      // 第二步：调用generateFollowup API
      const chatHistory = params.messages
        ? params.messages
            .map((msg) => `${msg.constructor.name}: ${msg.content}`)
            .join("\n")
        : "";

      const followupResponse = await fetch("/api/dify/generate-followup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          artifact: artifactContent,
          query: chatHistory,
        }),
      });

      if (!followupResponse.ok) {
        throw new Error("Failed to generate followup");
      }

      const followupReader = followupResponse.body?.getReader();
      let followupContent = "";
      const followupMessageId = `followup-${uuidv4()}`;

      if (followupReader) {
        while (true) {
          const { done, value } = await followupReader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.trim() && line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.event === "message" && data.answer) {
                  followupContent += data.answer;

                  // 实时更新聊天消息
                  const followupMessage = new AIMessage({
                    id: followupMessageId,
                    content: followupContent,
                  });

                  // 更新 UI 状态
                  setMessages((prevMessages) => {
                    const existingIndex = prevMessages.findIndex(
                      (msg) => msg.id === followupMessageId
                    );
                    let newMessages: BaseMessage[];
                    if (existingIndex >= 0) {
                      newMessages = [...prevMessages];
                      newMessages[existingIndex] = followupMessage;
                    } else {
                      newMessages = [...prevMessages, followupMessage];
                    }
                    return newMessages;
                  });

                  // 更新要返回的最终消息列表
                  const existingIndex = finalMessages.findIndex(
                    (msg) => msg.id === followupMessageId
                  );
                  if (existingIndex >= 0) {
                    // 直接更新现有消息的内容
                    finalMessages[existingIndex] = followupMessage;
                    console.log(
                      "Updated existing followup message in finalMessages",
                      {
                        index: existingIndex,
                        contentLength: followupContent.length,
                        totalMessages: finalMessages.length,
                      }
                    );
                  } else {
                    // 只在第一次添加消息时添加到数组
                    finalMessages.push(followupMessage);
                    console.log("Added new followup message to finalMessages", {
                      messageId: followupMessageId,
                      contentLength: followupContent.length,
                      totalMessages: finalMessages.length,
                    });
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

    // 确保最终消息列表包含所有必要的消息
    console.log(
      "Final messages to return:",
      finalMessages.map((m) => ({
        constructor: m?.constructor?.name,
        content:
          typeof m?.content === "string"
            ? m.content.substring(0, 50) + "..."
            : "not-string",
        contentType: typeof m?.content,
        hasValidContent: !!(
          m?.content &&
          typeof m.content === "string" &&
          m.content.trim()
        ),
      }))
    );

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

      const generateResponse = await fetch("/api/dify/generate-artifact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
                if (data.event === "message" && data.answer) {
                  artifactContent += data.answer;

                  // 覆盖更新artifact显示（不是追加）
                  const newArtifact: ArtifactV3 = {
                    currentIndex: 1,
                    contents: [
                      {
                        index: 1,
                        type: "text" as const,
                        title: "Generated Content",
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

      // 第二步：调用generateFollowup API
      const chatHistory = params.messages
        ? params.messages
            .map((msg) => `${msg.constructor.name}: ${msg.content}`)
            .join("\n")
        : "";

      const followupResponse = await fetch("/api/dify/generate-followup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          artifact: artifactContent,
          query: chatHistory,
        }),
      });

      if (!followupResponse.ok) {
        throw new Error("Failed to generate followup");
      }

      const followupReader = followupResponse.body?.getReader();
      let followupContent = "";
      const followupMessageId = `followup-${uuidv4()}`;

      if (followupReader) {
        while (true) {
          const { done, value } = await followupReader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.trim() && line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.event === "message" && data.answer) {
                  followupContent += data.answer;

                  // 追加新的聊天消息（不覆盖）
                  const followupMessage = new AIMessage({
                    id: followupMessageId,
                    content: followupContent,
                  });

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
        "/api/dify/update-highlighted-text",
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
                  
                  console.log("hans-web-updatedArtifactStartContent", `${updatedArtifactStartContent}${updatedArtifactRestContent}`);

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

      const followupResponse = await fetch("/api/dify/generate-followup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          artifact: params?.highlightedText?.fullMarkdown,
          query: chatHistory,
        }),
      });

      if (!followupResponse.ok) {
        throw new Error("Failed to generate followup");
      }

      const followupReader = followupResponse.body?.getReader();
      let followupContent = "";
      const followupMessageId = `followup-${uuidv4()}`;

      if (followupReader) {
        while (true) {
          const { done, value } = await followupReader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.trim() && line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.event === "message" && data.answer) {
                  followupContent += data.answer;

                  // 追加新的聊天消息（不覆盖）
                  const followupMessage = new AIMessage({
                    id: followupMessageId,
                    content: followupContent,
                  });

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

  // 修改原来的streamMessage函数，添加条件判断
  const streamMessageV2 = async (params: GraphInput) => {
    let currentThreadId = threadData.threadId;
    let isNewThread = false;

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
      isNewThread = true;
    }

    // 判断是否为重写artifact的情况
    // 检查当前 Thread 是否有 conversation_id（表示已有对话）
    // 优化：只在需要时获取线程信息，避免频繁调用API
    let hasConversationId = false;
    let conversationId = undefined;
    
    // 只有在有artifact且没有highlightedText时才需要检查conversation_id
    if (currentThreadId && artifact && !params.highlightedText && params.messages && params.messages.length > 0) {
      try {
        const currentThread = await threadData.getThread(currentThreadId);
        conversationId = currentThread?.metadata?.conversation_id;
        hasConversationId = !!conversationId;
      } catch (error) {
        console.warn('Failed to get current thread metadata:', error);
      }
    }
    
    // 判断是否为第一次生成新artifact的情况
    if (!artifact && params.messages && params.messages.length > 0) {
      // 第一种交互模式：第一次生成新artifact
      const generatedThreadData = await streamFirstTimeGeneration(params);
      console.log("Generated thread data:", generatedThreadData);

      // 对话结束后，如果是新线程，更新 thread 标题和保存完整状态
      if (isNewThread && currentThreadId) {
        await saveThreadAfterConversation(
          currentThreadId,
          params,
          generatedThreadData
        );
      }
      return;
    }


    if (
      !params.highlightedText &&
      artifact &&
      params.messages &&
      params.messages.length > 0 &&
      hasConversationId
    ) {
      // 重写artifact的交互模式
      await streamRewriteArtifact(params, conversationId);
      
      // 使用状态获取函数来获取最新状态
      setMessages(currentMessages => {
        setArtifact(currentArtifact => {
          // 在这里，我们有最新的状态，可以保存
          saveThreadAfterConversation(currentThreadId, params, {
            messages: currentMessages as BaseMessage[],
            artifact: currentArtifact as ArtifactV3,
          });
          return currentArtifact;
        });
        return currentMessages;
      });
      return;
    }

    if (params.highlightedText) {
      await streamRewriteHighlightedText(params);
      
      // 使用状态获取函数来获取最新状态
      setMessages(currentMessages => {
        setArtifact(currentArtifact => {
          // 在这里，我们有最新的状态，可以保存
          saveThreadAfterConversation(currentThreadId, params, {
            messages: currentMessages as BaseMessage[],
            artifact: currentArtifact as ArtifactV3,
          });
          return currentArtifact;
        });
        return currentMessages;
      });
      return;
    }

    if (
      !params.highlightedText &&
      artifact &&
      params.messages &&
      params.messages.length > 0 &&
      selectedBlocks
    ) {
      params.highlightedText = selectedBlocks;
      // 划线编辑
      await streamRewriteHighlightedText(params);
      
      // 使用状态获取函数来获取最新状态
      setMessages(currentMessages => {
        setArtifact(currentArtifact => {
          // 在这里，我们有最新的状态，可以保存
          saveThreadAfterConversation(currentThreadId, params, {
            messages: currentMessages as BaseMessage[],
            artifact: currentArtifact as ArtifactV3,
          });
          return currentArtifact;
        });
        return currentMessages;
      });
      return;
    }
  };

  // 新增：对话结束后保存 Thread 状态的函数
  const saveThreadAfterConversation = async (
    threadId: string,
    params: GraphInput,
    generatedData?: ThreadData
  ) => {
    try {
      const client = createSupabaseClient();

      // 生成对话标题（使用用户的第一个消息）
      const userMessage =
        params.messages && params.messages.length > 0
          ? params.messages[params.messages.length - 1]?.content || ""
          : "";

      // 截取前50个字符作为标题
      const title =
        userMessage.length > 50
          ? userMessage.substring(0, 47) + "..."
          : userMessage || "New Conversation";

      // 更新 Thread 的状态，包括消息和 artifacts
      const messagesToSave = generatedData?.messages || messages;

      // 过滤掉无效的消息（content 为 null 或空）
      console.log(
        "Messages to save before filtering:",
        messagesToSave.map((m) => ({
          constructor: m?.constructor?.name,
          content: m?.content,
          contentType: typeof m?.content,
          hasContent: !!m?.content,
        }))
      );

      const validMessages = messagesToSave.filter((msg) => {
        if (!msg || typeof msg.content !== "string") {
          console.warn("Filtering out invalid message:", msg);
          return false;
        }
        // 确保 content 不为空字符串
        const isValid = msg.content.trim().length > 0;
        if (!isValid) {
          console.warn("Filtering out empty content message:", msg);
        }
        return isValid;
      });

      console.log(
        "Valid messages after filtering:",
        validMessages.length,
        validMessages.map((m) => ({
          constructor: m?.constructor?.name,
          content:
            typeof m.content === "string"
              ? m.content.substring(0, 50) + "..."
              : "not-string",
          contentLength:
            typeof m.content === "string" ? m.content.length : "N/A",
        }))
      );

      const updateData: any = {
        values: {
          messages: validMessages,
        },
      };

      // 如果有 artifact，也保存
      const artifactToSave = generatedData?.artifact || artifact;
      if (artifactToSave) {
        updateData.values.artifact = artifactToSave;
      }

      // 如果有 conversationId，更新 Thread 的 metadata
      const conversationIdToSave = generatedData?.conversationId;
      if (conversationIdToSave) {
        try {
          // 使用 Thread 更新 API 来更新 conversation_id
          await client.threads.update(threadId, {
            metadata: {
              conversation_id: conversationIdToSave,
            },
          });
          console.log(
            `Updated thread ${threadId} with conversation_id: ${conversationIdToSave}`
          );
        } catch (error) {
          console.error("Failed to update thread conversation_id:", error);
        }
      }

      // 同时更新标题（如果是新线程且没有标题）
      await client.threads.updateState(threadId, updateData);

      console.log(
        `Thread ${threadId} saved successfully with title: "${title}"`
      );
    } catch (error) {
      console.error("Failed to save thread after conversation:", error);
      // 不显示错误 toast，因为这是后台操作
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
  };

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
