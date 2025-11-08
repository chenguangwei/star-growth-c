"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface QualityDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (quality: 1 | 2 | 3, reflection?: string, duration?: number) => void;
  taskName: string;
  reflectionPrompts?: string[];
  timeTrackingEnabled?: boolean;
}

export function QualityDialog({
  open,
  onClose,
  onConfirm,
  taskName,
  reflectionPrompts = [],
  timeTrackingEnabled = false,
}: QualityDialogProps) {
  const [quality, setQuality] = useState<1 | 2 | 3 | null>(null);
  const [reflection, setReflection] = useState("");
  const [duration, setDuration] = useState<number | undefined>(undefined);

  const handleConfirm = () => {
    if (quality) {
      onConfirm(quality, reflection || undefined, duration);
      setQuality(null);
      setReflection("");
      setDuration(undefined);
      onClose();
    }
  };

  const handleClose = () => {
    setQuality(null);
    setReflection("");
    setDuration(undefined);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>完成 {taskName}</DialogTitle>
          <DialogDescription>
            请评估这次完成的质量
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 质量评分 */}
          <div>
            <Label>完成质量</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3].map((level) => (
                <button
                  key={level}
                  onClick={() => setQuality(level as 1 | 2 | 3)}
                  className={cn(
                    "flex-1 p-3 rounded-lg border-2 transition-all",
                    quality === level
                      ? "border-primary bg-primary/10"
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {[...Array(level)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "size-5",
                          quality === level ? "fill-primary text-primary" : "text-muted-foreground"
                        )}
                      />
                    ))}
                  </div>
                  <div className="text-sm font-medium">
                    {level === 1 && "一般"}
                    {level === 2 && "良好"}
                    {level === 3 && "优秀"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 时间记录 */}
          {timeTrackingEnabled && (
            <div>
              <Label htmlFor="duration">持续时间（分钟）</Label>
              <input
                id="duration"
                type="number"
                min="1"
                max="120"
                value={duration || ""}
                onChange={(e) =>
                  setDuration(e.target.value ? parseInt(e.target.value) : undefined)
                }
                className="mt-1 w-full px-3 py-2 border rounded-md"
                placeholder="例如：15"
              />
            </div>
          )}

          {/* 反思提示 */}
          {reflectionPrompts.length > 0 && (
            <div>
              <Label htmlFor="reflection">反思记录（可选）</Label>
              <Textarea
                id="reflection"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder={reflectionPrompts[0]}
                className="mt-1"
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={!quality}>
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

