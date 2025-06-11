export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            artifact_contents: {
                Row: {
                    artifact_id: string | null
                    code: string | null
                    created_at: string | null
                    full_markdown: string | null
                    id: string
                    index: number
                    language: string | null
                    title: string
                    type: string
                }
                Insert: {
                    artifact_id?: string | null
                    code?: string | null
                    created_at?: string | null
                    full_markdown?: string | null
                    id?: string
                    index: number
                    language?: string | null
                    title: string
                    type: string
                }
                Update: {
                    artifact_id?: string | null
                    code?: string | null
                    created_at?: string | null
                    full_markdown?: string | null
                    id?: string
                    index?: number
                    language?: string | null
                    title?: string
                    type?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "artifact_contents_artifact_id_fkey"
                        columns: ["artifact_id"]
                        isOneToOne: false
                        referencedRelation: "artifacts"
                        referencedColumns: ["id"]
                    },
                ]
            }
            artifacts: {
                Row: {
                    created_at: string | null
                    current_index: number | null
                    id: string
                    metadata: Json | null
                    thread_id: string | null
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    current_index?: number | null
                    id?: string
                    metadata?: Json | null
                    thread_id?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    current_index?: number | null
                    id?: string
                    metadata?: Json | null
                    thread_id?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "artifacts_thread_id_fkey"
                        columns: ["thread_id"]
                        isOneToOne: false
                        referencedRelation: "threads"
                        referencedColumns: ["id"]
                    },
                ]
            }
            assistants: {
                Row: {
                    config: Json | null
                    created_at: string | null
                    description: string | null
                    icon_color: string | null
                    icon_name: string | null
                    id: string
                    is_default: boolean | null
                    metadata: Json | null
                    name: string
                    system_prompt: string | null
                    tools: Json | null
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    config?: Json | null
                    created_at?: string | null
                    description?: string | null
                    icon_color?: string | null
                    icon_name?: string | null
                    id?: string
                    is_default?: boolean | null
                    metadata?: Json | null
                    name: string
                    system_prompt?: string | null
                    tools?: Json | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    config?: Json | null
                    created_at?: string | null
                    description?: string | null
                    icon_color?: string | null
                    icon_name?: string | null
                    id?: string
                    is_default?: boolean | null
                    metadata?: Json | null
                    name?: string
                    system_prompt?: string | null
                    tools?: Json | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: []
            }
            context_documents: {
                Row: {
                    assistant_id: string | null
                    content: string
                    created_at: string | null
                    file_size: number | null
                    file_type: string | null
                    id: string
                    metadata: Json | null
                    name: string
                    user_id: string | null
                }
                Insert: {
                    assistant_id?: string | null
                    content: string
                    created_at?: string | null
                    file_size?: number | null
                    file_type?: string | null
                    id?: string
                    metadata?: Json | null
                    name: string
                    user_id?: string | null
                }
                Update: {
                    assistant_id?: string | null
                    content?: string
                    created_at?: string | null
                    file_size?: number | null
                    file_type?: string | null
                    id?: string
                    metadata?: Json | null
                    name?: string
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "context_documents_assistant_id_fkey"
                        columns: ["assistant_id"]
                        isOneToOne: false
                        referencedRelation: "assistants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            messages: {
                Row: {
                    additional_kwargs: Json | null
                    content: string
                    created_at: string | null
                    id: string
                    metadata: Json | null
                    response_metadata: Json | null
                    run_id: string | null
                    sequence_number: number
                    thread_id: string | null
                    tool_calls: Json | null
                    type: string
                    usage_metadata: Json | null
                    user_id: string | null
                }
                Insert: {
                    additional_kwargs?: Json | null
                    content: string
                    created_at?: string | null
                    id?: string
                    metadata?: Json | null
                    response_metadata?: Json | null
                    run_id?: string | null
                    sequence_number: number
                    thread_id?: string | null
                    tool_calls?: Json | null
                    type: string
                    usage_metadata?: Json | null
                    user_id?: string | null
                }
                Update: {
                    additional_kwargs?: Json | null
                    content?: string
                    created_at?: string | null
                    id?: string
                    metadata?: Json | null
                    response_metadata?: Json | null
                    run_id?: string | null
                    sequence_number?: number
                    thread_id?: string | null
                    tool_calls?: Json | null
                    type?: string
                    usage_metadata?: Json | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "messages_thread_id_fkey"
                        columns: ["thread_id"]
                        isOneToOne: false
                        referencedRelation: "threads"
                        referencedColumns: ["id"]
                    },
                ]
            }
            projects: {
                Row: {
                    category: string | null
                    content: string | null
                    created_at: string | null
                    description: string | null
                    id: string
                    metadata: Json | null
                    name: string
                    status: string | null
                    tags: string | null
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    category?: string | null
                    content?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    metadata?: Json | null
                    name: string
                    status?: string | null
                    tags?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    category?: string | null
                    content?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    metadata?: Json | null
                    name?: string
                    status?: string | null
                    tags?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: []
            }
            quick_actions: {
                Row: {
                    action_type: string
                    config: Json | null
                    created_at: string | null
                    description: string | null
                    id: string
                    name: string
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    action_type: string
                    config?: Json | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name: string
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    action_type?: string
                    config?: Json | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name?: string
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: []
            }
            reflections: {
                Row: {
                    assistant_id: string | null
                    content: Json
                    created_at: string | null
                    id: string
                    style_rules: Json | null
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    assistant_id?: string | null
                    content: Json
                    created_at?: string | null
                    id?: string
                    style_rules?: Json | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    assistant_id?: string | null
                    content?: Json
                    created_at?: string | null
                    id?: string
                    style_rules?: Json | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "reflections_assistant_id_fkey"
                        columns: ["assistant_id"]
                        isOneToOne: false
                        referencedRelation: "assistants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            tags: {
                Row: {
                    created_at: string | null
                    id: string
                    name: string
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    name: string
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    name?: string
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: []
            }
            threads: {
                Row: {
                    assistant_id: string | null
                    conversation_id: string | null
                    created_at: string | null
                    id: string
                    metadata: Json | null
                    model_config: Json | null
                    model_name: string | null
                    title: string | null
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    assistant_id?: string | null
                    conversation_id?: string | null
                    created_at?: string | null
                    id?: string
                    metadata?: Json | null
                    model_config?: Json | null
                    model_name?: string | null
                    title?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    assistant_id?: string | null
                    conversation_id?: string | null
                    created_at?: string | null
                    id?: string
                    metadata?: Json | null
                    model_config?: Json | null
                    model_name?: string | null
                    title?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "threads_assistant_id_fkey"
                        columns: ["assistant_id"]
                        isOneToOne: false
                        referencedRelation: "assistants"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
        PublicSchema['Views'])
    ? (PublicSchema['Tables'] &
        PublicSchema['Views'])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never 