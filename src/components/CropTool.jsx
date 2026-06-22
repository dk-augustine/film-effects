import React, { useState, useRef } from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { Check, X } from 'lucide-react';

export default function CropTool({ imageSrc, onCrop, onCancel }) {
  const cropperRef = useRef(null);

  const handleCrop = () => {
    const imageElement = cropperRef?.current;
    const cropper = imageElement?.cropper;
    if (cropper) {
      onCrop(cropper.getCroppedCanvas().toDataURL());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 bg-zinc-900 text-white">
        <button onClick={onCancel} className="p-2">
          <X className="w-6 h-6" />
        </button>
        <span className="font-semibold">Crop</span>
        <button onClick={handleCrop} className="p-2 text-blue-500 font-medium">
          <Check className="w-6 h-6" />
        </button>
      </div>
      
      <div className="flex-1 bg-zinc-950 flex items-center justify-center p-4">
        <Cropper
          src={imageSrc}
          style={{ height: '100%', width: '100%' }}
          initialAspectRatio={1}
          guides={true}
          ref={cropperRef}
          viewMode={1}
          background={false}
          autoCropArea={1}
        />
      </div>
    </div>
  );
}
