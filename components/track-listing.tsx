"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Youtube } from "lucide-react"

// Define placeholder types
type Track = {
  position: string;
  title: string;
  duration?: string;
  video?: Video; // Assuming a video object might be part of a track
};

type Video = {
  uri: string;
  title: string;
  duration?: number; // Make duration optional or remove if not consistently available
};

interface TrackListingProps {
  tracks: Track[];
  videos: Video[];
}

export function TrackListing({ tracks, videos }: TrackListingProps) {
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null)
  
  // If no tracks or videos, don't render anything
  if ((!tracks || tracks.length === 0) && (!videos || videos.length === 0)) {
    return null
  }
  
  // Transform YouTube URLs to embed URLs
  const getEmbedUrl = (url: string | undefined) => {
    if (!url) return ''; // Handle undefined case
    // Handle youtu.be format
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split('?')[0]
      return `https://www.youtube.com/embed/${videoId}`
    }
    
    // Handle youtube.com format
    if (url.includes('youtube.com/watch')) {
      const videoId = new URL(url).searchParams.get('v')
      return `https://www.youtube.com/embed/${videoId}`
    }
    
    // Return original URL if it doesn't match known formats
    return url
  }
  
  // Associate videos with tracks based on title
  const displayTracks: Track[] = tracks.map(track => {
    // Normalize titles for comparison (optional, but can help)
    const normalizeTitle = (title: string) => title.toLowerCase().trim();
    const trackTitleNormalized = normalizeTitle(track.title);

    const matchedVideo = videos.find(video => 
      normalizeTitle(video.title) === trackTitleNormalized
    );
    
    return {
      ...track,
      video: matchedVideo, // Add the matched video (or undefined if no match)
    };
  });
  
  // Fallback: If no tracks were provided initially, but videos exist, create tracks from videos
  if (tracks.length === 0 && videos.length > 0) {
    displayTracks.push(...videos.map((video, index) => ({
      position: `${index + 1}`,
      title: video.title,
      duration: video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : undefined,
      video: video
    })));
  }
  
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Tracklist</h2>
        <span className="text-xs text-muted-foreground">{displayTracks.length} tracks</span>
      </div>
      
      <Accordion type="single" collapsible className="w-full">
        {displayTracks.map((track, i) => {
          const videoUri = track.video?.uri; // Get video URI for this track
          const isActive = activeVideoUrl === videoUri; // Check if this track's video is active
          
          return (
            <AccordionItem key={`track-${i}`} value={`track-${i}`} className="border-b border-border/50">
              <AccordionTrigger 
                className="hover:no-underline py-2 px-1" 
                onClick={() => {
                  // If this video exists and is already active, hide it.
                  // Otherwise (if video exists), show it.
                  if (videoUri) {
                    setActiveVideoUrl(isActive ? null : videoUri);
                  }
                }}
              >
                <div className="flex flex-row items-center text-left w-full">
                  <span className="text-muted-foreground mr-2 text-sm w-6 text-center">{track.position}</span>
                  <div className="flex-1 truncate">
                    <div className="font-medium text-sm truncate">{track.title}</div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    {track.duration && (
                      <span className="text-xs text-muted-foreground">{track.duration}</span>
                    )}
                    {track.video && (
                      <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full flex items-center">
                        <Youtube className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Preview</span>
                      </span>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="py-2">
                {/* Remove the explicit Play/Hide button */} 
                {/* {track.video ? ( ... ) } */} 
                
                {/* Render iframe directly if this track's video is active */} 
                {isActive && videoUri ? (
                  <div className="aspect-video w-full sm:w-3/4 md:w-1/2">
                    <iframe
                      src={getEmbedUrl(videoUri)} // Use videoUri directly
                      className="w-full h-full rounded-md"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : track.video ? (
                  // If video exists but isn't active (accordion content is open but video not shown)
                  // Optionally show a placeholder or nothing, or rely on the trigger click to show
                  null // Or <p>Click row to play</p>
                ) : (
                  <p className="text-xs text-muted-foreground">No preview available for this track</p>
                )}
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}