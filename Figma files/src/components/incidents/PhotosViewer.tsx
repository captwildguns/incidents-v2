import React, { useState, useRef, useEffect } from 'react';
import { ForgeCard } from '@tylertech/forge-react';
import { defineCardComponent } from '@tylertech/forge';
defineCardComponent();
import { ForgeButton } from '@tylertech/forge-react';
import { defineButtonComponent } from '@tylertech/forge';
defineButtonComponent();
import { Camera, Upload, X, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import { defineDialogComponent } from '@tylertech/forge';
defineDialogComponent();

interface Photo {
  id: string;
  url: string;
  thumbnail: string;
  uploadedBy: string;
  uploadedAt: string;
  caption: string;
}

interface PhotosViewerProps {
  photos: Photo[];
  incidentId: string;
  driverName: string;
}

export function PhotosViewer({ photos, incidentId, driverName }: PhotosViewerProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = dialogRef.current as any;
    if (!el) return;
    el.open = dialogOpen;
  }, [dialogOpen]);

  useEffect(() => {
    const el = dialogRef.current as any;
    if (!el) return;
    const handler = () => {
      setDialogOpen(false);
      setSelectedPhoto(null);
    };
    el.addEventListener('forge-dialog-close', handler);
    return () => el.removeEventListener('forge-dialog-close', handler);
  }, []);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    toast.success('Upload started', {
      description: `Uploading ${files.length} photo${files.length !== 1 ? 's' : ''}...`,
    });

    // Simulate upload delay
    setTimeout(() => {
      setIsUploading(false);
      toast.success('Upload complete', {
        description: `Successfully uploaded ${files.length} photo${files.length !== 1 ? 's' : ''} to incident ${incidentId}.`,
      });
      
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 2000);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
        <div style={{ padding: 'var(--forge-spacing-medium)' }}>
          <h3 className="forge-typography--heading4" style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-semibold)' }}>
            Driver Submitted Photos
          </h3>
          <p className="forge-typography--body2" style={{ fontSize: 'var(--text-sm)', color: 'var(--forge-theme-text-medium)', margin: 0, fontFamily: 'Roboto, sans-serif' }}>
            {photos.length} photo{photos.length !== 1 ? 's' : ''} submitted by {driverName}
          </p>
          <div style={{ marginTop: 'var(--forge-spacing-small)' }}>
          {/* Photos Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                style={{
                  borderRadius: 'var(--forge-shape-medium)',
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--forge-elevation-1)',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                className="hover:shadow-lg"
                onClick={() => { setSelectedPhoto(photo); setDialogOpen(true); }}
              >
                <div style={{ aspectRatio: '16/9', overflow: 'hidden', position: 'relative' }}>
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {/* Zoom Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(0, 0, 0, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                    }}
                    className="group-hover:opacity-100"
                  >
                    <ZoomIn className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div style={{ padding: 'var(--forge-spacing-small)' }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--forge-font-weight-medium)', marginBottom: '4px', fontFamily: 'Roboto, sans-serif' }}>
                    {photo.caption}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', fontFamily: 'Roboto, sans-serif' }}>
                    Uploaded by {photo.uploadedBy}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', fontFamily: 'Roboto, sans-serif' }}>
                    {photo.uploadedAt}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Upload Section */}
          <div
            style={{
              marginTop: 'var(--forge-spacing-large)',
              padding: 'var(--forge-spacing-large)',
              borderRadius: 'var(--forge-shape-medium)',
              border: '2px dashed var(--border)',
              background: 'var(--muted)',
              textAlign: 'center',
            }}
          >
            <Camera 
              style={{ 
                width: '48px', 
                height: '48px', 
                color: 'var(--muted-foreground)', 
                margin: '0 auto var(--forge-spacing-small)' 
              }} 
            />
            <div
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--muted-foreground)',
                fontFamily: 'Roboto, sans-serif',
                marginBottom: 'var(--forge-spacing-small)',
              }}
            >
              Need to add more photos to this incident?
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
            <ForgeButton
              variant="outlined"
              onClick={handleUploadClick}
              disabled={isUploading}
              style={{
                fontFamily: 'Roboto, sans-serif',
                fontSize: 'var(--text-sm)',
              }}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Upload Photos'}
            </ForgeButton>
          </div>
          </div>
        </div>
      </ForgeCard>

      {/* Photo Lightbox */}
      {/* @ts-ignore */}
      <forge-dialog ref={dialogRef} style={{ '--forge-dialog-width': '56rem' }}>
        <div style={{ padding: 'var(--forge-spacing-medium)' }}>
          <div style={{ marginBottom: 'var(--forge-spacing-small)' }}>
            <h2 className="forge-typography--heading5" style={{ fontFamily: 'Roboto, sans-serif', margin: 0 }}>
              {selectedPhoto?.caption}
            </h2>
            <p className="forge-typography--body2" style={{ fontFamily: 'Roboto, sans-serif', color: 'var(--forge-theme-text-medium)', margin: 0 }}>
              Submitted by {selectedPhoto?.uploadedBy} on {selectedPhoto?.uploadedAt}
            </p>
          </div>
          {selectedPhoto && (
            <div className="relative">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption}
                className="w-full h-auto rounded-lg"
                style={{ maxHeight: '70vh', objectFit: 'contain' }}
              />
            </div>
          )}
        </div>
      {/* @ts-ignore */}
      </forge-dialog>
    </>
  );
}
