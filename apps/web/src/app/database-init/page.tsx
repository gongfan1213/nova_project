"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Database,
  Table,
  Copy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// 预期的数据库表结构
const EXPECTED_TABLES = {
  projects: {
    name: "projects",
    description: "项目表 - 存储用户项目信息",
    createSQL: `
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  content TEXT,
  status TEXT,
  tags TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);`,
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: true },
      { name: "name", type: "text", nullable: false },
      { name: "description", type: "text", nullable: true },
      { name: "content", type: "text", nullable: true },
      { name: "status", type: "text", nullable: true },
      { name: "tags", type: "text", nullable: true },
      { name: "category", type: "text", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: true },
      { name: "updated_at", type: "timestamptz", nullable: true },
      { name: "metadata", type: "jsonb", nullable: true, default: "'{}'::jsonb" },
    ],
  },
  tags: {
    name: "tags",
    description: "标签表 - 存储用户自定义标签",
    createSQL: `
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);`,
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: true },
      { name: "name", type: "text", nullable: false },
      { name: "created_at", type: "timestamptz", nullable: true, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: true, default: "now()" },
    ],
  },
  assistants: {
    name: "assistants",
    description: "助手表 - 存储AI助手配置",
    createSQL: `
CREATE TABLE IF NOT EXISTS assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT,
  icon_name TEXT DEFAULT 'User',
  icon_color TEXT DEFAULT '#000000',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  tools JSONB DEFAULT '[]'::jsonb
);`,
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: true },
      { name: "name", type: "text", nullable: false },
      { name: "description", type: "text", nullable: true },
      { name: "system_prompt", type: "text", nullable: true },
      { name: "icon_name", type: "text", nullable: true, default: "'User'" },
      { name: "icon_color", type: "text", nullable: true, default: "'#000000'" },
      { name: "is_default", type: "boolean", nullable: true, default: "false" },
      { name: "created_at", type: "timestamptz", nullable: true, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: true, default: "now()" },
      { name: "metadata", type: "jsonb", nullable: true, default: "'{}'::jsonb" },
      { name: "config", type: "jsonb", nullable: true, default: "'{}'::jsonb" },
      { name: "tools", type: "jsonb", nullable: true, default: "'[]'::jsonb" },
    ],
  },
  threads: {
    name: "threads",
    description: "对话线程表 - 存储用户与助手的对话线程",
    createSQL: `
CREATE TABLE IF NOT EXISTS threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  assistant_id UUID REFERENCES assistants(id),
  title TEXT,
  model_name TEXT,
  model_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  conversation_id TEXT
);`,
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: true },
      { name: "assistant_id", type: "uuid", nullable: true },
      { name: "title", type: "text", nullable: true },
      { name: "model_name", type: "text", nullable: true },
      { name: "model_config", type: "jsonb", nullable: true, default: "'{}'::jsonb" },
      { name: "created_at", type: "timestamptz", nullable: true, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: true, default: "now()" },
      { name: "metadata", type: "jsonb", nullable: true, default: "'{}'::jsonb" },
      { name: "conversation_id", type: "text", nullable: true },
    ],
  },
  messages: {
    name: "messages",
    description: "消息表 - 存储对话中的消息",
    createSQL: `
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES threads(id),
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('human', 'ai', 'system')),
  content TEXT NOT NULL,
  run_id TEXT,
  sequence_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  additional_kwargs JSONB DEFAULT '{}'::jsonb,
  response_metadata JSONB DEFAULT '{}'::jsonb,
  tool_calls JSONB DEFAULT '[]'::jsonb,
  usage_metadata JSONB
);`,
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "thread_id", type: "uuid", nullable: true },
      { name: "user_id", type: "uuid", nullable: true },
      { name: "type", type: "text", nullable: false },
      { name: "content", type: "text", nullable: false },
      { name: "run_id", type: "text", nullable: true },
      { name: "sequence_number", type: "integer", nullable: false },
      { name: "created_at", type: "timestamptz", nullable: true, default: "now()" },
      { name: "metadata", type: "jsonb", nullable: true, default: "'{}'::jsonb" },
      { name: "additional_kwargs", type: "jsonb", nullable: true, default: "'{}'::jsonb" },
      { name: "response_metadata", type: "jsonb", nullable: true, default: "'{}'::jsonb" },
      { name: "tool_calls", type: "jsonb", nullable: true, default: "'[]'::jsonb" },
      { name: "usage_metadata", type: "jsonb", nullable: true },
    ],
  },
  artifacts: {
    name: "artifacts",
    description: "工件表 - 存储对话生成的工件",
    createSQL: `
CREATE TABLE IF NOT EXISTS artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES threads(id),
  user_id UUID REFERENCES auth.users(id),
  current_index INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);`,
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "thread_id", type: "uuid", nullable: true },
      { name: "user_id", type: "uuid", nullable: true },
      { name: "current_index", type: "integer", nullable: true, default: "1" },
      { name: "created_at", type: "timestamptz", nullable: true, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: true, default: "now()" },
      { name: "metadata", type: "jsonb", nullable: true, default: "'{}'::jsonb" },
    ],
  },
  artifact_contents: {
    name: "artifact_contents",
    description: "工件内容表 - 存储工件的具体内容",
    createSQL: `
CREATE TABLE IF NOT EXISTS artifact_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID REFERENCES artifacts(id),
  index INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'code')),
  title TEXT NOT NULL,
  language TEXT,
  code TEXT,
  full_markdown TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);`,
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "artifact_id", type: "uuid", nullable: true },
      { name: "index", type: "integer", nullable: false },
      { name: "type", type: "text", nullable: false },
      { name: "title", type: "text", nullable: false },
      { name: "language", type: "text", nullable: true },
      { name: "code", type: "text", nullable: true },
      { name: "full_markdown", type: "text", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: true, default: "now()" },
    ],
  },
  context_documents: {
    name: "context_documents",
    description: "上下文文档表 - 存储助手的上下文文档",
    createSQL: `
CREATE TABLE IF NOT EXISTS context_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  assistant_id UUID REFERENCES assistants(id),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);`,
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: true },
      { name: "assistant_id", type: "uuid", nullable: true },
      { name: "name", type: "text", nullable: false },
      { name: "content", type: "text", nullable: false },
      { name: "file_type", type: "text", nullable: true },
      { name: "file_size", type: "integer", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: true, default: "now()" },
      { name: "metadata", type: "jsonb", nullable: true, default: "'{}'::jsonb" },
    ],
  },
  reflections: {
    name: "reflections",
    description: "反思表 - 存储助手的反思内容",
    createSQL: `
CREATE TABLE IF NOT EXISTS reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  assistant_id UUID REFERENCES assistants(id),
  content JSONB NOT NULL,
  style_rules JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);`,
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: true },
      { name: "assistant_id", type: "uuid", nullable: true },
      { name: "content", type: "jsonb", nullable: false },
      { name: "style_rules", type: "jsonb", nullable: true, default: "'[]'::jsonb" },
      { name: "created_at", type: "timestamptz", nullable: true, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: true, default: "now()" },
    ],
  },
  quick_actions: {
    name: "quick_actions",
    description: "快速操作表 - 存储用户自定义的快速操作",
    createSQL: `
CREATE TABLE IF NOT EXISTS quick_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  action_type TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);`,
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: true },
      { name: "name", type: "text", nullable: false },
      { name: "description", type: "text", nullable: true },
      { name: "action_type", type: "text", nullable: false },
      { name: "config", type: "jsonb", nullable: true, default: "'{}'::jsonb" },
      { name: "created_at", type: "timestamptz", nullable: true, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: true, default: "now()" },
    ],
  },
};

interface TableStatus {
  exists: boolean;
  columns: {
    [columnName: string]: {
      exists: boolean;
      typeMatch: boolean;
      nullableMatch: boolean;
      defaultMatch: boolean;
      actualType?: string;
      actualNullable?: boolean;
      actualDefault?: string;
    };
  };
}

interface DatabaseStatus {
  tables: {
    [tableName: string]: TableStatus;
  };
  overallStatus: "success" | "warning" | "error" | "checking";
}

export default function DatabaseInitPage() {
  const [status, setStatus] = useState<DatabaseStatus>({
    tables: {},
    overallStatus: "checking",
  });
  const [isChecking, setIsChecking] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // 检查数据库的函数
  const checkDatabase = async () => {
    setIsChecking(true);
    setStatus((prev) => ({ ...prev, overallStatus: "checking" }));
    
    try {
      const response = await fetch("/api/database/check");
      let actualTables: any = {};
      
      if (response.ok) {
        actualTables = await response.json();
        
        // 检查是否有错误字段，这表示API返回了错误信息而不是数据
        if (actualTables.error) {
          throw new Error(actualTables.error);
        }
      } else {
        // 尝试解析错误信息
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const tableStatuses: DatabaseStatus["tables"] = {};
      let overallStatus: DatabaseStatus["overallStatus"] = "success";

      for (const [tableName, expectedTable] of Object.entries(EXPECTED_TABLES)) {
        const actualTable = actualTables[tableName];
        
        if (!actualTable) {
          tableStatuses[tableName] = {
            exists: false,
            columns: {},
          };
          overallStatus = "error";
          continue;
        }

        const columnStatuses: any = {};
        for (const expectedColumn of expectedTable.columns) {
          const actualColumn = actualTable.columns?.find((c: any) => c.name === expectedColumn.name);
          
          if (!actualColumn) {
            columnStatuses[expectedColumn.name] = {
              exists: false,
              typeMatch: false,
              nullableMatch: false,
              defaultMatch: false,
            };
            overallStatus = "error";
          } else {
            const typeMatch = actualColumn.data_type === expectedColumn.type;
            const nullableMatch = actualColumn.is_nullable === (expectedColumn.nullable ? "YES" : "NO");
            const expectedDefault = expectedColumn.default || null;
            const defaultMatch = actualColumn.column_default === expectedDefault;

            columnStatuses[expectedColumn.name] = {
              exists: true,
              typeMatch,
              nullableMatch,
              defaultMatch,
              actualType: actualColumn.data_type,
              actualNullable: actualColumn.is_nullable === "YES",
              actualDefault: actualColumn.column_default,
            };

            if (!typeMatch || !nullableMatch || (!defaultMatch && expectedDefault)) {
              if (overallStatus === "success") overallStatus = "warning";
            }
          }
        }

        tableStatuses[tableName] = {
          exists: true,
          columns: columnStatuses,
        };
      }

      setStatus({
        tables: tableStatuses,
        overallStatus,
      });

    } catch (error) {
      console.error("检查数据库时出错:", error);
      setStatus({
        tables: {},
        overallStatus: "error",
      });
      toast({
        title: "数据库检查失败",
        description: `${error instanceof Error ? error.message : "无法连接到数据库或获取表信息"}`,
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const initializeDatabase = async () => {
    setIsInitializing(true);
    try {
      const missingTables = Object.entries(status.tables)
        .filter(([_, tableStatus]) => !tableStatus.exists)
        .map(([tableName]) => tableName);

      if (missingTables.length === 0) {
        toast({
          title: "无需初始化",
          description: "所有表都已存在",
        });
        return;
      }

      // 调用真实的API来创建表
      const response = await fetch("/api/database/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ missingTables }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "初始化请求失败");
      }

      const result = await response.json();
      
      // 检查结果
      if (result.results) {
        const successCount = result.summary?.success || 0;
        const failedCount = result.summary?.failed || 0;
        
        if (failedCount > 0) {
          const failedTables = Object.entries(result.results)
            .filter(([_, r]: [string, any]) => !r.success)
            .map(([tableName, r]: [string, any]) => `${tableName}: ${r.error}`)
            .join('\n');
          
          toast({
            title: `部分初始化完成 (${successCount}/${successCount + failedCount})`,
            description: `失败的表:\n${failedTables}`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "初始化完成",
            description: `成功创建 ${successCount} 个表`,
          });
        }
      }
      
      // 重新检查数据库状态
      await checkDatabase();
      
    } catch (error) {
      console.error("初始化数据库时出错:", error);
      toast({
        title: "初始化失败",
        description: `数据库初始化过程中出现错误: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const updateTables = async () => {
    setIsUpdating(true);
    try {
      const missingColumns: { [tableName: string]: string[] } = {};
      
      for (const [tableName, tableStatus] of Object.entries(status.tables)) {
        if (tableStatus.exists) {
          const missingCols = Object.entries(tableStatus.columns)
            .filter(([_, colStatus]) => !colStatus.exists)
            .map(([colName]) => colName);
          if (missingCols.length > 0) {
            missingColumns[tableName] = missingCols;
          }
        }
      }

      const totalMissingColumns = Object.values(missingColumns).reduce((sum, cols) => sum + cols.length, 0);
      
      if (totalMissingColumns === 0) {
        toast({
          title: "无需更新",
          description: "所有字段都已存在",
        });
        return;
      }

      // 调用真实的API来更新表结构
      const response = await fetch("/api/database/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ missingColumns }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "更新请求失败");
      }

      const result = await response.json();
      
      // 检查结果
      if (result.results) {
        const successCount = Object.values(result.results)
          .filter((r: any) => r.success).length;
        const failedCount = Object.values(result.results)
          .filter((r: any) => !r.success).length;
        
        if (failedCount > 0) {
          const failedUpdates = Object.entries(result.results)
            .filter(([_, r]: [string, any]) => !r.success)
            .map(([tableName, r]: [string, any]) => `${tableName}: ${r.error}`)
            .join('\n');
          
          toast({
            title: `部分更新完成 (${successCount}/${successCount + failedCount})`,
            description: `失败的更新:\n${failedUpdates}`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "更新完成",
            description: `成功添加 ${totalMissingColumns} 个字段`,
          });
        }
      }
      
      // 重新检查数据库状态
      await checkDatabase();
      
    } catch (error) {
      console.error("更新表结构时出错:", error);
      toast({
        title: "更新失败",
        description: `表结构更新过程中出现错误: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const copySQL = (sql: string) => {
    navigator.clipboard.writeText(sql.trim());
    toast({
      title: "已复制",
      description: "SQL 语句已复制到剪贴板",
    });
  };

  useEffect(() => {
    checkDatabase();
  }, []);

  const getStatusIcon = (exists: boolean, matches?: boolean) => {
    if (!exists) return <XCircle className="h-4 w-4 text-red-500" />;
    if (matches === false) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusBadge = (overallStatus: DatabaseStatus["overallStatus"]) => {
    switch (overallStatus) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">✓ 正常</Badge>;
      case "warning":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">⚠ 警告</Badge>;
      case "error":
        return <Badge variant="destructive">✗ 错误</Badge>;
      case "checking":
        return <Badge variant="outline">🔄 检查中...</Badge>;
      default:
        return <Badge variant="outline">❓ 未知</Badge>;
    }
  };

  const hasErrors = Object.values(status.tables).some(
    (table) =>
      !table.exists || Object.values(table.columns).some((col) => !col.exists)
  );

  const hasWarnings = Object.values(status.tables).some(
    (table) =>
      table.exists &&
      Object.values(table.columns).some(
        (col) =>
          col.exists &&
          (!col.typeMatch || !col.nullableMatch || !col.defaultMatch)
      )
  );

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">数据库初始化</h1>
          <p className="text-muted-foreground mt-2">检查和管理应用程序数据库表结构</p>
          <p className="text-sm text-muted-foreground mt-1">
            共 {Object.keys(EXPECTED_TABLES).length} 个表，
            {Object.values(EXPECTED_TABLES).reduce((sum, table) => sum + table.columns.length, 0)} 个字段
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(status.overallStatus)}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            数据库操作
          </CardTitle>
          <CardDescription>
            检查数据库表结构、初始化缺失的表或更新现有表结构
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button 
              onClick={checkDatabase}
              disabled={isChecking}
              variant="outline"
            >
              {isChecking && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              检查数据库
            </Button>
            
            <Button 
              onClick={initializeDatabase}
              disabled={isInitializing || !hasErrors}
            >
              {isInitializing && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              初始化数据库
            </Button>
            
            <Button 
              onClick={updateTables}
              disabled={isUpdating || (!hasErrors && !hasWarnings)}
              variant="secondary"
            >
              {isUpdating && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              更新表结构
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {Object.entries(EXPECTED_TABLES).map(([tableName, tableSchema]) => {
          const tableStatus = status.tables[tableName];
          const hasIssues =
            !tableStatus?.exists ||
            Object.values(tableStatus?.columns || {}).some(
              (col) =>
                !col.exists ||
                !col.typeMatch ||
                !col.nullableMatch ||
                !col.defaultMatch
            );

          return (
            <Card key={tableName} className={hasIssues ? "border-red-200" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table className="h-4 w-4" />
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    {tableName}
                  </code>
                  {getStatusIcon(tableStatus?.exists || false)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copySQL(tableSchema.createSQL)}
                    className="ml-auto"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    复制 SQL
                  </Button>
                </CardTitle>
                <CardDescription>{tableSchema.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {!tableStatus?.exists ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-700">表不存在</span>
                    </div>
                    <details className="group">
                      <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                        查看建表语句
                      </summary>
                      <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto">
                        <code>{tableSchema.createSQL.trim()}</code>
                      </pre>
                    </details>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">字段检查 ({tableSchema.columns.length} 个字段)</h4>
                    <div className="grid gap-2">
                      {tableSchema.columns.map((column) => {
                        const columnStatus = tableStatus.columns[column.name];
                        const hasColumnIssues =
                          !columnStatus?.exists ||
                          !columnStatus?.typeMatch ||
                          !columnStatus?.nullableMatch ||
                          !columnStatus?.defaultMatch;

                        return (
                          <div
                            key={column.name}
                            className={`flex items-center justify-between p-3 border rounded ${
                              hasColumnIssues
                                ? "border-red-200 bg-red-50"
                                : "border-gray-200"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {getStatusIcon(
                                columnStatus?.exists || false,
                                columnStatus?.typeMatch &&
                                  columnStatus?.nullableMatch &&
                                  columnStatus?.defaultMatch
                              )}
                              <code className="text-sm font-mono">
                                {column.name}
                              </code>
                              <Badge variant="outline" className="text-xs">
                                {column.type}
                              </Badge>
                              {!column.nullable && (
                                <Badge variant="secondary" className="text-xs">
                                  NOT NULL
                                </Badge>
                              )}
                              {column.default && (
                                <Badge variant="outline" className="text-xs">
                                  默认: {column.default}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs space-y-1 text-right">
                              {columnStatus && !columnStatus.exists && (
                                <div className="text-red-600">❌ 字段缺失</div>
                              )}
                              {columnStatus && columnStatus.exists && !columnStatus.typeMatch && (
                                <div className="text-yellow-600">
                                  ⚠ 类型不匹配: {columnStatus.actualType}
                                </div>
                              )}
                              {columnStatus && columnStatus.exists && !columnStatus.nullableMatch && (
                                <div className="text-yellow-600">
                                  ⚠ 可空性不匹配: {columnStatus.actualNullable ? "YES" : "NO"}
                                </div>
                              )}
                              {columnStatus && columnStatus.exists && !columnStatus.defaultMatch && column.default && (
                                <div className="text-yellow-600">
                                  ⚠ 默认值不匹配: {columnStatus.actualDefault || "NULL"}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
