import { useState, useRef } from 'react';
import { Camera, Upload, Image as ImageIcon } from 'lucide-react';
import Webcam from 'react-webcam';

export default function Home({ onPhotoSelect }) {
  const [showCamera, setShowCamera] = useState(false);
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      onPhotoSelect(imageSrc);
      setShowCamera(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onPhotoSelect(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (showCamera) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col z-50">
        <div className="flex-1 relative">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "environment" }}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="h-32 bg-black flex items-center justify-center gap-8 pb-8">
          <button 
            onClick={() => setShowCamera(false)}
            className="text-white font-semibold px-4 py-2"
          >
            Cancel
          </button>
          <button 
            onClick={capture}
            className="w-16 h-16 rounded-full bg-white border-4 border-gray-300"
          />
          <div className="w-16"></div> {/* Spacer to center the capture button */}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-2">FilmEdit</h1>
        <p className="text-gray-400">35mm Photo Editor</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button
          onClick={() => setShowCamera(true)}
          className="flex items-center justify-center gap-3 w-full bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-xl py-4 px-6 text-lg font-medium"
        >
          <Camera className="w-6 h-6" />
          Take Photo
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-3 w-full bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-xl py-4 px-6 text-lg font-medium"
        >
          <Upload className="w-6 h-6" />
          Upload Photo
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept="image/*" 
          className="hidden" 
        />
      </div>
    </div>
  );
}
