'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { RiUpload2Line, RiFileLine, RiCloseLine } from 'react-icons/ri';

const ACCEPTED_EXTENSIONS = {
  'text/plain': ['.js', '.ts', '.py', '.java', '.cpp', '.cc', '.go', '.rs'],
  'application/octet-stream': ['.cpp', '.cc'],
};

interface FileUploadProps {
  onFile: (file: File) => void;
  uploadedFile: File | null;
  onClear: () => void;
  disabled?: boolean;
}

export default function FileUpload({ onFile, uploadedFile, onClear, disabled }: FileUploadProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFile(accepted[0]);
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED_EXTENSIONS,
    maxFiles: 1,
    maxSize: 500 * 1024,
    disabled,
    multiple: false,
  });

  if (uploadedFile) {
    return (
      <div className="flex items-center justify-between bg-surface-700 border border-sky-500/25 rounded-lg px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/15 flex items-center justify-center">
            <RiFileLine size={16} className="text-sky-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">{uploadedFile.name}</p>
            <p className="text-xs text-slate-500">
              {(uploadedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
        <button
          onClick={onClear}
          disabled={disabled}
          className="p-1.5 rounded-lg hover:bg-surface-600 text-slate-500 hover:text-red-400 transition-colors"
        >
          <RiCloseLine size={16} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-sky-400 bg-sky-500/10'
            : 'border-[rgba(56,189,248,0.2)] hover:border-[rgba(56,189,248,0.4)] hover:bg-surface-700/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <RiUpload2Line
          size={28}
          className={`mx-auto mb-3 ${isDragActive ? 'text-sky-400' : 'text-slate-500'}`}
        />
        <p className="text-sm font-medium text-slate-300 mb-1">
          {isDragActive ? 'Drop your file here' : 'Drag & drop a code file'}
        </p>
        <p className="text-xs text-slate-500 mb-3">or click to browse</p>
        <p className="text-xs text-slate-600">
          .js · .ts · .py · .java · .cpp · .go · .rs — max 500KB
        </p>
      </div>

      {fileRejections.length > 0 && (
        <p className="mt-2 text-xs text-red-400">
          {fileRejections[0]?.errors[0]?.message ?? 'File not accepted'}
        </p>
      )}
    </div>
  );
}
