import { NextRequest, NextResponse } from 'next/server'

interface AgentRequestBody {
  query: string
  conversation_id?: string
  [key: string]: any
}

interface AgentResponse {
  event: string
  data?: any
  [key: string]: any
}

export async function POST(req: NextRequest) {
  try {
    const { query, artifact }: AgentRequestBody = await req.json()

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // 目标 API 地址
    const targetUrl = 'https://api.dify.ai/v1/chat-messages';

    // 准备请求头
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer app-6YxXjVYYXyet7C4guK2BCX28',
      'User-Agent': 'Nova-Agent/1.0',
    }
    const data = {
      "inputs": {
        "artifact": artifact
      },
      "query": query,
      "response_mode": "streaming",
      "conversation_id": "",
      "user": "abc-123",
    };

    // 转发请求到目标 API
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Agent API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })

      return NextResponse.json(
        {
          error: 'Failed to call Agent API',
          status: response.status,
          details: errorText
        },
        { status: response.status }
      )
    }

    // 创建流式响应
    const stream = new ReadableStream({
      start(controller) {
        const reader = response.body?.getReader()

        if (!reader) {
          controller.error(new Error('No response body reader available'))
          return
        }

        const decoder = new TextDecoder()

        async function pump(): Promise<void> {
          try {
            const { done, value } = await reader!.read()

            if (done) {
              controller.close()
              return
            }

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
              const trimmedLine = line.trim()

              if (trimmedLine && trimmedLine.startsWith('data: ')) {
                try {
                  const dataStr = trimmedLine.slice(6)

                  // 处理特殊情况：data: [DONE]
                  if (dataStr === '[DONE]') {
                    controller.enqueue(
                      new TextEncoder().encode('data: [DONE]\n\n')
                    )
                    continue
                  }

                  const jsonData: AgentResponse = JSON.parse(dataStr)

                  // 转发所有数据，保持原始格式
                  const encodedData = new TextEncoder().encode(
                    `data: ${JSON.stringify(jsonData)}\n\n`
                  )
                  controller.enqueue(encodedData)

                } catch (parseError) {
                  console.warn('Failed to parse SSE data:', parseError, 'Line:', trimmedLine)
                  // 对于无法解析的数据，直接转发
                  controller.enqueue(
                    new TextEncoder().encode(`${line}\n`)
                  )
                }
              } else if (trimmedLine.startsWith('event: ') || trimmedLine.startsWith('id: ')) {
                // 转发其他 SSE 字段
                controller.enqueue(
                  new TextEncoder().encode(`${line}\n`)
                )
              }
            }

            return pump()
          } catch (error) {
            console.error('Error in stream pump:', error)
            controller.error(error)
          }
        }

        pump()
      },

      cancel() {
        // 清理资源
        response.body?.cancel()
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })

  } catch (error) {
    console.error('Error in agent artifact API:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// 处理 OPTIONS 请求（CORS 预检）
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 