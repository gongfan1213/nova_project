# 背景数据管理功能实现

## 概述
实现了一个横向排列的卡片组件，用于管理AI的背景配置数据，包括人设、意图、资源和账号风格四个核心模块。

## 文件结构

### 1. 类型定义 (`apps/web/src/types.ts`)
- `PersonalityItem`: 人设数据类型
- `IntentionItem`: 意图数据类型  
- `ResourceItem`: 资源数据类型
- `AccountStyleItem`: 账号风格数据类型
- `BackgroundData`: 整体背景数据容器类型

### 2. 状态管理 (`apps/web/src/hooks/useBgData.tsx`)
使用 Zustand 实现的状态管理 hook，提供：
- 数据状态管理（personalities, intentions, resources, accountStyles）
- CRUD 操作方法
- 本地持久化存储
- 加载状态管理

### 3. UI 组件 (`apps/web/src/components/user-background-box/index.tsx`)
横向卡片布局组件，包含：
- 四个主要卡片：人设、意图、资源、账号风格
- 卡片点击切换详情显示
- 每个卡片显示项目数量
- 详细内容区域展示选中类型的数据列表

## 功能特性

### 人设管理
- 管理AI的人格特征和行为模式
- 包含特征列表 (traits)
- 支持增删改查操作

### 意图管理  
- 设定AI的目标和执行意图
- 包含目标列表 (goals) 和优先级
- 支持高中低三级优先级

### 资源管理
- 管理知识库和参考资料
- 支持多种资源类型：文档、链接、图片、视频等
- 包含标签系统便于分类

### 账号风格管理
- 定义输出的语调和格式风格
- 包含语调、语言、格式规则
- 提供示例参考

## 数据持久化
使用 Zustand 的 persist 中间件实现本地存储，确保数据在页面刷新后仍然保持。

## 数据库集成

### Supabase 表结构
创建了 `user_bg` 表用于存储用户背景数据：
```sql
CREATE TABLE user_bg (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('personalities', 'intentions', 'resources', 'accountStyles')),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL, -- 统一存储所有类型的具体内容
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_type_name UNIQUE (user_id, type, name)
);
```

### API 接口
- `GET /api/user-bg?userId={userId}` - 获取用户的背景数据
- `POST /api/user-bg` - 新增背景数据
- `PUT /api/user-bg/{id}` - 更新背景数据
- `DELETE /api/user-bg/{id}?userId={userId}` - 删除背景数据

### 数据同步
- `refreshUserBackground(userId)` - 从服务器刷新数据
- `addItem(userId, type, item)` - 新增项目并同步到服务器
- `updateItem(userId, id, updates)` - 更新项目并同步到服务器
- `deleteItem(userId, id)` - 删除项目并同步到服务器

## TODO 功能扩展
- [x] 创建 Supabase 数据库表
- [x] 实现 API 接口
- [x] 集成远程 API 数据同步
- [x] 简化数据结构使用统一的 content 字段
- [ ] 添加新增/编辑表单模态框
- [ ] 实现删除确认对话框
- [ ] 添加用户身份验证集成
- [ ] 添加搜索和过滤功能
- [ ] 实现数据导入/导出
- [ ] 添加数据校验和错误处理
- [ ] 添加拖拽排序功能
- [ ] 实现批量操作功能 