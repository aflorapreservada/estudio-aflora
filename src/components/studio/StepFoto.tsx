import { StorageImage } from '@/components/StorageImage';
import { Upload, X, RefreshCw } from 'lucide-react';
import { useRef, useState } from 'react';

interface StepFotoProps {
  fotoUrl: string | null;
  fotoPath: string | null;
  onUpload: (file: File) => Promise<void>;
  onClear: () => void;
}

export function StepFoto({ fotoUrl, fotoPath, onUpload, onClear }: StepFotoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploadError('');
    setUploading(true);
    try { await onUpload(file); } catch (error) { setUploadError(error instanceof Error ? error.message : 'Erro ao enviar fotografia.'); } finally { setUploading(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="animate-slide-up">
      <div className="mb-6">
        <h3 className="text-xl font-display font-medium text-clay-800">Fotografia original</h3>
        <p className="text-sm text-clay-500 mt-1">
          Envie uma fotografia nítida da biojoia. Esta imagem será a referência visual obrigatória para todas as gerações.
        </p>
      </div>

      {fotoPath || fotoUrl ? (
        <div className="space-y-4">
          <div className="relative inline-block">
            <StorageImage
              bucket="pecas-fotos" path={fotoPath} legacyUrl={fotoUrl}
              alt="Foto original da peça"
              className="max-h-96 rounded-sm border border-clay-200 object-contain"
            />
            <button
              onClick={onClear}
              className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-clay-700 text-sand-50 flex items-center justify-center hover:bg-clay-800 transition-colors"
              title="Remover foto"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => inputRef.current?.click()}
              className="btn-secondary"
              disabled={uploading}
            >
              <RefreshCw className={`w-4 h-4 ${uploading ? 'animate-spin' : ''}`} />
              {uploading ? 'Enviando...' : 'Substituir foto'}
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-sm p-12 text-center transition-all duration-300 ${
            dragging
              ? 'border-clay-500 bg-clay-100/60'
              : 'border-clay-300 bg-white hover:border-clay-400 hover:bg-sand-100/50'
          }`}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-clay-100 mb-4">
            {uploading ? (
              <RefreshCw className="w-6 h-6 text-clay-600 animate-spin" />
            ) : (
              <Upload className="w-6 h-6 text-clay-600" />
            )}
          </div>
          <p className="text-sm text-clay-700 font-medium">
            {uploading ? 'Enviando fotografia...' : 'Clique ou arraste para enviar'}
          </p>
          <p className="text-xs text-clay-400 mt-2">
            JPG, PNG · A fotografia original será armazenada com segurança
          </p>
        </div>
      )}

      {uploadError && <p role="alert" className="text-sm text-red-700">{uploadError}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
