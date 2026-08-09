import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Sparkles, AlertCircle, FileImage, CheckCircle, Scan, Layers } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { uploadCover } from '../api/client';
import PillButton from './PillButton';
import { useAuthStore } from '../stores/useAuthStore';
import { useUIStore } from '../stores/useUIStore';

export default function UploadZone({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [genre, setGenre] = useState('Thriller');
  const [bookProjectId, setBookProjectId] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const deductCredit = useAuthStore((state) => state.deductCredit);
  const showToast = useUIStore((state) => state.showToast);

  const mutation = useMutation({
    mutationFn: () => uploadCover(file, bookProjectId || undefined),
    onSuccess: (data) => {
      deductCredit(1);
      showToast('Cover analyzed successfully! Opening diagnostic report...', 'success');
      onUploaded(data.cover_id);
    },
    onError: (err) => {
      showToast(err.message || 'Failed to analyze cover image.', 'error');
    },
  });

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(selectedFile.type)) {
      showToast('Please upload a valid JPEG, PNG, or WebP cover image.', 'error');
      return;
    }
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (file) mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '640px', margin: '0 auto' }}>
      {/* Interactive Drop Zone Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !mutation.isPending && fileInputRef.current?.click()}
        style={{
          position: 'relative',
          padding: '2.5rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: isDragging ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-glass-card)',
          border: `2px dashed ${isDragging ? 'var(--accent-primary)' : previewUrl ? 'var(--accent-success)' : 'var(--border-glass-light)'}`,
          boxShadow: isDragging ? 'var(--glow-primary)' : 'var(--shadow-md)',
          backdropFilter: 'blur(12px)',
          textAlign: 'center',
          cursor: mutation.isPending ? 'wait' : 'pointer',
          transition: 'all var(--transition-normal)',
          overflow: 'hidden',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/jpg, image/webp"
          style={{ display: 'none' }}
          onChange={(e) => handleFileSelect(e.target.files[0])}
        />

        {/* Laser Scan Micro-animation when loading */}
        {mutation.isPending && (
          <motion.div
            initial={{ top: '0%' }}
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, transparent, var(--accent-cyan), var(--accent-primary), transparent)',
              boxShadow: '0 0 15px var(--accent-cyan)',
              zIndex: 10,
            }}
          />
        )}

        {previewUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative', width: '150px', aspectRatio: '2/3', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
              <img src={previewUrl} alt="Cover Artwork Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {mutation.isPending && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(9, 13, 22, 0.6)', backdropFilter: 'blur(2px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                  <Scan size={32} className="animate-spin" style={{ color: 'var(--accent-cyan)' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', marginTop: '0.5rem' }}>Scanning Math...</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-success)', fontSize: '0.9rem', fontWeight: '600' }}>
              <CheckCircle size={18} />
              <span>Ready for Analysis: {file.name}</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Click or drag a new image to replace</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
              }}
            >
              <Upload size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', fontFamily: 'var(--font-family-heading)', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                Drop your Book Cover Artwork here
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Upload high-resolution PNG, JPG, or WebP cover images
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-muted)' }}>
                HD OCR OCR Scanner
              </span>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-muted)' }}>
                WCAG Contrast Check
              </span>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-muted)' }}>
                Genre Benchmarks
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Target Genre & Project ID Options */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.25rem' }}>
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
            Target Genre Benchmark
          </label>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '0.875rem',
            }}
          >
            <option value="Thriller">Thriller & Crime</option>
            <option value="Sci-Fi">Sci-Fi & Fantasy</option>
            <option value="Romance">Romance & Women's Fiction</option>
            <option value="Non-Fiction">Non-Fiction & Self-Help</option>
            <option value="Business">Business & Tech</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
            Project ID (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. prj_8471"
            value={bookProjectId}
            onChange={(e) => setBookProjectId(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '0.875rem',
            }}
          />
        </div>
      </div>

      {/* Submit CTA Button */}
      <div style={{ marginTop: '1.5rem' }}>
        <PillButton
          type="submit"
          variant="neon"
          size="lg"
          icon={Sparkles}
          isLoading={mutation.isPending}
          disabled={!file || mutation.isPending}
          style={{ width: '100%' }}
        >
          {mutation.isPending ? 'Analyzing Title Math & Visual Contrast...' : 'Run Book Cover Diagnostic (-1 Credit)'}
        </PillButton>
      </div>

      {mutation.isError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--accent-danger)', color: 'var(--accent-danger)', fontSize: '0.85rem' }}>
          <AlertCircle size={16} />
          <span>{mutation.error.message}</span>
        </div>
      )}
    </form>
  );
}
