import { Dialog, DialogContent } from '@/components/ui/dialog'
import { XiaohongshuCard } from './XiaohongshuCard'

const mockArticles = [
  {
    title: '夏日护肤攻略',
    description: '夏天护肤的关键要点',
    status: '草稿',
    category: '美妆',
    updated_at: '2024-06-05',
  },
  {
    title: 'iPhone 15 Pro深度评测',
    description: '全面解析iPhone 15 Pro的设计、性能、摄影等特性，为用户提供购买决策建议',
    status: '已完成',
    category: '科技',
    updated_at: '2024-06-06',
  },
  // ...更多文章
]

export function XiaohongshuListDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockArticles.map((article, idx) => (
            <XiaohongshuCard key={idx} article={article} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
} 