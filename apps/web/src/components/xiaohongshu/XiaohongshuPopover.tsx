import { useEffect, useState } from 'react'
import { XiaohongshuCard } from './XiaohongshuCard'

export function XiaohongshuPopover({ open, onClose, projectId }: { open: boolean, onClose: () => void, projectId?: string }) {
  const [articles, setArticles] = useState<any[]>([])

  useEffect(() => {
    if (open && projectId) {
      fetch(`/api/projects/${projectId}/xiaohongshu`).then(res => res.json()).then(data => setArticles(data || []))
    } else if (!open) {
      setArticles([])
    }
  }, [open, projectId])

  if (!open) return null
  return (
    <div
      className="absolute z-50 right-0 mt-2 w-[380px] max-h-[520px] bg-white rounded-xl shadow-2xl flex flex-col gap-3 p-4"
      style={{ top: 48 }}
    >
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
        {articles.length === 0 ? (
          <div className="text-gray-400 text-center py-8">暂无草稿</div>
        ) : (
          articles.map((article, idx) => (
            <XiaohongshuCard key={article.id || idx} article={article} />
          ))
        )}
      </div>
    </div>
  )
} 