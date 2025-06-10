import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createSupabaseClient } from "@/lib/supabase/client";

const USER_ID = "f53ad801-aeef-4d39-9dbc-4042717ee508";

interface NewProjectDialogProps {
  onProjectCreated?: () => void;
  availableTags: string[];
}

const NewProjectDialog = ({ onProjectCreated, availableTags }: NewProjectDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createSupabaseClient();

  const handleSubmit = async () => {
    if (title.trim() && description.trim() && category) {
      setLoading(true);
      await supabase.from("projects").insert([
        {
          title: title.trim(),
          description: description.trim(),
          content: description.trim(),
          status: "草稿",
          category,
          user_id: USER_ID,
        },
      ]);
      setLoading(false);
      setTitle("");
      setDescription("");
      setCategory("");
      setOpen(false);
      onProjectCreated && onProjectCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-red-500 hover:bg-red-600 text-white">
          新建项目
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>新建项目</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              项目标题
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入项目标题"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              项目描述
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入项目描述"
              className="min-h-[100px]"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              项目分类
            </label>
            <Select value={category} onValueChange={setCategory} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="请选择项目分类" />
              </SelectTrigger>
              <SelectContent>
                {availableTags.filter(tag => tag !== "全部").map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

export default NewProjectDialog; 