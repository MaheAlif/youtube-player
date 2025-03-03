// pages/index.js
"use client";
import { useState, useEffect, useRef } from "react";
import Head from "next/head";

export default function Player() {
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const playerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [title, setTitle] = useState("No Track Loaded");
  const rotateKnobRef = useRef(null);

  // keeps it running in background
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log("Service Worker Registered", reg))
        .catch(err => console.log("Service Worker Error", err));
    }
  }, []);

  useEffect(() => {
    // Load YouTube IFrame API
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = initializePlayer;

    return () => {
      window.onYouTubeIframeAPIReady = null;
    };
  }, []);

  useEffect(() => {
    if (videoId && window.YT && window.YT.Player) {
      initializePlayer();
    }
  }, [videoId]);

  const initializePlayer = () => {
    console.log("Initializing player...");
    console.log("Current videoId:", videoId);
    console.log("YT object:", window.YT);

    if (!videoId) return;

    if (playerRef.current) {
      console.log("Player already exists, loading new video...");
      playerRef.current.loadVideoById(videoId);
      console.log("Updated playerRef:", playerRef.current);
      return;
    }

    console.log("Creating new YT Player...");

    playerRef.current = new window.YT.Player("youtube-player", {
      height: "0",
      width: "0",
      videoId: videoId,
      playerVars: {
        playsinline: 1, // Allow inline playback
        controls: 1, // Enable controls for Picture-in-Picture
        autoplay: 1,
        enablejsapi: 1, // Enable JavaScript API control
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: onPlayerError,
      },
    });

    console.log("After creating player:", playerRef.current);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && playerRef.current) {
        playerRef.current.playVideo();
      }
    });
    
  };

  const onPlayerReady = (event) => {
    event.target.setVolume(volume);
    if (isPlaying) {
      event.target.playVideo();
    }
    setIsLoaded(true);

    // Get video title
    if (playerRef.current) {
      const videoData = playerRef.current.getVideoData();
      if (videoData && videoData.title) {
        setTitle(videoData.title);
      }
    }
  };

  const onPlayerStateChange = (event) => {
    if (event.data === 0) {
      // Ended
      playNext();
    }

    // Update play state
    setIsPlaying(event.data === 1);
  };

  const onPlayerError = (event) => {
    console.error("YouTube Player Error:", event);
    setTitle("Error loading track");
  };

  const extractVideoId = (url) => {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    const id = extractVideoId(url);
    if (id) {
      // Add to playlist
      setPlaylist([...playlist, { url, id }]);

      // If this is the first track, set it as current
      if (playlist.length === 0) {
        setVideoId(id);
      }
      setUrl("");
    } else {
      alert("Invalid YouTube URL");
    }
  };

  const togglePlay = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume);
    }

    // Rotate the knob visual
    if (rotateKnobRef.current) {
      const rotation = (newVolume / 100) * 270 - 135;
      rotateKnobRef.current.style.transform = `rotate(${rotation}deg)`;
    }
  };

  const playNext = () => {
    if (playlist.length === 0) return;

    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    setCurrentTrackIndex(nextIndex);
    setVideoId(playlist[nextIndex].id);
  };

  const playPrevious = () => {
    if (playlist.length === 0) return;

    const prevIndex =
      (currentTrackIndex - 1 + playlist.length) % playlist.length;
    setCurrentTrackIndex(prevIndex);
    setVideoId(playlist[prevIndex].id);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <Head>
        <title>Retro Cassette Player</title>
        <meta
          name="description"
          content="A retro cassette player for YouTube videos"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div id="youtube-player"></div>

      <div className="cassette-player bg-gray-800 rounded-lg p-6 w-full max-w-lg shadow-2xl">
        {/* Title & Input */}
        <div className="mb-4">
          <form onSubmit={handleUrlSubmit} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube URL"
                className="flex-1 p-2 rounded border border-gray-600 bg-gray-700 text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Add
              </button>
            </div>
          </form>
        </div>

        {/* Cassette Display */}
        <div className="cassette-display bg-gray-900 rounded-lg p-4 mb-4 relative">
          <div className="cassette-window bg-black rounded flex items-center justify-center h-32 relative overflow-hidden">
            {videoId ? (
              <img
                src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                alt="Video Thumbnail"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-500 text-sm">No Track Loaded</div>
            )}
          </div>

          {/* Tape counter */}
          <div className="tape-counter bg-gray-800 text-green-400 font-mono text-xs p-1 absolute top-2 right-6 border border-gray-700 rounded">
            TRACK {playlist.length > 0 ? currentTrackIndex + 1 : 0}/
            {playlist.length}
          </div>
        </div>

        {/* Song name */}
        <div className="text-xl text-white">{title}</div>

        {/* Controls */}
        <div className="controls flex justify-between items-center">
          <div className="flex gap-3">
            <button
              onClick={playPrevious}
              className="control-btn w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center shadow-inner border border-gray-600 hover:bg-gray-600"
              disabled={playlist.length === 0}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-white"
              >
                <polygon points="19 20 9 12 19 4 19 20"></polygon>
                <line x1="5" y1="19" x2="5" y2="5"></line>
              </svg>
            </button>

            <button
              onClick={togglePlay}
              className="control-btn w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center shadow-inner border border-gray-600 hover:bg-gray-600"
              disabled={playlist.length === 0}
            >
              {isPlaying ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-white"
                >
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-white"
                >
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              )}
            </button>

            <button
              onClick={playNext}
              className="control-btn w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center shadow-inner border border-gray-600 hover:bg-gray-600"
              disabled={playlist.length === 0}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-white"
              >
                <polygon points="5 4 15 12 5 20 5 4"></polygon>
                <line x1="19" y1="5" x2="19" y2="19"></line>
              </svg>
            </button>
          </div>

          {/* Volume Knob */}
          <div className="volume-control relative">
            <div className="volume-knob relative w-24 h-24 bg-gray-700 rounded-full border-4 border-gray-600 flex items-center justify-center shadow-lg">
              <div
                ref={rotateKnobRef}
                className="knob-indicator w-1 h-9 bg-red-500 absolute top-2 left-1/2 transform -translate-x-1/2 origin-bottom"
                style={{
                  transform: `rotate(${(volume / 100) * 270 - 135}deg)`,
                }}
              ></div>
              <div className="knob-center w-4 h-4 rounded-full bg-gray-500"></div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="absolute opacity-0 inset-0 w-full h-full cursor-pointer"
            />
            <div className="text-xs text-gray-400 text-center mt-1">VOLUME</div>
          </div>
        </div>

        {/* Playlist */}
        <div className="playlist mt-6">
          <h3 className="text-sm text-gray-400 mb-2">PLAYLIST</h3>
          <div className="playlist-items bg-gray-900 rounded p-2 max-h-32 overflow-y-auto">
            {playlist.length === 0 ? (
              <div className="text-gray-500 text-xs italic">
                No tracks added
              </div>
            ) : (
              playlist.map((item, index) => (
                <div
                  key={index}
                  className={`playlist-item p-1 text-xs truncate rounded cursor-pointer hover:bg-gray-800 ${
                    index === currentTrackIndex
                      ? "bg-gray-700 text-white"
                      : "text-gray-400"
                  }`}
                  onClick={() => {
                    setCurrentTrackIndex(index);
                    setVideoId(item.id);
                  }}
                >
                  {index + 1}. {item.url.substring(0, 50)}...
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
      `}</style>
    </div>
  );
}
