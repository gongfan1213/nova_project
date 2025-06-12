import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase/client";

const USER_ID = "f53ad801-aeef-4d39-9dbc-4042717ee508";

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  lastModified: string;
}

interface ProjectManageDialogProps {
  projects: Project[];
  onProjectsChanged?: () => void;
}

const ProjectManageDialog = ({ projects, onProjectsChanged }: ProjectManageDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createSupabaseClient();

  const handleSelectAll = () => {
    if (selectedProjects.length === projects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(projects.map(p => p.id));
    }
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleDelete = async () => {
    if (selectedProjects.length > 0) {
      setLoading(true);
      await supabase.from("projects").delete().in("id", selectedProjects);
      setLoading(false);
      setSelectedProjects([]);
      setOpen(false);
      onProjectsChanged && onProjectsChanged();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-gray-300 text-gray-700">
          管理项目
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>项目管理</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedProjects.length === projects.length && projects.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm">全选</span>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              disabled={selectedProjects.length === 0 || loading}
              onClick={handleDelete}
            >
              <Trash2 size={14} className="mr-1" />
              删除选中 ({selectedProjects.length})
            </Button>
          </div>
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {projects.map((project) => (
              <div key={project.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  checked={selectedProjects.includes(project.id)}
                  onCheckedChange={() => handleSelectProject(project.id)}
                />
                <div className="flex-1">
                  <h3 className="font-medium text-lg">{project.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-1">{project.description}</p>
                </div>
                <span className="text-xs text-gray-400">{project.lastModified}</span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectManageDialog;