"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  FaDownload,
  FaTrashAlt,
  FaExclamationTriangle,
  FaMobileAlt,
  FaDesktop,
  FaChevronLeft,
  FaChevronRight,
  FaVideo,
  FaStop,
  FaCamera,
  FaTimes,
} from "react-icons/fa";
import Head from "next/head";

// --- KONFIGURASI DATA ---
const THEMES = [
  { id: "classic", name: "Polaroid", icon: "📸" },
  { id: "kawaii", name: "Kawaii", icon: "🎀" },
  { id: "film", name: "Film Roll", icon: "🎞️" },
  { id: "neon", name: "Cyberpunk", icon: "🌃" },
  { id: "summer", name: "Summer", icon: "🌴" },
  { id: "wanted", name: "Wanted", icon: "🤠" },
  { id: "vaporwave", name: "Vaporwave", icon: "👾" },
  { id: "romantic", name: "Romantic", icon: "💘" },
  { id: "scrapbook", name: "Scrapbook", icon: "📖" },
  { id: "comic", name: "Comic", icon: "💥" },
];

const FILTERS = [
  { id: "normal", name: "Normal", css: "none", icon: "📷" },
  {
    id: "clear",
    name: "Clear HD",
    css: "contrast(115%) saturate(115%) brightness(105%)",
    icon: "✨",
  },
  {
    id: "beauty",
    name: "Beauty",
    css: "brightness(110%) contrast(105%) saturate(125%) sepia(10%) hue-rotate(-5deg)",
    icon: "💄",
  },
  {
    id: "vibrant",
    name: "Vibrant",
    css: "saturate(160%) contrast(110%) brightness(105%)",
    icon: "🌈",
  },
  {
    id: "cinema",
    name: "Cinematic",
    css: "contrast(120%) saturate(110%) sepia(20%) hue-rotate(-15deg)",
    icon: "🎬",
  },
  { id: "bw", name: "B&W", css: "grayscale(100%) contrast(120%)", icon: "🖤" },
  {
    id: "retro",
    name: "Retro",
    css: "sepia(50%) contrast(120%) saturate(150%) hue-rotate(-10deg)",
    icon: "🎞️",
  },
  {
    id: "cool",
    name: "Cool",
    css: "saturate(150%) hue-rotate(180deg)",
    icon: "🥶",
  },
  {
    id: "winter",
    name: "Winter",
    css: "brightness(110%) contrast(105%) hue-rotate(10deg)",
    icon: "❄️",
  },
];

const TUTORIAL_STEPS = [
  { id: 1, text: "Pilih Filter untuk mempercantik fotomu sebelum mulai! ✨" },
  {
    id: 2,
    text: "Klik tombol Kamera merah untuk mulai 3x sesi foto otomatis! 📸",
  },
  {
    id: 3,
    text: "Keren! Sekarang pilih Tema Frame favoritmu di samping kanan. 🎀",
  },
  { id: 4, text: "Sempurna! Klik Download Strip untuk menyimpan hasilnya. 💾" },
];

export default function Photobooth() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const finalCanvasRef = useRef(null);
  const scrollRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const videoChunksRef = useRef([]);

  const [photos, setPhotos] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [finalPhoto, setFinalPhoto] = useState(null);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [cameraError, setCameraError] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [showTutorial, setShowTutorial] = useState(true);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (error) {
        setCameraError(true);
      }
    };
    startCamera();
    return () =>
      videoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
  }, []);

  const nextStep = () =>
    currentStep < TUTORIAL_STEPS.length && setCurrentStep(currentStep + 1);
  const prevStep = () => currentStep > 1 && setCurrentStep(currentStep - 1);

  useEffect(() => {
    if (photos.length > 0 && photos.length < 3 && currentStep < 2)
      setCurrentStep(2);
    if (photos.length === 3 && !selectedFrame && currentStep < 3)
      setCurrentStep(3);
    if (finalPhoto && currentStep < 4) setCurrentStep(4);
  }, [photos, selectedFrame, finalPhoto]);

  const captureSequence = async () => {
    if (isCapturing || photos.length >= 3 || isRecording) return;
    setIsCapturing(true);
    let newPhotos = [...photos];
    for (let i = photos.length; i < 3; i++) {
      for (let j = 3; j > 0; j--) {
        setCountdown(j);
        await new Promise((res) => setTimeout(res, 1000));
      }
      setCountdown(null);
      document.body.style.backgroundColor = "white";
      setTimeout(() => (document.body.style.backgroundColor = ""), 100);
      newPhotos.push(capturePhoto());
      setPhotos([...newPhotos]);
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return null;
    const ctx = canvas.getContext("2d");
    const aspectRatio = isPortrait ? 9 / 16 : 16 / 9;
    let w = video.videoWidth,
      h = video.videoWidth / aspectRatio;
    if (h > video.videoHeight) {
      h = video.videoHeight;
      w = h * aspectRatio;
    }
    canvas.width = w;
    canvas.height = h;
    ctx.filter = activeFilter.css;
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(
      video,
      (video.videoWidth - w) / 2,
      (video.videoHeight - h) / 2,
      w,
      h,
      0,
      0,
      w,
      h,
    );
    return canvas.toDataURL("image/png", 1.0);
  };

  const generateFinalPhoto = (photoList, themeId) => {
    if (!photoList.length || !themeId) return;
    setSelectedFrame(themeId);
    const canvas = finalCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const imgParts = [];
    let loaded = 0;

    photoList.forEach((src, i) => {
      const img = new window.Image();
      img.src = src;
      img.onload = () => {
        imgParts[i] = img;
        if (++loaded === photoList.length) {
          const iw = imgParts[0].width,
            ih = imgParts[0].height;
          const pad = themeId === "film" ? 80 : 50;
          const gap = 30;
          let top = themeId === "wanted" ? 180 : 50;
          let bottom = 140;

          canvas.width = iw + pad * 2;
          canvas.height = ih * 3 + gap * 2 + top + bottom;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Themes Background
          if (themeId === "classic") {
            ctx.fillStyle = "#ffffff";
          } else if (themeId === "kawaii") {
            ctx.fillStyle = "#ffd1ff";
          } else if (themeId === "film") {
            ctx.fillStyle = "#111111";
          } else if (themeId === "neon") {
            ctx.fillStyle = "#0a0a0a";
          } else {
            ctx.fillStyle = "#f4ead5";
          }

          ctx.fillRect(0, 0, canvas.width, canvas.height);

          imgParts.forEach((img, idx) => {
            const x = pad,
              y = top + idx * (ih + gap);
            ctx.drawImage(img, x, y, iw, ih);
          });

          ctx.fillStyle =
            themeId === "film" || themeId === "neon" ? "white" : "#3e2723";
          ctx.font = "bold 50px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("BIMA'S BOOTH", canvas.width / 2, canvas.height - 70);
          setFinalPhoto(canvas.toDataURL("image/png", 1.0));
        }
      };
    });
  };

  const downloadFinalPhoto = () => {
    const a = document.createElement("a");
    a.href = finalPhoto;
    a.download = "photobooth.png";
    a.click();
  };

  return (
    <div className="bg-[#1e1e1e] min-h-screen font-sans text-gray-200 flex flex-col overflow-x-hidden relative">
      <Head>
        <title>Photo Booth Pro HD</title>
      </Head>

      {/* --- TUTORIAL UI --- */}
      {showTutorial && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-in fade-in zoom-in duration-300">
          <div className="bg-blue-600 border border-blue-400 p-5 rounded-2xl shadow-2xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-white text-blue-600 w-8 h-8 rounded-full flex items-center justify-center font-extrabold shrink-0 shadow-lg">
                {currentStep}
              </div>
              <div className="flex-grow">
                <p className="text-sm font-bold text-white leading-relaxed">
                  {TUTORIAL_STEPS[currentStep - 1].text}
                </p>
              </div>
              <button
                onClick={() => setShowTutorial(false)}
                className="text-white/70 hover:text-white p-1"
              >
                <FaTimes size={14} />
              </button>
            </div>
            <div className="flex justify-between items-center border-t border-white/20 pt-3">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="text-[11px] font-bold text-white disabled:opacity-30 px-2 py-1 transition-all flex items-center gap-1"
              >
                <FaChevronLeft size={10} /> PREV
              </button>
              <div className="flex gap-1.5">
                {TUTORIAL_STEPS.map((s) => (
                  <div
                    key={s.id}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${currentStep === s.id ? "bg-white w-4" : "bg-white/30"}`}
                  />
                ))}
              </div>
              <button
                onClick={nextStep}
                disabled={currentStep === TUTORIAL_STEPS.length}
                className="text-[11px] font-bold text-white disabled:opacity-30 px-2 py-1 transition-all flex items-center gap-1"
              >
                NEXT <FaChevronRight size={10} />
              </button>
            </div>
          </div>
          <div className="w-4 h-4 bg-blue-600 rotate-45 mx-auto -mt-2 border-r border-b border-blue-400"></div>
        </div>
      )}

      {/* --- HEADER --- */}
      <header className="bg-[#2d2d2d] border-b border-[#404040] shadow-sm flex items-center justify-center p-3 relative z-50">
        <div className="absolute left-4 flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
          <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
        </div>
        <h1 className="text-sm font-semibold tracking-wider italic">
          Photobooth v1.2
        </h1>
      </header>

      <main className="flex-grow flex flex-col md:flex-row max-w-[1400px] w-full mx-auto p-4 gap-6 items-center justify-center">
        {/* KAMERA */}
        <div className="flex flex-col items-center justify-center w-full md:w-2/3 max-w-4xl space-y-4">
          <div
            className={`bg-black p-4 rounded-xl shadow-2xl border transition-all duration-500 w-full relative ${currentStep === 2 && showTutorial ? "ring-4 ring-blue-500 border-blue-400" : "border-[#333]"}`}
          >
            <div
              className={`relative bg-[#0a0a0a] rounded-lg overflow-hidden mx-auto ${isPortrait ? "aspect-[9/16] max-w-[360px]" : "aspect-[16/9] w-full"}`}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                style={{ filter: activeFilter.css, transform: "scaleX(-1)" }}
              />
              {countdown && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-40">
                  <span className="text-white text-[12rem] font-bold animate-ping">
                    {countdown}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* FILTER & BUTTON AREA */}
          <div
            className={`w-full bg-[#2d2d2d] p-4 rounded-xl border transition-all duration-500 ${currentStep === 1 && showTutorial ? "ring-4 ring-blue-500 border-blue-400" : "border-[#404040]"}`}
          >
            <div className="w-full flex items-center gap-2 mb-4">
              <button
                onClick={() =>
                  scrollRef.current.scrollBy({ left: -150, behavior: "smooth" })
                }
                className="p-2 text-gray-400 hover:text-white"
              >
                <FaChevronLeft />
              </button>
              <div
                ref={scrollRef}
                className="flex overflow-x-auto gap-3 pb-2 pt-2 snap-x [&::-webkit-scrollbar]:hidden w-full px-2"
              >
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center w-[70px] h-[70px] rounded-lg border-2 transition ${activeFilter.id === f.id ? "border-[#007aff] bg-[#3a3a3a]" : "border-transparent bg-[#1e1e1e]"}`}
                  >
                    <span className="text-2xl">{f.icon}</span>
                    <span className="text-[9px] mt-1 uppercase tracking-tighter">
                      {f.name}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() =>
                  scrollRef.current.scrollBy({ left: 150, behavior: "smooth" })
                }
                className="p-2 text-gray-400 hover:text-white"
              >
                <FaChevronRight />
              </button>
            </div>
            <div className="flex items-center gap-6 justify-center">
              <button
                onClick={() => {
                  setPhotos([]);
                  setFinalPhoto(null);
                  setSelectedFrame(null);
                  setCurrentStep(1);
                }}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-[#444] text-red-400 shadow-lg active:scale-90 transition-transform"
              >
                <FaTrashAlt />
              </button>
              <button
                onClick={captureSequence}
                disabled={isCapturing || photos.length >= 3}
                className={`relative flex items-center justify-center w-20 h-20 bg-[#d93838] hover:bg-[#ff4747] rounded-full border-[6px] border-[#1e1e1e] outline outline-4 shadow-xl active:scale-95 transition-all ${currentStep === 2 && showTutorial ? "outline-blue-500 animate-pulse" : "outline-[#444]"}`}
              >
                <FaCamera className="text-white text-xl" />
              </button>
              <button className="w-12 h-12 flex items-center justify-center rounded-full bg-[#444] border-2 border-transparent">
                <FaVideo />
              </button>
            </div>
          </div>
        </div>

        {/* SIDEBAR PREVIEW - DIPERBAIKI DISINI */}
        <div
          className={`w-full md:w-1/3 max-w-[320px] h-[80vh] bg-[#1a1a1a] border rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-500 ${(currentStep === 3 || currentStep === 4) && showTutorial ? "ring-4 ring-blue-500 border-blue-400" : "border-[#333]"}`}
        >
          <div className="bg-[#2d2d2d] p-3 border-b border-[#333] text-center uppercase tracking-widest text-[10px] text-gray-400 font-bold">
            Live Strip Preview
          </div>

          <div className="flex-grow p-6 overflow-y-auto flex flex-col items-center gap-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')]">
            {photos.length === 0 ? (
              <div className="mt-20 text-gray-600 text-sm italic text-center animate-pulse px-4 font-mono leading-relaxed">
                Ready to take some <br /> shots, Bima? 📷
              </div>
            ) : selectedFrame && finalPhoto ? (
              <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                <Image
                  src={finalPhoto}
                  alt="Result"
                  width={300}
                  height={600}
                  className="w-full h-auto rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/10"
                  unoptimized
                />
              </div>
            ) : (
              /* --- BINGKAI PREVIEW SEBELUM TEMA DIPILIH --- */
              <div className="w-full bg-white p-3 shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex flex-col gap-2 border border-gray-300 animate-in zoom-in-95 duration-500">
                {/* Slot untuk 3 foto */}
                {[0, 1, 2].map((idx) => (
                  <div
                    key={idx}
                    className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden border border-gray-200"
                  >
                    {photos[idx] ? (
                      <Image
                        src={photos[idx]}
                        alt={`Snap ${idx}`}
                        fill
                        className="object-cover animate-in fade-in duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px] font-mono">
                        {isCapturing && photos.length === idx
                          ? "Capturing..."
                          : `Shot ${idx + 1}`}
                      </div>
                    )}
                  </div>
                ))}
                <div className="py-2 text-center">
                  <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                    Photobooth Strip
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* THEME SELECTION */}
          <div
            className={`bg-[#1e1e1e] border-t border-[#333] transition-all duration-500 ${photos.length === 3 ? "h-auto p-4 opacity-100 translate-y-0" : "h-0 p-0 overflow-hidden opacity-0 translate-y-4"}`}
          >
            <p className="text-[10px] text-blue-400 font-bold mb-3 text-center tracking-tighter uppercase">
              ✨ Select a theme to finish ✨
            </p>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => generateFinalPhoto(photos, t.id)}
                  className={`p-2 rounded-lg text-xl border-2 transition-all hover:scale-110 active:scale-95 ${selectedFrame === t.id ? "bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/20" : "bg-[#2d2d2d] border-[#444]"} ${currentStep === 3 && showTutorial && !selectedFrame ? "animate-pulse border-blue-400" : ""}`}
                >
                  {t.icon}
                </button>
              ))}
            </div>
            <button
              onClick={downloadFinalPhoto}
              disabled={!finalPhoto}
              className={`w-full py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl disabled:opacity-20 active:scale-[0.98] transition-all ${currentStep === 4 && showTutorial ? "animate-bounce ring-4 ring-blue-500/50" : ""}`}
            >
              <FaDownload /> Save to Device
            </button>
          </div>
          <canvas ref={finalCanvasRef} className="hidden" />
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}</style>
    </div>
  );
}
