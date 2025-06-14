# Think 标签插件实现

## 功能描述
为 markdown 渲染器添加自定义插件，用于识别和渲染 `<think>xxx</think>` 标签，将其显示为蓝色样式的思考块。

## 实现方案

### 1. Remark 插件 (remarkThink)
- 遍历 AST 节点，查找包含 `<think>` 标签的文本和 HTML 节点
- 使用正则表达式 `/<think>\s*([\s\S]*?)\s*<\/think>/g` 匹配标签（支持换行符）
- 将匹配的内容转换为自定义的 `think` 节点类型
- 设置 `hName: 'think-component'` 映射到 React 组件
- **新增**：处理段落节点中的 think 标签
- **新增**：保留 think 标签内部的换行符和格式

### 2. Rehype 插件 (rehypeThink)
- 确保 think 节点正确转换为 HTML think-component 元素
- 让 React 组件完全控制渲染逻辑

### 3. ThinkComponent React 组件
- 使用 Tailwind CSS 样式设计
- 包含思考图标 (SVG)
- **新增**：`formatContent` 函数处理换行符，将 `\n` 转换为 `<br />` 标签
- 蓝色主题配色方案
- 响应式设计和良好的视觉层次

### 4. 配置更新
- 添加 `remarkRehypeOptions: { allowDangerousHtml: true }` 允许处理 HTML 标签
- 更新 remarkPlugins 和 rehypePlugins 数组
- 在 components 配置中映射 `'think-component': ThinkComponent`

## 当前状态
✅ 插件代码已实现
✅ 样式定义完成
✅ 基础渲染效果已验证
✅ 升级为自定义 React 组件
✅ 支持换行符处理
✅ 支持混合内容（think标签 + 其他markdown内容）
✅ 修复混合内容 markdown 语法渲染问题

## 最新更新 - 换行符和混合内容支持

### 新功能：
1. **换行符处理**：
   - think 标签内的 `\n` 会被正确转换为 `<br />` 标签
   - 保留原始格式和缩进

2. **混合内容支持**：
   - 支持 `<think>\n思考内容\n</think>其他markdown内容` 格式
   - think 标签后的内容会继续按照正常 markdown 语法处理
   - 正确处理文本节点和段落节点中的混合内容

3. **改进的正则表达式**：
   - 使用 `/<think>\s*([\s\S]*?)\s*<\/think>/g` 
   - 自动处理标签前后的空白字符
   - 支持多行内容匹配

### 实现细节：
- `remarkThink` 插件：在 markdown 解析前，将 `<think>` 标签转换为 HTML 注释 `<!--THINK_START-->content<!--THINK_END-->`
- `rehypeThink` 插件：在 HTML 生成阶段，将 HTML 注释转换为 `think-component` 元素
- 这种方法确保 think 标签不会干扰正常的 markdown 解析流程
- `ThinkComponent` 的 `formatContent` 函数智能处理字符串内容的换行符

### 关键修复：
- **HTML 注释机制**：使用 HTML 注释作为中间格式，避免干扰 markdown 解析
- **分离处理阶段**：remark 阶段预处理，rehype 阶段最终转换
- **保持 markdown 完整性**：think 标签外的所有 markdown 语法都能正确解析和渲染

## TODO
1. ✅ 基础功能实现
2. ✅ React 组件集成
3. ✅ 换行符处理
4. ✅ 混合内容支持
5. 🔄 测试复杂场景：
   - 嵌套 markdown 语法
   - 多个 think 标签
   - 特殊字符处理
6. 📋 考虑添加更多自定义选项：
   - 不同的思考类型 (思考、警告、提示等)
   - 可折叠的思考块
   - 自定义图标和颜色主题

## 依赖
- `unist-util-visit`: AST 节点遍历工具
- `@assistant-ui/react-markdown`: Markdown 渲染组件
- `remark-*` 和 `rehype-*`: Markdown 处理插件生态

## 使用示例
```markdown
这是普通文本 <think>
这是多行思考内容
可以包含换行符
</think> 继续普通文本

**这里是粗体文本**，会正常渲染为 markdown
```

应该渲染为：
- 普通文本保持默认样式
- think 标签内容显示为蓝色背景的思考块，保留换行符
- think 标签后的 markdown 内容正常处理（如粗体、链接等） 