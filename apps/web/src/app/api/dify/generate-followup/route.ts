import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { artifact, query } = await req.json();

    if (!artifact || !query) {
      return NextResponse.json(
        { error: "Artifact and query are required" },
        { status: 400 }
      );
    }

    const url = 'https://api.dify.ai/v1/chat-messages';
    const headers = {
      'Authorization': 'Bearer app-6YxXjVYYXyet7C4guK2BCX28',
      'Content-Type': 'application/json'
    };
    
    const data = {
      "inputs": {
        "artifact": artifact
      },
      "query": query,
      "response_mode": "streaming",
      "conversation_id": "",
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
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(jsonData)}\n\n`));
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
    console.error("Error in generate-followup API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 