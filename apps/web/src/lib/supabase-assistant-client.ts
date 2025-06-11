/**
 * Supabase Assistant Client - LangGraph SDK 兼容的适配器
 * 提供与 createClient().assistants 相同的接口
 */

export interface AssistantTool {
    name: string
    description: string
    parameters: Record<string, any>
}

export interface CreateAssistantFields {
    iconData?: {
        iconName: string
        iconColor: string
    }
    name: string
    description?: string
    tools?: Array<AssistantTool>
    systemPrompt?: string
    is_default?: boolean
    documents?: any[]
}

export interface Assistant {
    assistant_id: string
    name: string
    graphId?: string
    metadata: {
        user_id: string
        description?: string
        is_default?: boolean
        iconData?: {
            iconName: string
            iconColor: string
        }
    }
    config: {
        configurable: {
            systemPrompt?: string
            tools?: AssistantTool[]
            documents?: any[]
        }
    }
    created_at: string
    updated_at: string
}

export interface CreateAssistantArgs {
    graphId?: string
    name: string
    metadata: Record<string, any>
    config: {
        configurable: {
            tools?: AssistantTool[]
            systemPrompt?: string
            documents?: any[]
        }
    }
    ifExists?: 'do_nothing' | 'raise'
}

export interface SearchAssistantsArgs {
    graphId?: string
    metadata?: Record<string, any>
    limit?: number
}

export interface UpdateAssistantArgs {
    name?: string
    graphId?: string
    metadata?: Record<string, any>
    config?: {
        configurable?: {
            tools?: AssistantTool[]
            systemPrompt?: string
            documents?: any[]
        }
    }
}

class SupabaseAssistantClient {
    private baseUrl = '/api/assistant'

    async create(args: CreateAssistantArgs): Promise<Assistant> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(args),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to create assistant')
        }

        return response.json()
    }

    async search(args: SearchAssistantsArgs = {}): Promise<Assistant[]> {
        const response = await fetch(`${this.baseUrl}/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(args),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to search assistants')
        }

        return response.json()
    }

    async get(assistantId: string): Promise<Assistant> {
        const response = await fetch(`${this.baseUrl}/${assistantId}`, {
            method: 'GET',
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to get assistant')
        }

        return response.json()
    }

    async update(assistantId: string, args: UpdateAssistantArgs): Promise<Assistant> {
        const response = await fetch(`${this.baseUrl}/${assistantId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(args),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to update assistant')
        }

        return response.json()
    }

    async delete(assistantId: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/${assistantId}`, {
            method: 'DELETE',
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to delete assistant')
        }
    }

    // Context Documents 管理
    async getContextDocuments(assistantId: string): Promise<any[]> {
        const response = await fetch(`${this.baseUrl}/${assistantId}/documents`, {
            method: 'GET',
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to get context documents')
        }

        return response.json()
    }

    async putContextDocuments(assistantId: string, documents: any[]): Promise<any[]> {
        const response = await fetch(`${this.baseUrl}/${assistantId}/documents`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ documents }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to update context documents')
        }

        const result = await response.json()
        return result.documents
    }
}

// 创建全局实例
export const supabaseAssistantClient = new SupabaseAssistantClient()

// 提供与 LangGraph 兼容的接口
export function createSupabaseClient() {
    return {
        assistants: supabaseAssistantClient,
    }
} 