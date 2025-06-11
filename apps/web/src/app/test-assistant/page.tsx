"use client";

import { useState } from "react";
import {
  createSupabaseClient,
  Assistant,
} from "@/lib/supabase-assistant-client";

export default function TestAssistantPage() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const client = createSupabaseClient();

  const loadAssistants = async () => {
    setLoading(true);
    try {
      const result = await client.assistants.search({
        // metadata: { user_id: "2bbb8801-c08c-4e8f-8028-9ceadb8eb6d5" },
      });
      setAssistants(result);
      setMessage(`✅ 加载了 ${result.length} 个 assistants`);
    } catch (error) {
      setMessage(`❌ 加载失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const createTestAssistant = async () => {
    setLoading(true);
    try {
      const newAssistant = await client.assistants.create({
        graphId: "agent",
        name: `测试助手 ${Date.now()}`,
        metadata: {
          user_id: "2bbb8801-c08c-4e8f-8028-9ceadb8eb6d5",
          description: "这是一个测试助手",
          is_default: assistants.length === 0,
          iconData: {
            iconName: "Bot",
            iconColor: "#3B82F6",
          },
        },
        config: {
          configurable: {
            systemPrompt: "你是一个有用的测试助手。",
            tools: [],
          },
        },
      });
      setAssistants((prev) => [...prev, newAssistant]);
      setMessage(`✅ 创建成功: ${newAssistant.name}`);
    } catch (error) {
      setMessage(`❌ 创建失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteAssistant = async (assistantId: string) => {
    setLoading(true);
    try {
      await client.assistants.delete(assistantId);
      setAssistants((prev) =>
        prev.filter((a) => a.assistant_id !== assistantId)
      );
      setMessage(`✅ 删除成功`);
    } catch (error) {
      setMessage(`❌ 删除失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Assistant API 测试页面</h1>

      {/* 操作按钮 */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={loadAssistants}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "加载中..." : "加载 Assistants"}
        </button>

        <button
          onClick={createTestAssistant}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? "创建中..." : "创建测试 Assistant"}
        </button>
      </div>

      {/* 状态消息 */}
      {message && (
        <div
          className={`p-4 rounded mb-6 ${
            message.startsWith("✅")
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-red-100 text-red-800 border border-red-300"
          }`}
        >
          {message}
        </div>
      )}

      {/* Assistants 列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold">
            Assistants 列表 ({assistants.length})
          </h2>
        </div>

        {assistants.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            暂无 assistants，点击上方按钮加载或创建
          </div>
        ) : (
          <div className="divide-y">
            {assistants.map((assistant) => (
              <div key={assistant.assistant_id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-8 h-8 rounded flex items-center justify-center text-white font-semibold"
                        style={{
                          backgroundColor:
                            assistant.metadata.iconData?.iconColor || "#666",
                        }}
                      >
                        {assistant.metadata.iconData?.iconName?.[0] || "A"}
                      </div>
                      <h3 className="text-lg font-semibold">
                        {assistant.name}
                      </h3>
                      {assistant.metadata.is_default && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          默认
                        </span>
                      )}
                    </div>

                    {assistant.metadata.description && (
                      <p className="text-gray-600 mb-2">
                        {assistant.metadata.description}
                      </p>
                    )}

                    {assistant.config.configurable.systemPrompt && (
                      <p className="text-sm text-gray-500 mb-2">
                        <strong>系统提示词:</strong>{" "}
                        {assistant.config.configurable.systemPrompt}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>ID: {assistant.assistant_id}</span>
                      <span>
                        创建: {new Date(assistant.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteAssistant(assistant.assistant_id)}
                    disabled={loading}
                    className="ml-4 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API 使用说明 */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">API 使用说明</h3>
        <div className="space-y-2 text-sm">
          <p>
            <strong>✅ 已实现的功能:</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>🔍 搜索/获取所有 assistants</li>
            <li>➕ 创建新的 assistant</li>
            <li>👁️ 获取单个 assistant</li>
            <li>✏️ 更新 assistant</li>
            <li>🗑️ 删除 assistant</li>
            <li>📄 管理 context documents</li>
            <li>🔐 用户权限隔离 (RLS)</li>
            <li>⚡ 自动默认 assistant 管理</li>
          </ul>
          <p className="mt-4">
            <strong>🔄 兼容性:</strong> 完全兼容原有 LangGraph SDK 接口
          </p>
        </div>
      </div>
    </div>
  );
}
