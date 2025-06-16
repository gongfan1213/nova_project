import { Badge } from '@/components/ui/badge'
import { Edit3, Copy, Trash2, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface XiaohongshuCardProps {
  article: any
  onEdit?: (article: any) => void
  onCopy?: (article: any) => void
  onDelete?: (article: any) => void
  copying?: boolean
}

export function XiaohongshuCard({ article, onEdit, onCopy, onDelete, copying }: XiaohongshuCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="bg-white rounded-[20px] shadow p-4 w-[340px] group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-base">{article.title}</div>
        <Badge className={article.status === '已完成' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
          {article.status}
        </Badge>
      </div>
      <div className="text-gray-600 mb-3 line-clamp-3 min-h-[48px]">{article.description || ''}</div>
      <div className="flex items-center justify-between mb-2">
        <div className={`flex items-center justify-between w-full ${hovered ? 'hidden' : ''} group-hover:hidden`}>
          <span className="text-xs text-gray-500">
            最后修改: {article.updated_at ? article.updated_at.slice(0, 10) : ''}
          </span>
          <Badge variant="outline" className="text-gray-600 border-gray-300">{article.category}</Badge>
        </div>
        <div className={`hidden ${hovered ? 'flex' : ''} group-hover:flex items-center justify-end w-full space-x-1`}>
          <button onClick={() => onEdit?.(article)} className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded flex items-center justify-center">
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => onCopy?.(article)}
            className="h-8 w-8 p-0 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded flex items-center justify-center"
            disabled={copying}
          >
            {copying ? <Loader2 size={16} className="animate-spin" /> : <Copy size={14} />}
          </button>
          <button onClick={() => onDelete?.(article)} className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded flex items-center justify-center">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
} 