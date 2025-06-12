import { Badge } from '@/components/ui/badge'

export function XiaohongshuCard({ article }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 w-[340px]">
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-base">{article.title}</div>
        <Badge className={article.status === '已完成' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
          {article.status}
        </Badge>
      </div>
      <div className="text-gray-600 mb-3 line-clamp-3 min-h-[48px]">{article.description}</div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>最后修改: {article.updated_at?.slice(0, 10) || ''}</span>
        <Badge variant="outline" className="text-gray-600 border-gray-300">{article.category}</Badge>
      </div>
    </div>
  )
} 