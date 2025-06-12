import { useEffect, useState } from 'react'
import { XiaohongshuCard } from './XiaohongshuCard'

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
      <div className="bg-white rounded-xl shadow-xl p-6 w-[340px]">
        <div className="font-bold text-lg mb-4">编辑草稿</div>
        <div className="mb-3">
          <input
            className="w-full border rounded px-2 py-1 mb-2"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="标题"
          />
          <textarea
            className="w-full border rounded px-2 py-1 min-h-[60px]"
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

  const fetchArticles = () => {
    if (open && projectId) {
      setLoading(true)
      fetch(`/api/projects/${projectId}/xiaohongshu`).then(res => res.json()).then(data => {
        setArticles(data || [])
        console.log(data)
        setLoading(false)
      })
    } else if (!open) {
      setArticles([])
    }
  }

  useEffect(() => {
    fetchArticles()
    // eslint-disable-next-line
  }, [open, projectId])

  // 删除草稿
  const handleDelete = async (article) => {
    if (!window.confirm('确定要删除这篇草稿吗？')) return
    await fetch(`/api/xiaohongshu-articles/${article.id}`, { method: 'DELETE' })
    fetchArticles()
  }

  // 复制草稿
  const handleCopy = async (article) => {
    setCopyingId(article.id)
    try {
      const baseTitle = article.title.replace(/\d+$/, '')
      const res = await fetch(`/api/projects/${article.project_id || projectId}/xiaohongshu`)
      let allArticles = await res.json()
      if (!Array.isArray(allArticles)) allArticles = []
      const sameTitleArticles = allArticles.filter(a => {
        const match = a.title.match(new RegExp(`^${baseTitle}(\\d+)$`))
        return match || a.title === baseTitle
      })
      let newTitle = baseTitle + '01'
      if (sameTitleArticles && sameTitleArticles.length > 0) {
        const count = sameTitleArticles.length + 1
        newTitle = baseTitle + count.toString().padStart(2, '0')
      }
      const resp = await fetch(`/api/xiaohongshu-articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: article.project_id || projectId,
          title: newTitle,
          description: article.description,
          content: article.content,
          status: article.status,
          category: article.category,
        })
      })
      if (!resp.ok) {
        const err = await resp.json()
        alert('复制失败: ' + (err.error || resp.statusText))
      } else {
        fetchArticles()
      }
    } catch (e) {
      alert('复制失败: ' + (e?.message || e))
    } finally {
      setCopyingId(null)
    }
  }

  // 编辑草稿弹窗
  const handleEdit = (article) => {
    setEditingArticle(article)
    setEditOpen(true)
  }
  const handleEditSave = async (newArticle) => {
    await fetch(`/api/xiaohongshu-articles/${newArticle.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newArticle.title,
        content: newArticle.content,
      })
    })
    setEditOpen(false)
    setEditingArticle(null)
    fetchArticles()
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
          articles.map((article, idx) => (
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