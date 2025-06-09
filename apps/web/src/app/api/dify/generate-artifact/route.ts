import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { query, conversation_id } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const url = 'https://api.dify.ai/v1/chat-messages';
    const headers = {
      'Authorization': 'Bearer app-OO49SYLKS9blEdwzxCLc7RvU',
      'Content-Type': 'application/json'
    };
    
    const data = {
      "inputs": {},
      "query": query,
      "response_mode": "streaming",
      "conversation_id": conversation_id || "",
      "user": "abc-123",
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to call Dify API" },
        { status: response.status }
      );
    }

    // Return a streaming response
    const stream = new ReadableStream({
      start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let conversationId = "";

        function pump(): Promise<void> {
          return reader!.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.trim() && line.startsWith('data: ')) {
                try {
                  const jsonData = JSON.parse(line.slice(6));
                  // 仅保留event为message的记录
                  if (jsonData.event === 'message') {
                    // 提取 conversation_id
                    if (jsonData.conversation_id && !conversationId) {
                      conversationId = jsonData.conversation_id;
                    }
                    // 确保在响应中包含 conversation_id
                    const responseData = {
                      ...jsonData,
                      conversation_id: conversationId || jsonData.conversation_id
                    };
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(responseData)}\n\n`));
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }

            return pump();
          });
        }

        pump().catch((err) => {
          controller.error(err);
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error("Error in generate-artifact API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 