// Supabase Thread Client - 兼容 LangGraph SDK 的 Thread 接口

export interface ThreadMetadata {
  supabase_user_id?: string
  customModelName?: string
  modelConfig?: any
  thread_title?: string
  [key: string]: any
}

export interface ThreadValues {
  artifact?: any
  messages?: any[]
}

export interface Thread {
  thread_id: string
  created_at: string
  updated_at: string
  metadata: ThreadMetadata
  values?: ThreadValues
}

export interface CreateThreadArgs {
  metadata?: ThreadMetadata
}

export interface SearchThreadsArgs {
  metadata?: ThreadMetadata
  limit?: number
}

export interface UpdateThreadArgs {
  metadata?: ThreadMetadata
}

export interface ThreadState {
  values: ThreadValues
}

export interface ThreadClient {
  create(args?: CreateThreadArgs): Promise<Thread>
  search(args?: SearchThreadsArgs): Promise<Thread[]>
  get(threadId: string): Promise<Thread>
  update(threadId: string, args: UpdateThreadArgs): Promise<Thread>
  delete(threadId: string): Promise<void>
  updateState(threadId: string, state: ThreadState): Promise<void>
}

class SupabaseThreadClient implements ThreadClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = '/api/thread'
  }

  async create(args: CreateThreadArgs = {}): Promise<Thread> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create thread')
    }

    return response.json()
  }

  async search(args: SearchThreadsArgs = {}): Promise<Thread[]> {
    const params = new URLSearchParams()
    
    if (args.limit) {
      params.append('limit', args.limit.toString())
    }
    
    if (args.metadata) {
      params.append('metadata', JSON.stringify(args.metadata))
    }

    const url = `${this.baseUrl}?${params.toString()}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to search threads')
    }

    return response.json()
  }

  async get(threadId: string): Promise<Thread> {
    const response = await fetch(`${this.baseUrl}/${threadId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get thread')
    }

    return response.json()
  }

  async update(threadId: string, args: UpdateThreadArgs): Promise<Thread> {
    const response = await fetch(`${this.baseUrl}/${threadId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update thread')
    }

    return response.json()
  }

  async delete(threadId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${threadId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete thread')
    }
  }

  async updateState(threadId: string, state: ThreadState): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${threadId}/state`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(state),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update thread state')
    }
  }
}

// 创建全局的 Thread 客户端实例
let threadClientInstance: SupabaseThreadClient | null = null

export function createSupabaseThreadClient(): ThreadClient {
  if (!threadClientInstance) {
    threadClientInstance = new SupabaseThreadClient()
  }
  return threadClientInstance
}

// 兼容性：提供与 LangGraph SDK 相同的客户端接口
export class SupabaseClient {
  public threads: ThreadClient

  constructor() {
    this.threads = createSupabaseThreadClient()
  }
}

// 创建兼容 LangGraph 的客户端
export function createSupabaseClient(): SupabaseClient {
  return new SupabaseClient()
} 