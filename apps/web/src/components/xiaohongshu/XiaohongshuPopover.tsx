import { useEffect, useState } from 'react'
import { XiaohongshuCard } from './XiaohongshuCard'
import { createSupabaseClient } from '@/lib/supabase/client'

function EditDialog({ open, article, onClose, onSave }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  useEffect(() => {
    setTitle(article?.title || '')
    setContent(article?.content || '')
  }, [article, open])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-xl p-6 w-[900px]">
        <div className="font-bold text-lg mb-4">编辑草稿</div>
        <div className="mb-3">
          <input
            className="w-full border rounded px-2 py-1 mb-2"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="标题"
          />
          <textarea
            className="w-full border rounded px-2 py-1 min-h-[500px]"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="正文内容"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 rounded bg-gray-100" onClick={onClose}>取消</button>
          <button
            className="px-3 py-1 rounded bg-red-500 text-white"
            onClick={() => onSave({ ...article, title, content })}
            disabled={!title.trim()}
          >保存</button>
        </div>
      </div>
    </div>
  )
}

export function XiaohongshuPopover({ open, onClose, projectId }: { open: boolean, onClose: () => void, projectId?: string }) {
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<any>(null)
  const [copyingId, setCopyingId] = useState<string | null>(null)

  // 新增：Supabase 查询草稿
  const fetchArticles = async () => {
    if (open && projectId) {
      setLoading(true)
      const supabase = createSupabaseClient()
      // 1. 查找当前 thread（projectId）下所有 artifacts
      const { data: artifacts, error: artifactsError } = await supabase
        .from('artifacts')
        .select('id, updated_at')
        .eq('thread_id', projectId)
        .order('updated_at', { ascending: false })
      if (artifactsError || !artifacts || artifacts.length === 0) {
        setArticles([])
        setLoading(false)
        return
      }
      // 2. 查找所有 artifact 下的所有 artifact_content
      const artifactIds = artifacts.map(a => a.id)
      const { data: artifactContents } = await supabase
        .from('artifact_contents')
        .select('*')
        .in('artifact_id', artifactIds)
        .order('artifact_id', { ascending: false })
        .order('index', { ascending: false })
      if (!artifactContents || artifactContents.length === 0) {
        setArticles([])
        setLoading(false)
        return
      }
      // 3. 组装 articles，每个 artifact_content 都是一条草稿
      const articles = artifactContents.map(ac => ({
        id: ac.artifact_id, // 这里用 artifact_id 作为唯一标识
        title: ac.title,
        description: ac.full_markdown?.slice(0, 20) || '',
        content: ac.full_markdown,
        updated_at: ac.created_at,
        status: '草稿',
        category: '',
      }))
      setArticles(articles)
      setLoading(false)
    } else {
      setArticles([])
    }
  }

  useEffect(() => {
    fetchArticles()
    // eslint-disable-next-line
  }, [open, projectId])

  // 删除草稿
  const handleDelete = async (article: { id: string }) => {
    if (!window.confirm('确定要删除这篇草稿吗？')) return
    try {
      const supabase = createSupabaseClient()
      // 删除 artifact 会自动级联删除相关的 artifact_contents
      const { error } = await supabase
        .from('artifacts')
        .delete()
        .eq('id', article.id)
      
      if (error) {
        throw new Error('删除失败')
      }
      fetchArticles()
    } catch (e: any) {
      alert('删除失败: ' + (e?.message || e))
    }
  }

  // 复制草稿
  const handleCopy = async (article: { id: string; title: string; content: string; category?: string }) => {
    setCopyingId(article.id)
    try {
      const supabase = createSupabaseClient()
      const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : null
      if (!user) {
        throw new Error('用户未登录')
      }
      // 1. 新建 artifact，thread_id 用当前 projectId，user_id 必须传
      const { data: newArtifact, error: artifactError } = await supabase
        .from('artifacts')
        .insert({
          thread_id: projectId,
          user_id: user.id,
          current_index: 1
        })
        .select()
        .single()
      if (artifactError || !newArtifact) {
        throw new Error('创建新草稿内容失败')
      }
      // 2. 新建 artifact_content，内容与当前 article 一致
      const { error: contentError } = await supabase
        .from('artifact_contents')
        .insert({
          artifact_id: newArtifact.id,
          index: 1,
          type: 'text',
          title: article.title,
          full_markdown: article.content
        })
      if (contentError) {
        throw new Error('复制草稿内容失败')
      }
      fetchArticles()
    } catch (e: any) {
      alert('复制失败: ' + (e?.message || e))
    } finally {
      setCopyingId(null)
    }
  }

  // 编辑草稿弹窗
  const handleEdit = (article: { id: string; title: string; content: string }) => {
    setEditingArticle(article)
    setEditOpen(true)
  }

  const handleEditSave = async (newArticle: { id: string; title: string; content: string }) => {
    try {
      const supabase = createSupabaseClient()
      // 更新 artifact_contents 中的内容
      const { error } = await supabase
        .from('artifact_contents')
        .update({
          title: newArticle.title,
          full_markdown: newArticle.content
        })
        .eq('artifact_id', newArticle.id)
        .eq('index', 1)

      if (error) {
        throw new Error('保存失败')
      }

      setEditOpen(false)
      setEditingArticle(null)
      fetchArticles()
    } catch (e: any) {
      alert('保存失败: ' + (e?.message || e))
    }
  }

  if (!open) return null
  return (
    <div
      className="absolute z-50 right-0 mt-2 w-[380px] max-h-[520px] bg-white rounded-xl shadow-2xl flex flex-col gap-3 p-4"
      style={{ top: 48 }}
    >
      <EditDialog open={editOpen} article={editingArticle} onClose={() => setEditOpen(false)} onSave={handleEditSave} />
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-gray-800">我的草稿</span>
        <button
          className="text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label="关闭"
        >
          ×
        </button>
      </div>
      <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: 420 }}>
        {loading ? (
          <div className="text-gray-400 text-center py-8">加载中...</div>
        ) : articles.length === 0 ? (
          <div className="text-gray-400 text-center py-8">暂无草稿</div>
        ) : (
          (Array.isArray(articles) ? articles : []).map((article, idx) => (
            <XiaohongshuCard
              key={article.id || idx}
              article={article}
              onEdit={handleEdit}
              onCopy={handleCopy}
              onDelete={handleDelete}
              copying={copyingId === article.id}
            />
          ))
        )}
      </div>
    </div>
  )
} 