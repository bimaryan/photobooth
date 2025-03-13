"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  FaCamera,
  FaBorderAll,
  FaDownload,
  FaTimes,
  FaRegImage,
  FaTint,
  FaAdjust,
  FaEraser,
} from "react-icons/fa";
import { MdBlurOn } from "react-icons/md";
import { SelfieSegmentation } from "@mediapipe/selfie_segmentation";
import Head from "next/head";

export default function Photobooth() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const finalCanvasRef = useRef(null);
  const [photos, setPhotos] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [finalPhoto, setFinalPhoto] = useState(null);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [filter, setFilter] = useState("none");
  const [backgroundBlur, setBackgroundBlur] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (error) {
        console.error("Error accessing webcam:", error);
      }
    };
    startCamera();
  }, []);

  const captureSequence = async () => {
    if (isCapturing || photos.length >= 3) return;

    setIsCapturing(true);
    let newPhotos = [...photos];

    for (let i = photos.length; i < 3; i++) {
      for (let j = 3; j > 0; j--) {
        setCountdown(j);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setCountdown(null);
      const photo = capturePhoto();
      newPhotos.push(photo);
      setPhotos([...newPhotos]);
    }

    setIsCapturing(false);
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return null;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    // Terapkan filter sebelum menggambar gambar
    if (backgroundBlur) {
      ctx.filter = "blur(10px)";
    } else {
      ctx.filter = filter;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/png");
  };

  const generateFinalPhoto = (photoList, frameType = null) => {
    if (!photoList || photoList.length === 0) return;

    setSelectedFrame(frameType);

    if (!frameType) {
      setFinalPhoto(null);
      return;
    }

    const finalCanvas = finalCanvasRef.current;
    if (!finalCanvas) return;

    const ctx = finalCanvas.getContext("2d");
    const imgParts = [];
    let loadedCount = 0;

    photoList.forEach((src, index) => {
      if (!src) return;
      const img = new window.Image();
      img.crossOrigin = "Photobooth";
      img.src = src;

      img.onload = () => {
        imgParts[index] = img;
        loadedCount++;

        if (loadedCount === photoList.length) {
          const width = imgParts[0].width;
          const height = imgParts[0].height;
          const gapSize = 10; // Jarak antar foto
          const framePadding = 20; // Padding untuk bingkai penuh
          const borderRadius = 30; // Radius sudut foto

          finalCanvas.width = width + framePadding * 2;
          finalCanvas.height =
            height * photoList.length +
            gapSize * (photoList.length - 1) +
            framePadding * 2;

          // Background frame
          ctx.fillStyle = frameType === "frame1" ? "blue" : "pink";
          ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

          // Menampilkan foto dengan efek rounded dan gap
          imgParts.forEach((img, i) => {
            const x = framePadding;
            const y = framePadding + i * (height + gapSize);

            // Buat mask rounded
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x + borderRadius, y);
            ctx.arcTo(x + width, y, x + width, y + height, borderRadius);
            ctx.arcTo(x + width, y + height, x, y + height, borderRadius);
            ctx.arcTo(x, y + height, x, y, borderRadius);
            ctx.arcTo(x, y, x + width, y, borderRadius);
            ctx.closePath();
            ctx.clip();

            // Gambar foto di dalam mask
            ctx.drawImage(img, x, y, width, height);

            // Kembalikan ke kondisi awal sebelum loop berikutnya
            ctx.restore();
          });

          setFinalPhoto(finalCanvas.toDataURL("image/png"));
        }
      };
    });
  };

  const downloadFinalPhoto = () => {
    if (!finalPhoto) return;
    const link = document.createElement("a");
    link.href = finalPhoto;
    link.download = "photobooth_with_frame.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetCamera = () => {
    setPhotos([]);
    setFinalPhoto(null);
    setSelectedFrame(null);
    setCountdown(null);
    setIsCapturing(false);
  };

  return (
    <div className="bg-pink-300 min-h-screen">
      <Head>
        <title>Photobooth</title>
        <meta
          name="description"
          content="Abadikan momen spesial dengan photobooth kami! Nikmati pengalaman foto seru dengan berbagai tema, properti unik, dan hasil cetak berkualitas tinggi. Cocok untuk pesta, pernikahan, ulang tahun, dan acara spesial lainnya!"
        />
      </Head>
      <div className="max-w-screen-xl mx-auto p-4 space-y-3">
        <div className="bg-white p-4 shadow-lg rounded-lg text-pink-500">
          <p className="text-4xl text-center font-bold">Photobooth</p>
        </div>
        <div className="flex md:flex-row flex-col  gap-3 item-center">
          <div>
            <div className="bg-white p-4 shadow-lg rounded-lg w-full">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  className="w-full h-auto rounded-md"
                  style={{ filter: backgroundBlur ? "blur(10px)" : filter }}
                />
                <canvas ref={canvasRef} className="hidden" />
                {countdown !== null && (
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-pink-500 text-3xl font-bold">
                    {countdown}
                  </div>
                )}
              </div>
              <div className="flex justify-center gap-2 items-center">
                <div>
                  <button
                    onClick={() => setFilter("none")}
                    className="w-full mt-3 p-2 bg-gray-500 text-white rounded-full text-center"
                  >
                    <FaRegImage />
                  </button>
                </div>
                {/* <div>
                  <button
                    onClick={() => setBackgroundBlur(!backgroundBlur)}
                    className={`w-full mt-3 p-2 rounded-full text-white transition-colors duration-300 ${
                      backgroundBlur ? "bg-green-500" : "bg-gray-600"
                    }`}
                  >
                    <MdBlurOn />
                  </button>
                </div> */}
                <div>
                  <button
                    onClick={() => setFilter("grayscale(100%)")}
                    className="w-full mt-3 p-2 bg-black text-white rounded-full text-center"
                  >
                    <FaAdjust />
                  </button>
                </div>
                <div>
                  <button
                    onClick={() => setFilter("sepia(100%)")}
                    className="w-full mt-3 p-2 bg-yellow-500 text-white rounded-full text-center "
                  >
                    <FaTint />
                  </button>
                </div>
                <div>
                  <button
                    onClick={captureSequence}
                    className="w-full mt-3 p-2 bg-pink-500 text-white rounded-full text-center"
                    disabled={isCapturing || photos.length >= 3}
                  >
                    <FaCamera />
                  </button>
                </div>
                <div>
                  <button
                    onClick={resetCamera}
                    className="w-full mt-3 p-2 bg-red-500 text-white rounded-full text-center"
                  >
                    <FaEraser />
                  </button>
                </div>
                <div>
                  {photos.length === 3 && (
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => generateFinalPhoto(photos, "frame1")}
                        className="w-full mt-3 p-2 bg-blue-500 text-white rounded-full"
                      >
                        <FaBorderAll />
                      </button>
                      <button
                        onClick={() => generateFinalPhoto(photos, "frame2")}
                        className="w-full mt-3 p-2 bg-pink-500 text-white rounded-full"
                      >
                        <FaBorderAll />
                      </button>
                      <button
                        onClick={() => generateFinalPhoto(photos, null)}
                        className="w-full mt-3 p-2 bg-gray-500 text-white rounded-full"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="bg-white p-4 shadow-lg rounded-lg w-full">
              <div className="flex flex-col gap-2 items-center">
                {selectedFrame
                  ? finalPhoto && (
                      <Image
                        src={finalPhoto}
                        alt="Final Photobooth Strip"
                        width={300}
                        height={600}
                        className="rounded-lg w-full"
                      />
                    )
                  : photos.map((photo, index) => (
                      <Image
                        key={index}
                        src={photo}
                        alt={`Captured ${index + 1}`}
                        width={100}
                        height={80}
                        className="rounded-lg w-full"
                      />
                    ))}
                {finalPhoto && selectedFrame && (
                  <button
                    onClick={downloadFinalPhoto}
                    className="w-full mt-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg text-center flex items-center justify-center gap-2"
                  >
                    <FaDownload /> Download
                  </button>
                )}

                <canvas ref={finalCanvasRef} className="hidden" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <br />
      <br />
      <br />
      <footer class="bg-pink-500 fixed bottom-0 left-0 right-0 text-white text-center py-4 mt-14">
        <p>&copy; 2024 Photobooth by @bima_ryan23 😎</p>
      </footer>
    </div>
  );
}
