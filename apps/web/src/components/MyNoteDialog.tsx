import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, X } from "lucide-react";

const MyNoteDialog = () => {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  return (
    <div className="relative">
      {!open && (
        <Button
          variant="outline"
          className="border-gray-300 text-gray-700 rounded-full shadow-lg"
          onClick={() => setOpen(true)}
        >
          <Pencil size={18} />
          <span className="ml-1">我的笔记</span>
        </Button>
      )}
      {open && (
        <div className="w-80 p-4 bg-white rounded-xl shadow-2xl flex flex-col gap-2">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-gray-800">我的笔记</span>
            <button
              className="text-gray-400 hover:text-gray-600"
              onClick={() => setOpen(false)}
              aria-label="关闭"
            >
              <X size={18} />
            </button>
          </div>
          <Textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="写下你的想法..."
            className="min-h-[80px] resize-none"
          />
        </div>
      )}
    </div>
  );
};

export default MyNoteDialog; 