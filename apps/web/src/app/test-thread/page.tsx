'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase-thread-client'
import type { Thread } from '@/lib/supabase-thread-client'

export default function TestThreadPage() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const client = createSupabaseClient()

  const loadThreads = async () => {
    setLoading(true)
    setError(null)
    try {
      const userThreads = await client.threads.search({ limit: 10 })
      setThreads(userThreads)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load threads')
    } finally {
      setLoading(false)
    }
  }

  const createThread = async () => {
    setLoading(true)
    setError(null)
    try {
      const newThread = await client.threads.create({
        metadata: {
          customModelName: 'gpt-4',
          thread_title: `Test Thread ${new Date().toLocaleTimeString()}`,
        },
      })
      setThreads([newThread, ...threads])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create thread')
    } finally {
      setLoading(false)
    }
  }

  const loadThread = async (threadId: string) => {
    setLoading(true)
    setError(null)
    try {
      const thread = await client.threads.get(threadId)
      setSelectedThread(thread)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load thread')
    } finally {
      setLoading(false)
    }
  }

  const deleteThread = async (threadId: string) => {
    setLoading(true)
    setError(null)
    try {
      await client.threads.delete(threadId)
      setThreads(threads.filter(t => t.thread_id !== threadId))
      if (selectedThread?.thread_id === threadId) {
        setSelectedThread(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete thread')
    } finally {
      setLoading(false)
    }
  }

  const updateThreadState = async (threadId: string) => {
    setLoading(true)
    setError(null)
    try {
      await client.threads.updateState(threadId, {
        values: {
          artifact: {
            currentIndex: 1,
            contents: [
              {
                index: 1,
                type: 'text',
                title: 'Test Artifact',
                fullMarkdown: '# Test Content\n\nThis is a test artifact.',
              },
            ],
          },
          messages: [
            {
              type: 'human',
              content: 'Hello, this is a test message',
              created_at: new Date().toISOString(),
            },
          ],
        },
      })
      // Reload the thread to see updated state
      if (selectedThread) {
        await loadThread(threadId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update thread state')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadThreads()
  }, [])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Thread Migration Test</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thread List */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Threads</h2>
            <div className="space-x-2">
              <button
                onClick={createThread}
                disabled={loading}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Create Thread
              </button>
              <button
                onClick={loadThreads}
                disabled={loading}
                className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {threads.map((thread) => (
              <div
                key={thread.thread_id}
                className="border rounded p-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => loadThread(thread.thread_id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">
                      {thread.metadata.thread_title || 'Untitled Thread'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(thread.created_at).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      Model: {thread.metadata.customModelName || 'N/A'}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteThread(thread.thread_id)
                    }}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {threads.length === 0 && !loading && (
              <div className="text-gray-500 text-center py-4">
                No threads found. Create one to get started.
              </div>
            )}
          </div>
        </div>

        {/* Thread Detail */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Thread Details</h2>

          {selectedThread ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Basic Info</h3>
                <div className="text-sm space-y-1">
                  <div>ID: {selectedThread.thread_id}</div>
                  <div>Title: {selectedThread.metadata.thread_title || 'Untitled'}</div>
                  <div>Model: {selectedThread.metadata.customModelName || 'N/A'}</div>
                  <div>Created: {new Date(selectedThread.created_at).toLocaleString()}</div>
                  <div>Updated: {new Date(selectedThread.updated_at).toLocaleString()}</div>
                </div>
              </div>

              <div>
                <h3 className="font-medium">Metadata</h3>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(selectedThread.metadata, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-medium">Values</h3>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(selectedThread.values, null, 2)}
                </pre>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => updateThreadState(selectedThread.thread_id)}
                  disabled={loading}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50"
                >
                  Update State (Test)
                </button>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              Select a thread to view details
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded">
          Loading...
        </div>
      )}
    </div>
  )
} 