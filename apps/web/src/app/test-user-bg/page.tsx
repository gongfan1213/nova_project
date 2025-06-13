"use client";

import { useState, useEffect } from "react";
import { useBgData } from "../../hooks/useBgData";
import { BgDataItem, BgDataType } from "../../types";

export default function TestUserBgPage() {
  const {
    personalities,
    intentions,
    resources,
    accountStyles,
    isLoading,
    refreshUserBackground,
    addItem,
    updateItem,
    deleteItem,
  } = useBgData();

  const [message, setMessage] = useState("");

  const [newItemForm, setNewItemForm] = useState({
    type: "personalities" as BgDataType,
    name: "",
    description: "",
    content: "",
  });
  const [editingItem, setEditingItem] = useState<BgDataItem | null>(null);

  const getTotalCount = () => {
    return (
      personalities.length +
      intentions.length +
      resources.length +
      accountStyles.length
    );
  };

  const getDataByType = (type: BgDataType): BgDataItem[] => {
    switch (type) {
      case "personalities":
        return personalities;
      case "intentions":
        return intentions;
      case "resources":
        return resources;
      case "accountStyles":
        return accountStyles;
      default:
        return [];
    }
  };

  const loadUserData = async () => {
    try {
      await refreshUserBackground();
      setMessage(`✅ 成功加载用户数据，共 ${getTotalCount()} 项`);
    } catch (error) {
      setMessage(`❌ 加载失败: ${error}`);
    }
  };

  const createNewItem = async () => {
    if (!newItemForm.name || !newItemForm.content) {
      setMessage("❌ 请填写所有必填字段");
      return;
    }

    try {
      const success = await addItem(newItemForm.type, {
        name: newItemForm.name,
        description: newItemForm.description,
        content: newItemForm.content,
      });

      if (success) {
        setMessage(`✅ 成功创建 ${newItemForm.name}`);
        setNewItemForm({
          type: "personalities",
          name: "",
          description: "",
          content: "",
        });
      } else {
        setMessage("❌ 创建失败");
      }
    } catch (error) {
      setMessage(`❌ 创建失败: ${error}`);
    }
  };

  const updateExistingItem = async () => {
    if (!editingItem) return;

    try {
      const success = await updateItem(editingItem.id, {
        name: editingItem.name,
        description: editingItem.description,
        content: editingItem.content,
      });

      if (success) {
        setMessage(`✅ 成功更新 ${editingItem.name}`);
        setEditingItem(null);
      } else {
        setMessage("❌ 更新失败");
      }
    } catch (error) {
      setMessage(`❌ 更新失败: ${error}`);
    }
  };

  const deleteExistingItem = async (item: BgDataItem) => {
    if (!confirm(`确定要删除 "${item.name}" 吗？`)) return;

    try {
      const success = await deleteItem(item.id);
      if (success) {
        setMessage(`✅ 成功删除 ${item.name}`);
      } else {
        setMessage("❌ 删除失败");
      }
    } catch (error) {
      setMessage(`❌ 删除失败: ${error}`);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const typeOptions = [
    { value: "personalities", label: "人设", icon: "👤" },
    { value: "intentions", label: "意图", icon: "🎯" },
    { value: "resources", label: "资源", icon: "📚" },
    { value: "accountStyles", label: "账号风格", icon: "✨" },
  ];

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">用户背景数据 API 测试页面</h1>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-800">
          <strong>说明:</strong> 使用当前登录用户的身份进行测试
        </p>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={loadUserData}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? "加载中..." : "刷新数据"}
        </button>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            数据列表 (总计 {getTotalCount()} 项)
          </h2>

          {typeOptions.map((typeOption) => {
            const data = getDataByType(typeOption.value as BgDataType);
            return (
              <div key={typeOption.value} className="mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-2xl">{typeOption.icon}</span>
                  {typeOption.label} ({data.length})
                </h3>

                {data.length === 0 ? (
                  <div className="p-4 bg-gray-50 rounded-lg text-gray-500 text-center">
                    暂无{typeOption.label}数据
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 bg-white border rounded-lg shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">
                              {item.name}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {item.description}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                              <strong>内容:</strong> {item.content}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              更新于: {item.updatedAt.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => deleteExistingItem(item)}
                              disabled={isLoading}
                              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div>
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            <h3 className="text-lg font-semibold mb-4">新增数据</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">类型</label>
                <select
                  value={newItemForm.type}
                  onChange={(e) =>
                    setNewItemForm({
                      ...newItemForm,
                      type: e.target.value as BgDataType,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">名称 *</label>
                <input
                  type="text"
                  value={newItemForm.name}
                  onChange={(e) =>
                    setNewItemForm({ ...newItemForm, name: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="输入名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">描述 *</label>
                <input
                  type="text"
                  value={newItemForm.description}
                  onChange={(e) =>
                    setNewItemForm({
                      ...newItemForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="输入描述"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">内容 *</label>
                <textarea
                  value={newItemForm.content}
                  onChange={(e) =>
                    setNewItemForm({ ...newItemForm, content: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 h-24"
                  placeholder="输入具体内容"
                />
              </div>

              <button
                onClick={createNewItem}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {isLoading ? "创建中..." : "创建"}
              </button>
            </div>
          </div>

          {editingItem && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">编辑数据</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    名称 *
                  </label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, name: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    内容 *
                  </label>
                  <textarea
                    value={editingItem.content}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        content: e.target.value,
                      })
                    }
                    className="w-full border rounded-lg px-3 py-2 h-24"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={updateExistingItem}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {isLoading ? "更新中..." : "更新"}
                  </button>
                  <button
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">API 使用说明</h3>
        <div className="space-y-2 text-sm">
          <p>
            <strong>✅ 已实现的功能:</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>🔍 获取用户的所有背景数据 (refreshUserBackground)</li>
            <li>➕ 创建新的背景数据项 (addItem)</li>
            <li>✏️ 更新背景数据项 (updateItem)</li>
            <li>🗑️ 删除背景数据项 (deleteItem)</li>
            <li>💾 本地状态管理和持久化</li>
            <li>🔐 用户权限隔离</li>
            <li>📱 四种数据类型：人设、意图、资源、账号风格</li>
          </ul>
          <p className="mt-4">
            <strong>📋 API 接口:</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>GET /api/user-bg - 获取当前用户数据</li>
            <li>POST /api/user-bg - 创建新数据</li>
            <li>PUT /api/user-bg/{"{id}"} - 更新数据</li>
            <li>DELETE /api/user-bg/{"{id}"} - 删除数据</li>
          </ul>
          <p className="text-xs text-gray-500 mt-2">
            🔐 所有接口都已使用身份验证，自动关联到当前登录用户
          </p>
        </div>
      </div>
    </div>
  );
}
