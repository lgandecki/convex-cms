interface HalEyeProps {
  isActive: boolean;
  isSpeaking?: boolean; // Pulse more if speaking/playing
  onClick?: () => void;
}

export function HalEye({ isActive: _isActive, isSpeaking, onClick }: HalEyeProps) {
  return (
    <div
      className="relative [@media(max-height:500px)]:w-[clamp(6rem,35vh,12rem)] w-[clamp(10rem,45vmin,20rem)] aspect-square flex items-center justify-center will-change-transform cursor-pointer transition-transform duration-200 hover:scale-105"
      onClick={onClick}
    >
      {/* Outer Rim */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-500 via-gray-900 to-black p-[2%] shadow-2xl">
        <div className="w-full h-full rounded-full bg-black flex items-center justify-center border-4 border-gray-800/50 overflow-hidden relative">
          {/* Inner Lens Glass Reflection - simplified, no blur */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none z-20" />

          {/* The Red Eye - scales proportionally with container */}
          <div
            className={`w-[25%] aspect-square rounded-full bg-hal-red relative z-10 ${isSpeaking ? "animate-pulse-glow" : "hal-glow"}`}
          >
            {/* Core Hotspot - using gradients instead of blur */}
            <div className="absolute inset-0 rounded-full bg-gradient-radial from-yellow-100/80 via-yellow-200/40 to-transparent" />
          </div>

          {/* Outer Glow - using box-shadow instead of blur */}
          <div className="absolute inset-0 rounded-full shadow-[inset_0_0_60px_rgba(255,0,0,0.15)]" />
        </div>
      </div>
    </div>
  );
}
