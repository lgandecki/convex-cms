import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

interface SubChapter {
  id?: number;
  title: string;
  additionalSong?: boolean;
}

interface Chapter {
  id: number;
  chapter: string;
  title: string;
  subChapters: SubChapter[];
}

interface Track {
  chapterId: number;
  subChapterId: number;
  songIndex: number;
  title: string;
  displayTitle: string;
  chapterTitle: string;
  chapterName: string;
}

interface TrackDisplayProps {
  currentTrack: Track;
  currentTrackIdx: number;
  chapters: Chapter[];
  allTracks: Track[];
  onSelectTrack: (trackIdx: number) => void;
  isOpen: boolean;
  toggleOpen: () => void;
  renderTrigger?: boolean;
}

export function TrackDisplay({ currentTrack, currentTrackIdx, chapters, allTracks, onSelectTrack, isOpen, toggleOpen, renderTrigger = true }: TrackDisplayProps) {
  // Track which chapter is expanded - default to the one containing the current track
  const [expandedChapterId, setExpandedChapterId] = useState<number | null>(currentTrack.chapterId);

  // Update expanded chapter when current track changes
  useEffect(() => {
    setExpandedChapterId(currentTrack.chapterId);
  }, [currentTrack.chapterId]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleChapterClick = (chapterId: number) => {
    // Accordion behavior: close if already open, otherwise open this one
    setExpandedChapterId(prev => prev === chapterId ? null : chapterId);
  };

  // Render only the trigger
  if (renderTrigger) {
    return (
      <div
        onClick={toggleOpen}
        className="cursor-pointer group text-center [@media(max-height:500px)]:mb-0 mb-2 [@media(min-height:800px)]:mb-4 [@media(max-height:500px)]:space-y-0 space-y-1 [@media(min-height:800px)]:space-y-2 hover:opacity-80 transition-opacity relative z-10"
      >
        <h2 className="font-display [@media(max-height:500px)]:text-sm text-lg [@media(min-height:800px)]:text-2xl text-hal-silver tracking-[0.15em] [@media(min-height:800px)]:tracking-[0.2em] uppercase group-hover:text-white transition-colors drop-shadow-md">
          {currentTrack.chapterName}
        </h2>
        <p className="font-mono [@media(max-height:500px)]:text-[10px] text-xs [@media(min-height:800px)]:text-sm text-hal-red tracking-wider uppercase">
          {currentTrack.displayTitle}
        </p>
        <div className="[@media(max-height:500px)]:hidden w-12 [@media(min-height:800px)]:w-16 h-0.5 bg-hal-red/40 mx-auto mt-2 [@media(min-height:800px)]:mt-4 group-hover:w-20 [@media(min-height:800px)]:group-hover:w-24 group-hover:bg-hal-red transition-all duration-500" />
      </div>
    );
  }

  // Render only the modal (when renderTrigger is false)
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleOpen}
            className="absolute inset-0 bg-black/90"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-[#0a0a0a] border border-hal-red/20 shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-sm overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#111]">
              <h3 className="font-display text-xl text-white tracking-widest">SELECT MODULE</h3>
              <button
                onClick={toggleOpen}
                className="text-hal-silver hover:text-hal-red transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Accordion List */}
            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-hal-red/30 scrollbar-track-[#0a0a0a]">
              {chapters.map((chapter) => {
                const isExpanded = expandedChapterId === chapter.id;
                const hasCurrentTrack = currentTrack.chapterId === chapter.id;

                return (
                  <div key={chapter.id} className="border-b border-white/5">
                    {/* Chapter Header (Accordion Toggle) */}
                    <button
                      onClick={() => handleChapterClick(chapter.id)}
                      className={cn(
                        "w-full text-left px-6 py-5 flex items-center justify-between transition-all",
                        hasCurrentTrack
                          ? "bg-white/5 text-hal-red"
                          : "text-gray-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-display text-lg tracking-wider">{chapter.chapter}</span>
                        <span className="text-xs uppercase tracking-wide opacity-60">{chapter.title}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        {hasCurrentTrack && (
                          <div className="w-2 h-2 rounded-full bg-hal-red shadow-[0_0_10px_#ff0000]" />
                        )}
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-5 h-5 opacity-50" />
                        </motion.div>
                      </div>
                    </button>

                    {/* SubChapters (Collapsible Content) */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden bg-black/40"
                        >
                          {chapter.subChapters.map((sub, idx) => {
                            // Check if it's a marker (no id)
                            if (sub.id === undefined) {
                              return (
                                <div
                                  key={`marker-${idx}`}
                                  className="px-8 py-3 text-xs text-hal-red/60 tracking-[0.3em] uppercase font-display border-y border-hal-red/10"
                                >
                                  {sub.title}
                                </div>
                              );
                            }

                            // Get all tracks for this subchapter
                            const tracksForSubChapter = allTracks
                              .map((track, trackIdx) => ({ ...track, trackIdx }))
                              .filter(track => track.subChapterId === sub.id);

                            return tracksForSubChapter.map((track) => {
                              const isCurrentTrack = currentTrackIdx === track.trackIdx;

                              return (
                                <button
                                  key={`${sub.id}-${track.songIndex}`}
                                  onClick={() => {
                                    onSelectTrack(track.trackIdx);
                                    toggleOpen();
                                  }}
                                  className={cn(
                                    "w-full text-left pl-10 pr-6 py-3 text-sm transition-all flex items-center justify-between group",
                                    isCurrentTrack
                                      ? "bg-hal-red/10 text-hal-red"
                                      : "text-gray-500 hover:bg-white/5 hover:text-white"
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs opacity-40 w-6">{sub.id}.</span>
                                    <span>{track.displayTitle}</span>
                                  </div>

                                  {isCurrentTrack && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-hal-red shadow-[0_0_8px_#ff0000]" />
                                  )}
                                </button>
                              );
                            });
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Scanline overlay for modal */}
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')] bg-repeat" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
