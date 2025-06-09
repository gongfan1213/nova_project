import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface NewTagDialogProps {
  onAddTag: (tag: string) => void;
}

const NewTagDialog = ({ onAddTag }: NewTagDialogProps) => {
  const [open, setOpen] = useState(false);
  const [tagName, setTagName] = useState("");

  const handleSubmit = () => {
    if (tagName.trim()) {
      onAddTag(tagName.trim());
      setTagName("");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed border-gray-300 text-gray-500">
          + 新增标签
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>新增标签</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="tagName" className="text-sm font-medium">
              标签名称
            </label>
            <Input
              id="tagName"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="请输入标签名称"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>
            创建
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewTagDialog;