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
  {
    title: '职场新人必备指南',
    description: '全面解析iPhone 15 Pro的设计、性能、摄影等特性，为用户提供购买决策建议',
    status: '已完成',
    category: '科技',
    updated_at: '2024-06-06',
  },
  // ...更多文章
]

export function XiaohongshuPopover({ open, onClose }: { open: boolean, onClose: () => void }) {
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
        {mockArticles.map((article, idx) => (
          <XiaohongshuCard key={idx} article={article} />
        ))}
      </div>
    </div>
  )
} 