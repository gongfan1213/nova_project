import { useState } from 'react'

export function MyNotePopover({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [note, setNote] = useState('')
  if (!open) return null
  return (
    <div
      className="absolute z-50 right-0 mt-2 w-[340px] bg-white rounded-xl shadow-2xl flex flex-col gap-2 p-4"
      style={{ top: 48 }}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-gray-800">我的笔记</span>
        <button
          className="text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label="关闭"
        >
          ×
        </button>
      </div>
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="写下你的想法..."
        className="min-h-[80px] resize-none border rounded p-2"
      />
    </div>
  )
} 