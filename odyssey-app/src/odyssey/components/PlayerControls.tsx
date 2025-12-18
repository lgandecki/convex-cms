import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { cn } from "@/lib/utils";

interface PlayerControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  progress: number;
  duration?: number;
  onSeek?: (progress: number) => void;
  className?: string;
}

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function PlayerControls({
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  progress,
  duration = 0,
  onSeek,
  className,
}: PlayerControlsProps) {
  const currentTime = (progress / 100) * duration;
  const remainingTime = duration - currentTime;
  return (
    <div
      className={cn(
        "flex flex-col [@media(max-height:500px)]:gap-1 gap-3 [@media(min-height:800px)]:gap-6 w-full max-w-md px-4 [@media(min-height:800px)]:px-8",
        className,
      )}
    >
      {/* Progress Bar - Minimalist */}
      <div className="w-full flex items-center gap-2 [@media(min-height:800px)]:gap-3">
        <span className="[@media(max-height:500px)]:text-[8px] text-[10px] [@media(min-height:800px)]:text-xs font-mono text-hal-red/50 min-w-[40px]">
          {formatTime(currentTime)}
        </span>
        <Slider
          value={[progress]}
          max={100}
          className="flex-1"
          onValueChange={(value) => onSeek?.(value[0])}
        />
        <span className="[@media(max-height:500px)]:text-[8px] text-[10px] [@media(min-height:800px)]:text-xs font-mono text-hal-red/50 min-w-[40px] text-right">
          -{formatTime(remainingTime)}
        </span>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center [@media(max-height:500px)]:gap-3 gap-4 [@media(min-height:800px)]:gap-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrev}
          className="text-hal-silver hover:text-hal-red hover:bg-transparent transition-colors transform hover:scale-110"
        >
          <SkipBack className="[@media(max-height:500px)]:w-5 [@media(max-height:500px)]:h-5 w-6 h-6 [@media(min-height:800px)]:w-8 [@media(min-height:800px)]:h-8" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onPlayPause}
          className="[@media(max-height:500px)]:w-10 [@media(max-height:500px)]:h-10 w-12 h-12 [@media(min-height:800px)]:w-16 [@media(min-height:800px)]:h-16 rounded-full border-2 border-hal-silver/20 bg-black/40 hover:bg-hal-red/10 hover:border-hal-red text-hal-silver hover:text-hal-red transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)]"
        >
          {isPlaying ? (
            <Pause className="[@media(max-height:500px)]:w-5 [@media(max-height:500px)]:h-5 w-6 h-6 [@media(min-height:800px)]:w-8 [@media(min-height:800px)]:h-8 fill-current" />
          ) : (
            <Play className="[@media(max-height:500px)]:w-5 [@media(max-height:500px)]:h-5 w-6 h-6 [@media(min-height:800px)]:w-8 [@media(min-height:800px)]:h-8 fill-current pl-0.5 [@media(min-height:800px)]:pl-1" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          className="text-hal-silver hover:text-hal-red hover:bg-transparent transition-colors transform hover:scale-110"
        >
          <SkipForward className="[@media(max-height:500px)]:w-5 [@media(max-height:500px)]:h-5 w-6 h-6 [@media(min-height:800px)]:w-8 [@media(min-height:800px)]:h-8" />
        </Button>
      </div>
    </div>
  );
}
