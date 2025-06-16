"use client";

import { useState, useEffect } from "react";
import { useUserContext } from "@/contexts/UserContext";
import { useBgData } from "@/hooks/useBgData";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  EditIcon,
  UserIcon,
  SettingsIcon,
  PlusIcon,
  SaveIcon,
  XIcon,
} from "lucide-react";
import { BgDataItem, BgDataType } from "@/types";
import { userBackgroundTypeMap } from "@/components/user-background-box";

export default function UserPage() {
  const { user } = useUserContext();
  const {
    personalities,
    intentions,
    resources,
    accountStyles,
    addItem,
    updateItem,
    deleteItem,
    refreshUserBackground,
  } = useBgData();
  const {
    profile,
    fetchProfile,
    saveProfile,
    loading: profileLoading,
  } = useUserProfile();

  // 用户基本信息编辑状态
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    display_name: profile?.display_name || user?.user_metadata?.name || user?.user_metadata?.full_name || "",
    bio: profile?.bio || "",
    email: user?.email || "",
  });

  // 人设编辑状态
  const [editingItem, setEditingItem] = useState<{
    type: BgDataType;
    item: BgDataItem | null;
  } | null>(null);
  const [newItemForm, setNewItemForm] = useState({
    name: "",
    description: "",
    content: "",
  });

  // 组件挂载时加载数据
  useEffect(() => {
    refreshUserBackground();
    fetchProfile();
  }, [refreshUserBackground, fetchProfile]);

  // 更新用户信息表单当用户数据或配置变化时
  useEffect(() => {
    if (user) {
      setProfileForm({
        display_name: profile?.display_name || user.user_metadata?.name || user.user_metadata?.full_name || "",
        bio: profile?.bio || "",
        email: user.email || "",
      });
    }
  }, [user, profile]);

  const handleSaveProfile = async () => {
    try {
      await saveProfile({
        display_name: profileForm.display_name,
        bio: profileForm.bio,
      });
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      // 可以在这里添加错误提示
    }
  };

  const handleEditItem = (type: BgDataType, item: BgDataItem) => {
    setEditingItem({ type, item });
    setNewItemForm({
      name: item.name,
      description: item.description,
      content: item.content,
    });
  };

  const handleCreateItem = (type: BgDataType) => {
    setEditingItem({ type, item: null });
    setNewItemForm({
      name: "",
      description: "",
      content: "",
    });
  };

  const handleSaveItem = async () => {
    if (!editingItem) return;

    if (editingItem.item) {
      // 更新现有项目
      const success = await updateItem(editingItem.item.id, newItemForm);
      if (success) {
        setEditingItem(null);
        setNewItemForm({ name: "", description: "", content: "" });
      }
    } else {
      // 创建新项目
      const success = await addItem(editingItem.type, newItemForm);
      if (success) {
        setEditingItem(null);
        setNewItemForm({ name: "", description: "", content: "" });
      }
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm("确定要删除这个项目吗？")) {
      await deleteItem(id);
    }
  };

  const getItemsByType = (type: BgDataType): BgDataItem[] => {
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

  const getTypeConfig = (type: BgDataType) => {
    return (
      userBackgroundTypeMap.find((item) => item.type === type) || {
        title: "",
        description: "",
        icon: "",
      }
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
      </div>

      {/* 基本信息卡片 */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-full">
              <UserIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>管理你的个人资料</CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditingProfile(!isEditingProfile)}
          >
            {isEditingProfile ? (
              <XIcon className="h-4 w-4" />
            ) : (
              <EditIcon className="h-4 w-4" />
            )}
            {isEditingProfile ? "取消" : "编辑"}
          </Button>
        </CardHeader>
        <CardContent>
          {isEditingProfile ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="display_name">用户名</Label>
                <Input
                  id="display_name"
                  value={profileForm.display_name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, display_name: e.target.value })
                  }
                  placeholder="请输入用户名"
                />
              </div>
              <div>
                <Label htmlFor="bio">个人简介</Label>
                <Input
                  id="bio"
                  value={profileForm.bio}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, bio: e.target.value })
                  }
                  placeholder="请输入个人简介（可选）"
                />
              </div>
              <div>
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                  placeholder="请输入邮箱"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">邮箱地址不可修改</p>
              </div>
              <div className="flex space-x-2 pt-2">
                <Button 
                  onClick={handleSaveProfile} 
                  size="sm"
                  disabled={profileLoading}
                >
                  <SaveIcon className="h-4 w-4 mr-2" />
                  {profileLoading ? '保存中...' : '保存'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingProfile(false)}
                >
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label className="text-sm text-gray-500">用户名</Label>
                <p className="text-gray-900">
                  {profile?.display_name ||
                    user?.user_metadata?.name ||
                    user?.user_metadata?.full_name ||
                    "未设置"}
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">个人简介</Label>
                <p className="text-gray-900">{profile?.bio || "未设置"}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">邮箱</Label>
                <p className="text-gray-900">{user?.email}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">用户ID</Label>
                <p className="text-gray-500 text-sm font-mono">
                  {user?.id?.substring(0, 16)}...
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* AI人设配置 */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-gray-100 rounded-full">
            <SettingsIcon className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">AI助手人设</h2>
            <p className="text-gray-600">配置AI助手的人设、目标、资源和风格</p>
          </div>
        </div>

        <div className="space-y-6">
          {(
            [
              "personalities",
              "intentions",
              "resources",
              "accountStyles",
            ] as BgDataType[]
          ).map((type) => {
            const config = getTypeConfig(type);
            const items = getItemsByType(type);

            return (
              <Card key={type} className={`border-2`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* <span className="text-2xl">{config.icon}</span> */}
                      <div>
                        <CardTitle className="text-lg">
                          {config.title}
                        </CardTitle>
                        <CardDescription>{config.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{items.length} 项</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreateItem(type)}
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        添加
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="mb-2">还没有添加任何{config.title}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCreateItem(type)}
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        立即添加
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-1">
                                {item.name}
                              </h4>
                              {item.description && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {item.description}
                                </p>
                              )}
                              <p className="text-sm text-gray-700 line-clamp-3">
                                {item.content}
                              </p>
                            </div>
                            <div className="flex space-x-1 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditItem(type, item)}
                              >
                                <EditIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <XIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 编辑弹窗 */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {editingItem.item ? "编辑" : "添加"}
                    {getTypeConfig(editingItem.type).title}
                  </CardTitle>
                  <CardDescription>
                    {getTypeConfig(editingItem.type).description}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingItem(null)}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="item-name">名称 *</Label>
                <Input
                  id="item-name"
                  value={newItemForm.name}
                  onChange={(e) =>
                    setNewItemForm({ ...newItemForm, name: e.target.value })
                  }
                  placeholder="请输入名称"
                />
              </div>
              {/* <div>
                <Label htmlFor="item-description">简介</Label>
                <Input
                  id="item-description"
                  value={newItemForm.description}
                  onChange={(e) =>
                    setNewItemForm({
                      ...newItemForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="请输入简介（可选）"
                />
              </div> */}
              <div>
                <Label htmlFor="item-content">详细内容 *</Label>
                <Textarea
                  id="item-content"
                  value={newItemForm.content}
                  onChange={(e) =>
                    setNewItemForm({ ...newItemForm, content: e.target.value })
                  }
                  placeholder="请输入详细内容"
                  className="min-h-[120px] resize-none"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setEditingItem(null)}>
                  取消
                </Button>
                <Button
                  onClick={handleSaveItem}
                  disabled={
                    !newItemForm.name.trim() || !newItemForm.content.trim()
                  }
                >
                  <SaveIcon className="h-4 w-4 mr-2" />
                  {editingItem.item ? "更新" : "创建"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
