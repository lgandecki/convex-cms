export function SpeakerGrille() {
  return (
    <div className="w-full [@media(max-height:500px)]:h-6 h-[clamp(3rem,12vh,8rem)] relative overflow-hidden bg-[#080808] [@media(max-height:500px)]:border-t-2 border-t-4 border-gray-800 contain-paint">
      {/* Simple dot pattern using a tiny SVG for better performance */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='8' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23333'/%3E%3Ccircle cx='6' cy='6' r='1' fill='%23333'/%3E%3C/svg%3E")`,
          backgroundSize: '8px 8px',
        }}
      />

      {/* Shadow depth at top/bottom */}
      <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black to-transparent" />
    </div>
  );
}
