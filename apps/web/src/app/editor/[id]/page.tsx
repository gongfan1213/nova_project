"use client";

import { Canvas } from "@/components/canvas";

export default function EditorPage({ params }: { params: { id: string } }) {
  return (
    <div className="h-screen w-full">
      <Canvas projectId={params.id} />
    </div>
  );
} 