"use client";
import { useState, useEffect, useRef } from "react";
import YouTube from "react-youtube";
import Head from "next/head";

export default function YoutubePlayer() {
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [title, setTitle] = useState("No Track Loaded");
  const rotateKnobRef = useRef(null);
  const playerRef = useRef(null);

  // Extracts video ID from a YouTube URL
  const extractVideoId = (url) => {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Handles adding a video to the playlist
  const handleUrlSubmit = (e) => {
    e.preventDefault();
    const id = extractVideoId(url);
    if (id) {
      setPlaylist([...playlist, { url, id }]);

      // If it's the first video, set it as current
      if (playlist.length === 0) {
        setVideoId(id);
      }
      setUrl("");
    } else {
      alert("Invalid YouTube URL");
    }
  };

  // Toggles play/pause
  const togglePlay = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
    setIsPlaying(!isPlaying);
  };

  // Handles volume change
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

  // Plays next track
  const playNext = () => {
    if (playlist.length === 0) return;

    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    setCurrentTrackIndex(nextIndex);
    setVideoId(playlist[nextIndex].id);
  };

  // Plays previous track
  const playPrevious = () => {
    if (playlist.length === 0) return;

    const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    setCurrentTrackIndex(prevIndex);
    setVideoId(playlist[prevIndex].id);
  };

  // YouTube player event handlers
  const onPlayerReady = (event) => {
    playerRef.current = event.target;
    playerRef.current.setVolume(volume);
    setIsPlaying(true);
    playerRef.current.playVideo();
  };

  const onPlayerStateChange = (event) => {
    if (event.data === 0) playNext(); // When a video ends, play next

    setIsPlaying(event.data === 1);
  };

  const opts = {
    height: "0",
    width: "0",
    playerVars: {
      autoplay: 1,
      controls: 0,
    },
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <Head>
        <title>Retro Cassette Player</title>
        <meta name="description" content="A retro cassette player for YouTube videos" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* YouTube Player */}
      <YouTube videoId={videoId} opts={opts} onReady={onPlayerReady} onStateChange={onPlayerStateChange} />

      <div className="cassette-player bg-gray-800 rounded-lg p-6 w-full max-w-lg shadow-2xl">
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
              <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                Add
              </button>
            </div>
          </form>
        </div>

        <div className="controls flex justify-between items-center">
          <button onClick={playPrevious} className="w-12 h-12 bg-gray-700 rounded-full">⏮️</button>
          <button onClick={togglePlay} className="w-12 h-12 bg-gray-700 rounded-full">
            {isPlaying ? "⏸️" : "▶️"}
          </button>
          <button onClick={playNext} className="w-12 h-12 bg-gray-700 rounded-full">⏭️</button>
        </div>

        {/* Volume Knob */}
        <div className="relative mt-4">
          <div className="relative w-16 h-16 bg-gray-700 rounded-full border-4 border-gray-600">
            <div ref={rotateKnobRef} className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-red-500"></div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            className="absolute opacity-0 inset-0 w-full h-full cursor-pointer"
          />
        </div>

        {/* Playlist */}
        <div className="mt-6">
          <h3 className="text-sm text-gray-400 mb-2">PLAYLIST</h3>
          <div className="bg-gray-900 rounded p-2 max-h-32 overflow-y-auto">
            {playlist.length === 0 ? (
              <div className="text-gray-500 text-xs italic">No tracks added</div>
            ) : (
              playlist.map((item, index) => (
                <div key={index} className={`p-1 text-xs cursor-pointer ${index === currentTrackIndex ? "text-white" : "text-gray-400"}`}
                  onClick={() => {
                    setCurrentTrackIndex(index);
                    setVideoId(item.id);
                  }}
                >
                  {index + 1}. {item.url}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
