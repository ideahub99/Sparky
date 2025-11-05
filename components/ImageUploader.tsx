// FIX: Implemented the missing ImageUploader component.
import React, { useState, useRef } from 'react';
import { useTranslation } from '../contexts';
import { Button } from './ui/Elements';
import { UploadIcon, CameraIcon } from './icons';

interface ImageUploaderProps {
  onImageConfirm: (image: Blob) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageConfirm }) => {
  const { t } = useTranslation();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageBlob(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (imageBlob) {
      onImageConfirm(imageBlob);
    }
  };

  const handleReset = () => {
    setImageSrc(null);
    setImageBlob(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };
  
  if (imageSrc) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <img src={imageSrc} alt="Preview" className="max-h-[60vh] max-w-full rounded-2xl object-contain shadow-lg" />
        <div className="mt-8 w-full space-y-3">
          <Button onClick={handleConfirm} className="w-full !py-4">{t('uploader.confirm_button')}</Button>
          <button onClick={handleReset} className="w-full font-semibold py-3 text-accent hover:text-accent/80">{t('uploader.change_button')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">{t('uploader.title')}</h2>
        <p className="text-muted-foreground mb-8 max-w-sm">{t('uploader.subtitle')}</p>
        <div className="w-full space-y-4">
            <Button onClick={() => fileInputRef.current?.click()} className="w-full !py-4 !bg-card !text-foreground border border-border hover:!bg-muted">
                <UploadIcon className="w-5 h-5 me-2" />
                {t('uploader.upload_gallery')}
            </Button>
            <Button onClick={() => cameraInputRef.current?.click()} className="w-full !py-4 !bg-card !text-foreground border border-border hover:!bg-muted">
                 <CameraIcon className="w-5 h-5 me-2" />
                {t('uploader.take_photo')}
            </Button>
        </div>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        <input type="file" accept="image/*" capture="user" ref={cameraInputRef} onChange={handleFileChange} className="hidden" />
    </div>
  );
};
