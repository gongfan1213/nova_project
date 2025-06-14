import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createSupabaseClient } from "@/lib/supabase/client";

const USER_ID = "f53ad801-aeef-4d39-9dbc-4042717ee508";

interface NewTagDialogProps {
  onTagCreated?: () => void;
}

const NewTagDialog = ({ onTagCreated }: NewTagDialogProps) => {
  const [open, setOpen] = useState(false);
  const [tagName, setTagName] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createSupabaseClient();

  const handleSubmit = async () => {
    if (tagName.trim()) {
      setLoading(true);
      await supabase.from("tags").insert([{ name: tagName.trim(), user_id: USER_ID }]);
      setLoading(false);
      setTagName("");
      setOpen(false);
      onTagCreated && onTagCreated();
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
              disabled={loading}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            创建
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewTagDialog;