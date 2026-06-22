import { useState, useRef, useEffect } from 'react';
import { X, Download, SlidersHorizontal, Image as ImageIcon, Sparkles, Crop } from 'lucide-react';
import CropTool from './CropTool';
import { FILM_FILTERS, applyFilterToContext } from '../utils/filters';
import { Layers } from 'lucide-react';
import { loadModels, applyFaceSmoothing } from '../utils/faceSmoothing';

export default function Editor({ photoUrl, onClose }) {
  const [activeTab, setActiveTab] = useState('adjust'); // adjust, filters, overlay, face
  const [currentPhoto, setCurrentPhoto] = useState(photoUrl);
  const [showCrop, setShowCrop] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const overlaysRefs = useRef({
    grain: null,
    dust: null,
    leak: null
  });

  // Settings state
  const [adjustments, setAdjustments] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    rotation: 0
  });
  const [activeFilter, setActiveFilter] = useState('normal');
  const [activeOverlays, setActiveOverlays] = useState({
    grain: false,
    dust: false,
    leak: false
  });
  const [smoothingIntensity, setSmoothingIntensity] = useState(0);

  // Load AI models
  useEffect(() => {
    loadModels().then(() => setModelsLoaded(true));
  }, []);

  // Load image initially and pre-load overlays
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      renderCanvas();
    };
    img.src = currentPhoto;

    // Load overlays
    ['grain', 'dust', 'leak'].forEach(type => {
      const overlayImg = new Image();
      overlayImg.src = `/overlays/${type}.png`;
      overlayImg.onload = () => {
        overlaysRefs.current[type] = overlayImg;
      };
    });
  }, [currentPhoto]);

  // Render canvas whenever adjustments change
  useEffect(() => {
    if (imageRef.current) {
      renderCanvas();
    }
  }, [adjustments, activeFilter, activeOverlays, smoothingIntensity]);

  const renderCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;
    
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    // Set canvas dimensions based on rotation
    const isRotated = adjustments.rotation % 180 !== 0;
    canvas.width = isRotated ? img.height : img.width;
    canvas.height = isRotated ? img.width : img.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply basic CSS filters
    applyFilterToContext(ctx, adjustments, activeFilter);

    // Handle rotation
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((adjustments.rotation * Math.PI) / 180);
    
    // Draw image centered
    ctx.drawImage(
      img, 
      -img.width / 2, 
      -img.height / 2, 
      img.width, 
      img.height
    );

    // Reset transformations and filters
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = 'none';

    // Draw Overlays
    ctx.globalCompositeOperation = 'screen';
    
    if (activeOverlays.grain && overlaysRefs.current.grain) {
      ctx.globalAlpha = 0.5;
      ctx.drawImage(overlaysRefs.current.grain, 0, 0, canvas.width, canvas.height);
    }
    if (activeOverlays.dust && overlaysRefs.current.dust) {
       ctx.globalAlpha = 0.3;
       ctx.drawImage(overlaysRefs.current.dust, 0, 0, canvas.width, canvas.height);
    }
    
    // Light leaks typically use screen or overlay
    ctx.globalCompositeOperation = 'screen';
    if (activeOverlays.leak && overlaysRefs.current.leak) {
       ctx.globalAlpha = 0.6;
       ctx.drawImage(overlaysRefs.current.leak, 0, 0, canvas.width, canvas.height);
    }

    // Reset global settings
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';

    // Apply AI Skin Smoothing
    if (smoothingIntensity > 0 && modelsLoaded) {
       await applyFaceSmoothing(canvas, img, smoothingIntensity);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `filmedit-${Date.now()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.click();
  };

  if (showCrop) {
    return (
      <CropTool 
        imageSrc={currentPhoto}
        onCrop={(croppedDataUrl) => {
          setCurrentPhoto(croppedDataUrl);
          setShowCrop(false);
        }}
        onCancel={() => setShowCrop(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-black text-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 bg-zinc-900">
        <button onClick={onClose} className="p-2">
          <X className="w-6 h-6" />
        </button>
        <span className="font-semibold">Edit</span>
        <button onClick={handleDownload} className="p-2 text-blue-500 font-medium">
          Save
        </button>
      </div>

      {/* Main Image Area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-zinc-950 p-4">
        <canvas 
          ref={canvasRef} 
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Editor Controls */}
      <div className="h-64 bg-zinc-900 flex flex-col rounded-t-2xl">
        {/* Tool options based on active tab */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'adjust' && (
            <div className="space-y-6">
              <div>
                <label className="flex justify-between text-sm mb-2 text-gray-300">
                  <span>Brightness</span>
                  <span>{adjustments.brightness}%</span>
                </label>
                <input 
                  type="range" min="0" max="200" 
                  value={adjustments.brightness}
                  onChange={(e) => setAdjustments({...adjustments, brightness: e.target.value})}
                  className="w-full accent-blue-500"
                />
              </div>
              <div>
                <label className="flex justify-between text-sm mb-2 text-gray-300">
                  <span>Contrast</span>
                  <span>{adjustments.contrast}%</span>
                </label>
                <input 
                  type="range" min="0" max="200" 
                  value={adjustments.contrast}
                  onChange={(e) => setAdjustments({...adjustments, contrast: e.target.value})}
                  className="w-full accent-blue-500"
                />
              </div>
               <div>
                <label className="flex justify-between text-sm mb-2 text-gray-300">
                  <span>Rotation</span>
                  <span>{adjustments.rotation}°</span>
                </label>
                <input 
                  type="range" min="0" max="360" step="90"
                  value={adjustments.rotation}
                  onChange={(e) => setAdjustments({...adjustments, rotation: e.target.value})}
                  className="w-full accent-blue-500"
                />
              </div>
              <button
                onClick={() => setShowCrop(true)}
                className="flex items-center justify-center gap-2 w-full py-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors mt-4"
              >
                <Crop className="w-5 h-5" />
                <span>Crop Image</span>
              </button>
            </div>
          )}

          {activeTab === 'filters' && (
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
              {FILM_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex-shrink-0 snap-center flex flex-col items-center gap-2 ${activeFilter === filter.id ? 'text-blue-500' : 'text-gray-400'}`}
                >
                  <div className={`w-20 h-24 rounded-lg bg-zinc-800 border-2 overflow-hidden flex items-center justify-center ${activeFilter === filter.id ? 'border-blue-500' : 'border-transparent'}`}>
                     {/* Preview thumb could go here, for now just text */}
                     <span className="text-xs text-center px-1">{filter.name}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'overlay' && (
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
              {[
                { id: 'grain', name: 'Film Grain' },
                { id: 'dust', name: 'Dust & Scratches' },
                { id: 'leak', name: 'Light Leak' }
              ].map((overlay) => (
                <button
                  key={overlay.id}
                  onClick={() => setActiveOverlays(prev => ({...prev, [overlay.id]: !prev[overlay.id]}))}
                  className={`flex-shrink-0 snap-center flex flex-col items-center gap-2 ${activeOverlays[overlay.id] ? 'text-blue-500' : 'text-gray-400'}`}
                >
                  <div className={`w-20 h-24 rounded-lg bg-zinc-800 border-2 overflow-hidden flex items-center justify-center ${activeOverlays[overlay.id] ? 'border-blue-500' : 'border-transparent'}`}>
                     <span className="text-xs text-center px-1">{overlay.name}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'face' && (
             <div className="space-y-6">
              {!modelsLoaded ? (
                <div className="text-gray-400 text-center mt-4">Loading AI models...</div>
              ) : (
                <div>
                  <label className="flex justify-between text-sm mb-2 text-gray-300">
                    <span>Skin Smoothing</span>
                    <span>{smoothingIntensity}%</span>
                  </label>
                  <input 
                    type="range" min="0" max="100" 
                    value={smoothingIntensity}
                    onChange={(e) => setSmoothingIntensity(e.target.value)}
                    className="w-full accent-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">Uses AI to detect faces and apply smoothing specifically to skin regions.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Tab Bar */}
        <div className="flex justify-around items-center h-16 border-t border-zinc-800 pb-safe">
          <button 
            onClick={() => setActiveTab('adjust')}
            className={`flex flex-col items-center p-2 ${activeTab === 'adjust' ? 'text-blue-500' : 'text-gray-400'}`}
          >
            <SlidersHorizontal className="w-5 h-5 mb-1" />
            <span className="text-[10px]">Adjust</span>
          </button>
          <button 
            onClick={() => setActiveTab('filters')}
            className={`flex flex-col items-center p-2 ${activeTab === 'filters' ? 'text-blue-500' : 'text-gray-400'}`}
          >
            <ImageIcon className="w-5 h-5 mb-1" />
            <span className="text-[10px]">Filters</span>
          </button>
          <button 
            onClick={() => setActiveTab('overlay')}
            className={`flex flex-col items-center p-2 ${activeTab === 'overlay' ? 'text-blue-500' : 'text-gray-400'}`}
          >
            <Layers className="w-5 h-5 mb-1" />
            <span className="text-[10px]">Effects</span>
          </button>
          <button 
            onClick={() => setActiveTab('face')}
            className={`flex flex-col items-center p-2 ${activeTab === 'face' ? 'text-blue-500' : 'text-gray-400'}`}
          >
            <Sparkles className="w-5 h-5 mb-1" />
            <span className="text-[10px]">Face</span>
          </button>
        </div>
      </div>
    </div>
  );
}
