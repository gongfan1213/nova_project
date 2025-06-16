# 用户页面开发文档

## 概述

创建了一个用户信息和人设管理页面 `/user`，允许用户查看和编辑个人基本信息，以及管理AI助手的人设配置。

## 功能特性

### 1. 基本信息管理
- 用户名编辑
- 邮箱显示（只读）
- 用户ID显示
- 编辑/保存/取消操作

### 2. AI人设配置
- 四种类型的人设管理：
  - 人设定位 (personalities) 👤
  - 核心目标 (intentions) 🎯 
  - 独家资源 (resources) 📚
  - 内容风格 (accountStyles) ✨

### 3. 人设项目操作
- 查看现有项目列表
- 添加新项目
- 编辑现有项目
- 删除项目
- 模态框编辑界面

## 设计原则

### UI 设计
- 采用简洁、友好的设计风格
- 使用浅色系配色方案，避免多余的颜色
- 每个人设类型使用不同的浅色背景区分
- 卡片式布局，层次分明

### 交互设计
- 编辑状态的平滑切换
- 模态框的打开/关闭动画
- 按钮状态的视觉反馈
- 操作确认（删除项目）

## 技术实现

### 文件结构
```
apps/web/src/app/user/page.tsx
```

### 依赖组件
- UI 组件：Card, Button, Input, Textarea, Label, Separator, Badge
- 图标：EditIcon, UserIcon, SettingsIcon, PlusIcon, SaveIcon, XIcon
- Hooks：useUserContext, useBgData
- 类型：BgDataItem, BgDataType

### 状态管理
- `isEditingProfile`: 控制基本信息编辑状态
- `profileForm`: 用户基本信息表单数据
- `editingItem`: 当前编辑的人设项目
- `newItemForm`: 人设项目表单数据

### 数据流
1. 组件挂载时调用 `refreshUserBackground()` 加载人设数据
2. 用户数据变化时自动更新表单
3. 所有修改操作通过 `useBgData` hook 的 API 方法执行

## 样式增强

在 `globals.css` 中添加了 `.line-clamp-3` 工具类：
```css
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

## 数据库集成

### 用户配置表 (user_profiles)
创建了专门的用户配置表来存储扩展的用户信息：

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_profile UNIQUE (user_id)
);
```

### API 接口
- `GET /api/user-profile` - 获取用户配置
- `POST /api/user-profile` - 创建或更新用户配置

### Hook (`useUserProfile`)
- `fetchProfile()` - 获取用户配置
- `saveProfile(data)` - 保存用户配置
- 加载状态和错误处理

### Header用户菜单
在Header组件的红色N按钮上添加了下拉菜单功能：
- **菜单触发**: 点击红色N按钮打开下拉菜单
- **用户信息显示**: 显示当前用户邮箱
- **进入Profile**: 点击跳转到 `/profile` 页面
- **退出功能**: 
  - 跳过认证模式: 刷新页面重置状态
  - 正常模式: 调用 Supabase 登出API 并跳转到首页
- **样式**: 使用 DropdownMenu 组件，支持键盘导航和无障碍访问

## TODO

### 待完成功能
- [x] 实现用户基本信息的实际保存API
- [x] 创建用户配置数据库表
- [x] 集成用户配置API
- [x] 在Header中添加用户菜单（N按钮浮窗）
- [ ] 添加头像上传功能
- [ ] 添加密码修改功能
- [ ] 添加账户删除功能
- [ ] 添加数据导入/导出功能
- [ ] 添加人设模板功能
- [ ] 优化移动端响应式设计
- [ ] 添加拖拽排序功能
- [ ] 添加批量操作功能
- [ ] 添加搜索/筛选功能

### 潜在改进
- [ ] 添加表单验证提示
- [ ] 添加保存成功/失败的消息提示
- [ ] 优化模态框的键盘导航
- [ ] 添加快捷键支持
- [ ] 添加数据自动保存功能
- [ ] 添加操作历史记录

## 使用说明

1. 访问 `/user` 路由进入用户设置页面
2. 点击"编辑"按钮修改用户名
3. 在各个人设类型卡片中点击"添加"按钮创建新项目
4. 点击现有项目的编辑图标修改内容
5. 点击删除图标并确认删除项目

## 注意事项

- 邮箱地址不可修改（业务限制）
- 删除人设项目需要用户确认
- 表单必填字段包括名称和详细内容
- 页面会自动加载用户的人设数据 