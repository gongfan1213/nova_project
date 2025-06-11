'use client'

import { useState } from 'react'
import { HumanMessage, AIMessage } from '@langchain/core/messages'
import { createSupabaseClient } from '@/lib/supabase-thread-client'

export default function TestThread() {
  const [threadId, setThreadId] = useState<string>('')
  const [output, setOutput] = useState<string>('')

  const testCreateAndSaveThread = async () => {
    try {
      setOutput('开始测试...\n')
      
      const client = createSupabaseClient()
      
      // 1. 创建新线程
      setOutput(prev => prev + '创建新线程...\n')
      const thread = await client.threads.create({
        metadata: { title: 'Test Thread' }
      })
      
      const newThreadId = thread.thread_id
      setThreadId(newThreadId)
      setOutput(prev => prev + `线程创建成功: ${newThreadId}\n`)
      
      // 2. 准备测试消息
      const testMessages = [
        new HumanMessage({
          content: '你好，这是一个测试消息'
        }),
        new AIMessage({
          content: '你好！我是AI助手，很高兴为您服务。'
        })
      ]
      
      setOutput(prev => prev + '准备保存消息...\n')
      setOutput(prev => prev + `消息数量: ${testMessages.length}\n`)
      
      // 打印消息详情
      testMessages.forEach((msg, index) => {
        setOutput(prev => prev + `消息${index + 1}: ${msg.constructor.name} - "${msg.content}"\n`)
      })
      
      // 3. 保存消息
      setOutput(prev => prev + '开始保存到数据库...\n')
      
      await client.threads.updateState(newThreadId, {
        values: {
          messages: testMessages
        }
      })
      
      setOutput(prev => prev + '消息保存成功！\n')
      
      // 4. 验证保存结果
      setOutput(prev => prev + '验证保存结果...\n')
      const savedThread = await client.threads.get(newThreadId)
      
      setOutput(prev => prev + `验证结果:\n`)
      setOutput(prev => prev + `- 线程ID: ${savedThread.thread_id}\n`)
      setOutput(prev => prev + `- 保存的消息数量: ${savedThread.values?.messages?.length || 0}\n`)
      
      if (savedThread.values?.messages) {
        savedThread.values.messages.forEach((msg: any, index: number) => {
          setOutput(prev => prev + `- 消息${index + 1}: ${msg.type} - "${msg.content}"\n`)
        })
      }
      
      setOutput(prev => prev + '\n测试完成！\n')
      
    } catch (error) {
      setOutput(prev => prev + `错误: ${error}\n`)
      console.error('Test error:', error)
    }
  }

  const testExistingThread = async () => {
    if (!threadId) {
      setOutput('请先创建一个线程\n')
      return
    }
    
    try {
      setOutput('测试现有线程...\n')
      const client = createSupabaseClient()
      
      const thread = await client.threads.get(threadId)
      setOutput(prev => prev + `线程标题: ${thread.metadata?.title}\n`)
      setOutput(prev => prev + `消息数量: ${thread.values?.messages?.length || 0}\n`)
      
      if (thread.values?.messages) {
        thread.values.messages.forEach((msg: any, index: number) => {
          setOutput(prev => prev + `消息${index + 1}: ${msg.type} - "${msg.content}"\n`)
        })
      }
      
    } catch (error) {
      setOutput(prev => prev + `错误: ${error}\n`)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Thread 消息保存测试</h1>
      
      <div className="space-y-4">
        <button
          onClick={testCreateAndSaveThread}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          创建线程并保存测试消息
        </button>
        
        <button
          onClick={testExistingThread}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          disabled={!threadId}
        >
          验证现有线程
        </button>
        
        {threadId && (
          <div className="mt-4 p-2 bg-gray-100 rounded">
            <strong>当前线程ID:</strong> {threadId}
          </div>
        )}
        
        <div className="mt-4">
          <h2 className="text-lg font-semibold">输出:</h2>
          <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap max-h-96 overflow-y-auto">
            {output}
          </pre>
        </div>
        
        <button
          onClick={() => setOutput('')}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          清空输出
        </button>
      </div>
    </div>
  )
} 