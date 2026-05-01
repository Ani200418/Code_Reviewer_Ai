'use client';

import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { RiSparklingLine, RiUpload2Line, RiEdit2Line, RiShareLine, RiInformationLine } from 'react-icons/ri';
import { reviewService, ReviewResult } from '@/lib/services';
import { LANGUAGE_OPTIONS, LanguageValue, extractErrorMessage } from '@/lib/utils';
import { useProtectedRoute } from '@/lib/hooks/useAuth';
import CodeEditor from '@/components/CodeEditor';
import ReviewCard from '@/components/ReviewCard';
import FileUpload from '@/components/FileUpload';
import ShareModal from '@/components/ShareModal';
import Loader from '@/components/Loader';

type Tab = 'editor' | 'upload';

const SAMPLE: Record<string, string> = {
  javascript: `function findDuplicate(nums) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < nums.length; j++) {
      if (nums[i] === nums[j] && i !== j) return nums[i];
    }
  }
  return -1;
}
console.log(findDuplicate([1, 3, 4, 2, 2]));`,
  python: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr
print(bubble_sort([64, 34, 25, 12, 22, 11, 90]))`,
  java: `public class BinarySearch {
    public static int search(int[] arr, int target) {
        int left = 0, right = arr.length;
        while (left < right) {
            int mid = (left + right) / 2;
            if (arr[mid] == target) return mid;
            else if (arr[mid] < target) left = mid + 1;
            else right = mid;
        }
        return -1;
    }
}`,
  cpp: `#include <iostream>
using namespace std;
int factorial(int n) {
    if (n == 0) return 1;
    return n * factorial(n - 1);
}
int main() {
    cout << factorial(10) << endl;
    return 0;
}`,
  typescript: `interface User {
  id: number;
  name: string;
}
function getUser(id: number): User {
  return { id, name: 'Aniket' };
}
console.log(getUser(1));`,
  go: `package main
import "fmt"
func main() {
    fmt.Println("Hello, World!")
}`,
  rust: `fn main() {
    println!("Hello, World!");
}`,
};


export default function ReviewPage() {
  // ✅ Add auth protection
  const { isLoading: authLoading } = useProtectedRoute();
  
  const [tab, setTab] = useState<Tab>('editor');
  const [language, setLanguage] = useState<LanguageValue>('javascript');
  const [targetLanguage, setTargetLanguage] = useState<LanguageValue | ''>('');
  const [code, setCode] = useState(SAMPLE.javascript);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [showShare, setShowShare] = useState(false);

  // ✅ Add keyboard shortcut handler (Cmd+Enter / Ctrl+Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isAnalyzing) {
        e.preventDefault();
        // Call analyze via button click
        const analyzeBtn = document.querySelector('[data-analyze-btn]') as HTMLButtonElement;
        if (analyzeBtn) analyzeBtn.click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnalyzing]);

  const handleLangChange = (lang: LanguageValue) => {
    setLanguage(lang);
    // Only set sample code if the editor is empty or currently contains another sample code
    if (tab === 'editor' && SAMPLE[lang]) {
      const isCurrentCodeSample = Object.values(SAMPLE).some(sample => sample.trim() === code.trim());
      if (!code.trim() || isCurrentCodeSample) {
        setCode(SAMPLE[lang]);
      }
    }
  };

  const handleAnalyze = useCallback(async () => {
    if (tab === 'editor' && !code.trim()) { toast.error('Please enter some code'); return; }
    if (tab === 'upload' && !uploadedFile) { toast.error('Please upload a file'); return; }

    setIsAnalyzing(true);
    setResult(null);
    try {
      const res = tab === 'upload' && uploadedFile
        ? await reviewService.uploadCodeFile(uploadedFile, targetLanguage || undefined)
        : await reviewService.reviewCode(code, language, targetLanguage || undefined);
      setResult(res);
      toast.success('Analysis complete!');
      setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    } catch (err: any) {
      // Check if it's a compilation error response
      if (err.response?.status === 400 && err.response?.data?.data?.compilationError) {
        // Show compilation error in UI
        setResult(err.response.data.data as any);
      } else {
        toast.error(extractErrorMessage(err));
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [tab, code, language, uploadedFile, targetLanguage]);

  const handleConvert = useCallback(async () => {
    if (!targetLanguage) { 
      toast.error('Please select a target language'); 
      return; 
    }
    if (tab === 'editor' && !code.trim()) { 
      toast.error('Please enter some code'); 
      return; 
    }
    if (tab === 'upload' && !uploadedFile) { 
      toast.error('Please upload a file'); 
      return; 
    }

    setIsConverting(true);
    setResult(null);
    try {
      const res = tab === 'upload' && uploadedFile
        ? await reviewService.uploadCodeFile(uploadedFile, targetLanguage)
        : await reviewService.reviewCode(code, language, targetLanguage);
      setResult(res);
      toast.success('Code conversion complete!');
      setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.data?.compilationError) {
        setResult(err.response.data.data as any);
      } else {
        toast.error(extractErrorMessage(err));
      }
    } finally {
      setIsConverting(false);
    }
  }, [tab, code, language, uploadedFile, targetLanguage]);

  // ✅ Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-2 border-sky-500/20 border-t-sky-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">New Code Review</h1>
          <p className="text-slate-500 text-sm mt-1">Paste code or upload a file · <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)' }}>⌘+Enter</kbd> to analyze</p>
        </div>
        {result && (
          <button onClick={() => setShowShare(true)} className="btn-secondary text-sm">
            <RiShareLine size={15} /> Share
          </button>
        )}
      </div>

      {/* Input card */}
      <div className="card-glow p-1">
        <div className="p-5 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2">
            {([['editor','editor','Code Editor'], ['upload','upload','Upload File']] as const).map(([val, , label]) => (
              <button key={val} onClick={() => setTab(val as Tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === val ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'}`}
                style={tab === val ? { background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)' } : { border: '1px solid transparent' }}>
                {val === 'editor' ? <RiEdit2Line size={14} /> : <RiUpload2Line size={14} />}
                {label}
              </button>
            ))}
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(96, 165, 250, 0.05)', border: '1px solid rgba(96, 165, 250, 0.1)' }}>
            <RiInformationLine size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-300">
              This platform analyzes your code with AI. Results may take a few seconds depending on code complexity. We validate syntax first, then provide detailed analysis and suggestions.
            </p>
          </div>

          {/* Editor or Upload */}
          {tab === 'editor' ? (
            <CodeEditor
              code={code}
              language={language}
              onChange={setCode}
              onLanguageChange={handleLangChange}
              onSubmit={handleAnalyze}
              disabled={isAnalyzing}
              height="380px"
            />
          ) : (
            <FileUpload
              onFile={(f) => {
                setUploadedFile(f);
                const reader = new FileReader();
                reader.onload = (e) => {
                  setCode(e.target?.result as string || '');
                  // Detect language from file extension
                  const ext = f.name.split('.').pop()?.toLowerCase();
                  const langMap: Record<string, LanguageValue> = {
                    'js': 'javascript', 'jsx': 'javascript',
                    'ts': 'typescript', 'tsx': 'typescript',
                    'py': 'python', 'java': 'java',
                    'cpp': 'cpp', 'cc': 'cpp', 'c': 'cpp',
                    'go': 'go', 'rs': 'rust'
                  };
                  if (ext && langMap[ext]) {
                    setLanguage(langMap[ext]);
                  }
                  setTab('editor');
                };
                reader.readAsText(f);
              }}
              uploadedFile={uploadedFile}
              onClear={() => setUploadedFile(null)}
              disabled={isAnalyzing}
            />
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-between pt-1 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-400">Convert to:</span>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value as LanguageValue | '')}
                disabled={isAnalyzing || isConverting}
                className="text-sm rounded-xl px-3 py-2 outline-none cursor-pointer transition-all"
                style={{ background: 'rgba(17,13,30,0.95)', color: targetLanguage ? '#38bdf8' : 'var(--text-muted)', border: '1px solid rgba(192,132,252,0.14)' }}
              >
                <option value="">(None)</option>
                {LANGUAGE_OPTIONS.filter((l) => l.value !== 'other').map((lang) => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Convert Button */}
              <button 
                onClick={handleConvert}
                disabled={isAnalyzing || isConverting || !targetLanguage}
                className="btn-secondary px-6 py-3 text-sm"
                title="Convert code to selected language">
                {isConverting
                  ? <><div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" /> Converting…</>
                  : <>🔄 Convert</>
                }
              </button>

              {/* Analyze Button */}
              <button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing || isConverting} 
                data-analyze-btn
                className="btn-gradient px-8 py-3">
                {isAnalyzing
                  ? <><div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" /> Analyzing…</>
                  : <><RiSparklingLine size={16} /> Analyze with AI</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analyzing/Converting */}
      {(isAnalyzing || isConverting) && <Loader variant="analyzing" />}

      {/* Results or Error State */}
      {result && !isAnalyzing && !isConverting && (
        <div id="results">
          {/* Check if this is an error response */}
          {(result as any)?.compilationStatus === 'Error' || (result as any)?.compilationError ? (
            <>
              {/* Error status bar */}
              <div className="flex items-center gap-3 mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-sm font-medium text-red-300">Analysis Error</span>
                <span className="badge-sky text-xs capitalize">{(result as any)?.language || 'unknown'}</span>
              </div>
              {/* Render error display */}
              <ReviewCard 
                result={result as any}
                processingTime={result.processingTime}
                compilationStatus={(result as any).compilationStatus}
                currentOutput={(result as any).currentOutput}
              />
            </>
          ) : (
            <>
              {/* Success status bar */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-sm font-medium text-slate-300">Analysis Complete</span>
                  <span className="badge-sky text-xs capitalize">{result.language}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowShare(true)} className="btn-secondary text-xs py-1.5 px-3">
                    <RiShareLine size={13} /> Share
                  </button>
                </div>
              </div>
              {/* Render results */}
              <ReviewCard 
                result={result.aiResponse} 
                processingTime={result.processingTime}
                compilationStatus={(result as any).compilationStatus}
                currentOutput={(result as any).currentOutput}
              />
            </>
          )}
        </div>
      )}

      {/* No results yet - Show placeholder */}
      {!result && !isAnalyzing && (
        <div className="mt-12 text-center">
          <div className="text-slate-400 text-sm">
            <p>👆 Submit code above to get started</p>
            <p className="text-xs mt-1">Paste code or upload a file to analyze</p>
          </div>
        </div>
      )}

      {/* Share modal */}
      {showShare && result && (
        <ShareModal
          reviewId={result.reviewId}
          language={result.language}
          score={result.score}
          aiResponse={result.aiResponse}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
