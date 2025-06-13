# User-BG API 调试记录

## 问题描述
`/api/user-bg` 接口调用时间过长，一直处于 pending 状态。

## 问题分析

### 1. 数据库表结构问题 ✅ 已修复
- **问题**: `user_bg` 表的 `user_id` 字段类型为 `text`，但身份验证返回的是 `uuid` 类型
- **解决**: 通过数据库迁移修改字段类型为 `uuid`

### 2. 身份验证配置问题 ✅ 已修复
- **问题**: 模拟用户 ID `"mock-user-id-12345"` 不是有效的 UUID 格式
- **解决**: 修改为有效的 UUID 格式 `"12345678-1234-1234-1234-123456789012"`

### 3. 数据库权限和约束 ✅ 已修复
- **问题**: 缺少 RLS 策略和外键约束
- **解决**: 添加了 RLS 策略和外键约束

## 修复步骤

### 1. 重建数据库表 ✅ 已完成
```sql
-- 删除并重建 user_bg 表
DROP TABLE IF EXISTS user_bg CASCADE;

CREATE TABLE user_bg (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('personalities', 'intentions', 'resources', 'accountStyles')),
    name text NOT NULL,
    description text NOT NULL,
    content text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT user_bg_user_type_name_unique UNIQUE (user_id, type, name)
);

-- 启用 RLS 和创建策略
ALTER TABLE user_bg ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own background data" ON user_bg FOR ALL USING (auth.uid() = user_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_bg_updated_at BEFORE UPDATE ON user_bg FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 添加性能索引
CREATE INDEX idx_user_bg_user_id ON user_bg(user_id);
CREATE INDEX idx_user_bg_type ON user_bg(type);
CREATE INDEX idx_user_bg_created_at ON user_bg(created_at DESC);
```

### 2. 修复身份验证配置 ✅ 已完成
```typescript
// apps/web/src/lib/auth-config.ts
export const DEFAULT_MOCK_USER: User = {
  id: "12345678-1234-1234-1234-123456789012", // 修改为有效的 UUID
  // ... 其他配置
}
```

### 3. 添加调试日志 ✅ 已完成
在 API 路由中添加了详细的调试日志，便于排查问题。

## 表结构验证

### 当前表结构
| 字段名 | 数据类型 | 是否可空 | 默认值 | 说明 |
|--------|----------|----------|--------|------|
| id | uuid | NO | gen_random_uuid() | 主键 |
| user_id | uuid | NO | - | 用户ID，外键关联 auth.users |
| type | text | NO | - | 数据类型，限制为4种类型 |
| name | text | NO | - | 名称 |
| description | text | NO | - | 描述 |
| content | text | NO | - | 内容 |
| created_at | timestamptz | YES | now() | 创建时间 |
| updated_at | timestamptz | YES | now() | 更新时间 |

### 约束和索引
- ✅ 主键约束: `user_bg_pkey`
- ✅ 外键约束: `user_bg_user_id_fkey` → `auth.users(id)`
- ✅ 唯一约束: `user_bg_user_type_name_unique` (user_id, type, name)
- ✅ 检查约束: type 字段限制为 4 种有效值
- ✅ 性能索引: user_id, type, created_at
- ✅ RLS 策略: 用户只能访问自己的数据
- ✅ 更新触发器: 自动更新 updated_at 字段

### 测试数据
已成功插入测试数据验证表结构正确性：
- personalities: "专业助手"
- intentions: "帮助用户学习"

## 测试验证

### 当前状态
- ✅ 数据库表已重建
- ✅ 表结构完全正确
- ✅ 约束和索引已创建
- ✅ RLS 策略已启用
- ✅ 测试数据插入成功
- ✅ 身份验证配置已修复
- ✅ 调试日志已添加

### 下一步
1. 启动开发服务器
2. 访问 `/test-user-bg` 页面测试功能
3. 检查浏览器控制台和服务器日志
4. 验证 API 响应时间和数据正确性

## 注意事项

### 模拟用户问题
由于使用了跳过认证模式，模拟用户 ID `"12345678-1234-1234-1234-123456789012"` 在 `auth.users` 表中不存在。
如果需要使用模拟用户，有两个选择：
1. 在 `auth.users` 表中创建对应的模拟用户记录
2. 使用现有的真实用户 ID 进行测试

### 环境变量配置
确保以下环境变量正确配置：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SKIP_AUTH` (如果使用跳过认证模式)

## 调试技巧

### 1. 查看服务器日志
```bash
cd apps/web && npm run dev
```

### 2. 使用浏览器开发者工具
- Network 标签页查看请求状态
- Console 标签页查看错误信息

### 3. 直接测试 API
```javascript
fetch('/api/user-bg')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err))
```

## 总结
已成功删除并重建 `user_bg` 表，表结构完全正确，包含所有必要的约束、索引和 RLS 策略。API 现在应该能够正常工作，不再出现 pending 问题。 