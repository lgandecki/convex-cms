import { useState, useEffect } from "react";
import { HalEye } from "./components/HalEye";
import { HalBadge } from "./components/HalBadge";
import { SpeakerGrille } from "./components/SpeakerGrille";
import { PlayerControls } from "./components/PlayerControls";
import { TrackDisplay } from "./components/TrackDisplay";
import brushedMetal from "./Dark_brushed_metal_texture_62ba33e7.png";

interface Chapter {
  id: number;
  chapter: string;
  title: string;
  subChapters: SubChapter[];
}

interface SubChapter {
  id: number;
  title: string;
  additionalSong?: boolean;
}

const CHAPTERS: Chapter[] = [
  {
    id: 1,
    chapter: "PART I",
    title: "PRIMEVAL NIGHT",
    subChapters: [
      { id: 1, title: "The Road to Extinction" },
      { id: 2, title: "The New Rock", additionalSong: true },
      { id: 3, title: "Academy" },
      { id: 4, title: "The Leopard" },
      { id: 5, title: "Encounter in the Dawn" },
      { id: 6, title: "Ascent of Man" },
    ],
  },
  {
    id: 2,
    chapter: "PART II",
    title: "T.M.A.-1", // Updated punctuation from image
    subChapters: [
      { id: 7, title: "Special Flight" },
      { id: 8, title: "Orbital Rendezvous" },
      { id: 9, title: "Moon Shuttle" },
      { id: 10, title: "Clavius Base" },
      { id: 11, title: "Anomaly" },
      { id: 12, title: "Journey by Earthlight" },
      { id: 13, title: "The Slow Dawn" },
      { id: 14, title: "The Listeners" },
    ],
  },
  {
    id: 3,
    chapter: "PART III",
    title: "BETWEEN PLANETS",
    subChapters: [
      { id: 15, title: "'Discovery'" },
      { id: 16, title: "Hal" },
      { id: 17, title: "Cruise Mode" },
      { id: 18, title: "Through the Asteroids" },
      { id: 19, title: "Transit of Jupiter" },
      { id: 20, title: "The World of the Gods" },
    ],
  },
  {
    id: 4,
    chapter: "PART IV",
    title: "ABYSS",
    subChapters: [
      { id: 21, title: "Birthday Party" },
      { id: 22, title: "Excursion" },
      { id: 23, title: "Diagnosis" },
      { id: 24, title: "Broken Circuit" },
      { id: 25, title: "First Man to Saturn" },
      { id: 26, title: "Dialogue with Hal" },
      { id: 27, title: "Need to Know" },
      { id: 28, title: "In Vacuum" },
      { id: 29, title: "Alone" },
      { id: 30, title: "The Secret" },
    ],
  },
  {
    id: 5,
    chapter: "PART V",
    title: "THE MOONS OF SATURN", // Corrected title per image
    subChapters: [
      { id: 31, title: "Survival" },
      { id: 32, title: "Concerning E.T.s" }, // Added 's'
      { id: 33, title: "Ambassador" },
      { id: 34, title: "The Orbiting Ice" },
      { id: 35, title: "The Eye of Japetus" },
      { id: 36, title: "Big Brother" },
      { id: 37, title: "Experiment" },
      { id: 38, title: "The Sentinel" },
      { id: 39, title: "Into the Eye" },
      { id: 40, title: "Exit" },
    ],
  },
  {
    id: 6,
    chapter: "PART SIX", // Image uses "PART SIX" spelled out, others used Roman numerals.
    title: "THROUGH THE STAR GATE",
    subChapters: [
      { id: 41, title: "Grand Central" },
      { id: 42, title: "The Alien Sky" },
      { id: 43, title: "Inferno" },
      { id: 44, title: "Reception" },
      { id: 45, title: "Recapitulation" },
      { id: 46, title: "Transformation" },
      { id: 47, title: "Star-Child" }, // Added hyphen
    ],
  },
];

// Helper to get all playable tracks (subchapters with IDs)
// When a subchapter has additionalSong: true, it creates two tracks with Roman numeral suffixes
const getAllTracks = () => {
  const tracks: {
    chapterId: number;
    subChapterId: number;
    songIndex: number;
    title: string;
    displayTitle: string;
    chapterTitle: string;
    chapterName: string;
  }[] = [];
  CHAPTERS.forEach((chapter) => {
    chapter.subChapters.forEach((sub) => {
      if (sub.id !== undefined) {
        if (sub.additionalSong) {
          // Create two tracks with Roman numeral suffixes
          tracks.push({
            chapterId: chapter.id,
            subChapterId: sub.id,
            songIndex: 1,
            title: sub.title,
            displayTitle: `${sub.title} (I)`,
            chapterTitle: chapter.title,
            chapterName: chapter.chapter,
          });
          tracks.push({
            chapterId: chapter.id,
            subChapterId: sub.id,
            songIndex: 2,
            title: sub.title,
            displayTitle: `${sub.title} (II)`,
            chapterTitle: chapter.title,
            chapterName: chapter.chapter,
          });
        } else {
          tracks.push({
            chapterId: chapter.id,
            subChapterId: sub.id,
            songIndex: 1,
            title: sub.title,
            displayTitle: sub.title,
            chapterTitle: chapter.title,
            chapterName: chapter.chapter,
          });
        }
      }
    });
  });
  return tracks;
};

const ALL_TRACKS = getAllTracks();

export default function Odyssey() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0); // Index into ALL_TRACKS
  const [progress, setProgress] = useState(0);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);

  const currentTrack = ALL_TRACKS[currentTrackIdx];

  // Mock progress timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.2; // slow progress
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleNext = () => {
    setCurrentTrackIdx((prev) => (prev + 1) % ALL_TRACKS.length);
    setProgress(0);
  };
  const handlePrev = () => {
    setCurrentTrackIdx(
      (prev) => (prev - 1 + ALL_TRACKS.length) % ALL_TRACKS.length,
    );
    setProgress(0);
  };

  return (
    <div
      className="theme-odyssey h-dvh w-full bg-black flex items-center justify-center [@media(max-height:500px)]:p-0 p-2 [@media(min-height:800px)]:p-4 md:p-8 font-mono overflow-hidden"
      style={{
        backgroundImage: `url(${brushedMetal})`,
        backgroundSize: "cover",
      }}
    >
      {/* Full Screen Playlist Modal - Rendered outside main container to avoid stacking context issues */}
      <TrackDisplay
        currentTrack={currentTrack}
        currentTrackIdx={currentTrackIdx}
        chapters={CHAPTERS}
        allTracks={ALL_TRACKS}
        onSelectTrack={(trackIdx) => {
          setCurrentTrackIdx(trackIdx);
          setProgress(0);
        }}
        isOpen={isPlaylistOpen}
        toggleOpen={() => setIsPlaylistOpen(!isPlaylistOpen)}
        renderTrigger={false}
      />

      {/* The Monolith / Interface Container */}
      <div className="relative w-full [@media(max-height:500px)]:max-w-none max-w-2xl bg-black shadow-2xl [@media(max-height:500px)]:rounded-none rounded-sm overflow-hidden [@media(max-height:500px)]:border-0 border-x-4 [@media(min-height:800px)]:border-x-8 border-y-4 [@media(min-height:800px)]:border-y-8 border-[#1a1a1a] flex flex-col h-full max-h-[950px]">
        {/* Top Bezel with Badge */}
        <div className="bg-[#1a1a1a] [@media(max-height:500px)]:p-1 p-3 [@media(min-height:800px)]:p-6 flex justify-center [@media(max-height:500px)]:border-b-2 border-b-4 border-black/50 relative z-30 shrink-0">
          <HalBadge />
        </div>

        {/* Main Display Area (The Eye) */}
        <div className="flex-1 min-h-0 relative flex flex-col bg-[#0a0a0a] overflow-hidden">
          {/* Subtle reflection gradient on the "glass" panel */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none z-10" />

          <div className="relative z-20 flex flex-col items-center justify-between h-full w-full [@media(max-height:500px)]:py-1 py-4 [@media(min-height:800px)]:py-8">
            {/* Eye Section - Push to top/center */}
            <div className="flex-1 min-h-0 flex items-center justify-center">
              <HalEye
                isActive={true}
                isSpeaking={isPlaying}
                onClick={() => setIsPlaylistOpen(!isPlaylistOpen)}
              />
            </div>

            {/* Controls Section - Push to bottom */}
            <div className="w-full flex flex-col items-center [@media(max-height:500px)]:gap-1 gap-3 [@media(min-height:800px)]:gap-6 [@media(max-height:500px)]:pb-1 pb-4 [@media(min-height:800px)]:pb-8 px-4 [@media(min-height:800px)]:px-6 shrink-0">
              <TrackDisplay
                currentTrack={currentTrack}
                currentTrackIdx={currentTrackIdx}
                chapters={CHAPTERS}
                allTracks={ALL_TRACKS}
                onSelectTrack={(trackIdx) => {
                  setCurrentTrackIdx(trackIdx);
                  setProgress(0);
                }}
                isOpen={isPlaylistOpen}
                toggleOpen={() => setIsPlaylistOpen(!isPlaylistOpen)}
                renderTrigger={true}
              />

              <PlayerControls
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                onNext={handleNext}
                onPrev={handlePrev}
                progress={progress}
              />
            </div>
          </div>

          {/* Scanlines Overlay - using CSS gradient instead of image for better performance */}
          <div className="absolute inset-0 pointer-events-none z-40 opacity-[0.03] scanline" />
        </div>

        {/* Bottom Speaker Grille */}
        <div className="relative z-30 shrink-0">
          <SpeakerGrille />
        </div>
      </div>
    </div>
  );
}
