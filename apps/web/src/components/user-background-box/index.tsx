"use client";

import { useState, useRef, useEffect } from "react";
import { useBgData } from "../../hooks/useBgData";
import { BgDataItem, BgDataType } from "../../types";

// 卡片类型定义
type CardType = BgDataType;

interface CardData {
  type: CardType;
  title: string;
  icon: string;
  description: string;
  color: string;
}

const cardConfigs: CardData[] = [
  {
    type: "personalities",
    title: "人设",
    icon: "👤",
    description: "管理AI的人格特征和行为模式",
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
  },
  {
    type: "intentions",
    title: "意图",
    icon: "🎯",
    description: "设定AI的目标和执行意图",
    color: "bg-green-50 border-green-200 hover:bg-green-100",
  },
  {
    type: "resources",
    title: "资源",
    icon: "📚",
    description: "管理知识库和参考资料",
    color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
  },
  {
    type: "accountStyles",
    title: "账号风格",
    icon: "✨",
    description: "定义输出的语调和格式风格",
    color: "bg-orange-50 border-orange-200 hover:bg-orange-100",
  },
];

// 编辑模态框组件
interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: CardType;
  item?: BgDataItem | null;
  onSave: (data: { name: string; description: string; content: string }) => void;
  isLoading?: boolean;
}

const EditModal = ({ isOpen, onClose, type, item, onSave, isLoading = false }: EditModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    content: "",
  });

  const cardConfig = cardConfigs.find(c => c.type === type);
  const isEditing = !!item;

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setFormData({
          name: item.name,
          description: item.description,
          content: item.content,
        });
      } else {
        setFormData({
          name: "",
          description: "",
          content: "",
        });
      }
    }
  }, [isOpen, item]);

  // ESC键关闭模态框
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim() || !formData.content.trim()) {
      return;
    }
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {isEditing ? "编辑" : "新增"}{cardConfig?.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                名称 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`请输入${cardConfig?.title}名称`}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                描述 *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`请输入${cardConfig?.title}描述`}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                内容 *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`请输入${cardConfig?.title}具体内容`}
                required
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {isLoading ? "保存中..." : "保存"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 下拉菜单组件
interface DropdownProps {
  type: CardType;
  items: BgDataItem[];
  currentItem: BgDataItem | null;
  onAddNew: () => void;
  onEdit: (item: BgDataItem) => void;
  onDelete: (item: BgDataItem) => void;
  onSelect: (item: BgDataItem | null) => void;
}

const Dropdown = ({ type, items, currentItem, onAddNew, onEdit, onDelete, onSelect }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const cardConfig = cardConfigs.find(c => c.type === type);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between w-full px-3 py-1 bg-white rounded text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200"
      >
        <span className="truncate">
          {currentItem ? currentItem.name : `选择${cardConfig?.title}`}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto w-80 min-w-full">
          {/* 添加新项按钮 */}
          <button
            onClick={() => {
              onAddNew();
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center text-blue-600 border-b border-gray-100"
          >
            <span className="mr-2">+</span>
            添加新{cardConfig?.title}
          </button>

          {/* 清除选择按钮 */}
          {currentItem && (
            <button
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center text-gray-600 border-b border-gray-100"
            >
              <span className="mr-2">✕</span>
              清除选择
            </button>
          )}

          {/* 现有项目列表 */}
          {items.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              暂无{cardConfig?.title}数据
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div 
                  className={`px-3 py-2 hover:bg-gray-50 cursor-pointer ${
                    currentItem?.id === item.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => {
                    onSelect(item);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${
                        currentItem?.id === item.id ? 'text-blue-700' : 'text-gray-900'
                      }`}>
                        {item.name}
                        {currentItem?.id === item.id && (
                          <span className="ml-2 text-blue-500">✓</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 truncate">{item.description}</div>
                    </div>
                    
                    {hoveredItem === item.id && (
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(item);
                            setIsOpen(false);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="编辑"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item);
                            setIsOpen(false);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="删除"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const UserBgBox = () => {
  const [activeCard, setActiveCard] = useState<CardType>("personalities");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BgDataItem | null>(null);
  const [editingType, setEditingType] = useState<CardType>("personalities");

  const {
    personalities,
    intentions,
    resources,
    accountStyles,
    isLoading,
    addItem,
    updateItem,
    deleteItem,
    setCurrentItem,
    getCurrentItem,
    refreshUserBackground,
  } = useBgData();

  // 组件挂载时加载数据
  useEffect(() => {
    refreshUserBackground();
  }, [refreshUserBackground]);

  const getItemCount = (type: CardType): number => {
    switch (type) {
      case "personalities":
        return personalities.length;
      case "intentions":
        return intentions.length;
      case "resources":
        return resources.length;
      case "accountStyles":
        return accountStyles.length;
      default:
        return 0;
    }
  };

  const getItems = (type: CardType): BgDataItem[] => {
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

  const handleAddNew = (type: CardType) => {
    setEditingType(type);
    setEditingItem(null);
    setEditModalOpen(true);
  };

  const handleEdit = (item: BgDataItem, type: CardType) => {
    setEditingType(type);
    setEditingItem(item);
    setEditModalOpen(true);
  };

  const handleDelete = async (item: BgDataItem) => {
    if (confirm(`确定要删除"${item.name}"吗？`)) {
      const success = await deleteItem(item.id);
      if (!success) {
        alert('删除失败，请重试');
      }
    }
  };

  const handleSave = async (data: { name: string; description: string; content: string }) => {
    try {
      let success = false;
      
      if (editingItem) {
        // 更新现有项目
        success = await updateItem(editingItem.id, data);
      } else {
        // 创建新项目
        success = await addItem(editingType, data);
      }

      if (success) {
        setEditModalOpen(false);
        setEditingItem(null);
      } else {
        alert('保存失败，请重试');
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    }
  };

  return (
    <div className="w-full h-full p-6 bg-gray-50">
      {/* 标题 */}
      {/* <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">背景配置</h2>
      <p className="text-gray-600">配置AI的人设、意图、资源和账号风格</p>
    </div> */}

      {/* 横向卡片布局 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {cardConfigs.map((card) => {
          const itemCount = getItemCount(card.type);
          const isActive = activeCard === card.type;
          const items = getItems(card.type);

          return (
            <div
              key={card.type}
              className={`flex flex-col
              rounded-[20px] border-2 cursor-pointer transition-all duration-200
              ${card.color}
              ${isActive ? "ring-2 ring-blue-500 ring-opacity-50" : ""}
            `}
              onClick={() => setActiveCard(card.type)}
            >
              {/* 卡片头部 */}
              <div className="px-2 flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {/* <span className="text-2xl">{card.icon}</span> */}
                  <h3 className="font-semibold text-gray-800">{card.title}</h3>
                </div>
                <span className="bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-600">
                  {itemCount}
                </span>
              </div>

              {/* 卡片描述 */}
              <p className="px-2 text-sm text-gray-600 mb-3 flex-1">{card.description}</p>

              {/* 下拉选择按钮 */}
              <div className="flex space-x-2">
                <Dropdown
                  type={card.type}
                  items={items}
                  currentItem={getCurrentItem(card.type)}
                  onAddNew={() => handleAddNew(card.type)}
                  onEdit={(item) => handleEdit(item, card.type)}
                  onDelete={handleDelete}
                  onSelect={(item) => setCurrentItem(card.type, item)}
                />
                {/* <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddNew(card.type);
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  +
                </button> */}
              </div>
            </div>
          );
        })}
      </div>

      {/* 编辑模态框 */}
      <EditModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingItem(null);
        }}
        type={editingType}
        item={editingItem}
        onSave={handleSave}
        isLoading={isLoading}
      />
    </div>
  );
};