import { cn } from "@/lib/utils";

export function HalBadge({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden flex items-stretch [@media(max-height:500px)]:h-8 h-[clamp(2.5rem,6vh,4rem)] [@media(max-height:500px)]:w-32 w-[clamp(10rem,40vw,16rem)] shadow-lg", className)}>
       {/* Left side - Blue */}
       <div className="flex-1 flex items-center justify-center bg-[#0055aa] border-r border-black/20">
         <span className="font-display [@media(max-height:500px)]:text-base text-[clamp(1rem,3vw,1.875rem)] text-white tracking-widest drop-shadow-md">HAL</span>
       </div>
       {/* Right side - Black */}
       <div className="flex-1 flex items-center justify-center bg-black">
         <span className="font-display [@media(max-height:500px)]:text-base text-[clamp(1rem,3vw,1.875rem)] text-white tracking-widest drop-shadow-md">9000</span>
       </div>
       
       {/* Bezel border */}
       <div className="absolute inset-0 border-2 border-white/10 pointer-events-none" />
       
       {/* Gloss effect */}
       <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none mix-blend-overlay" />
    </div>
  );
}
