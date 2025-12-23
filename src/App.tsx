import { useEffect, useState, useRef } from 'react';
import { Upload as UploadIcon, Camera, Undo2, Redo2, Download } from 'lucide-react';
import { ImageUpload } from './components/ImageUpload';
import { WebcamCapture } from './components/WebcamCapture';
import { OperationsPanel } from './components/OperationsPanel';
import { HistoryTimeline } from './components/HistoryTimeline';
import {
  waitForOpenCV,
  imageToMat,
  matToCanvas,
  applyColorTransformation,
  applyGeometricTransformation,
  cloneMat,
} from './utils/opencv';
import { ColorMode, GeometricOperation, Operation, InputSource } from './types';

interface HistoryState {
  mat: any;
  operations: Operation[];
  colorMode: ColorMode;
}

function App() {
  const [isOpenCVReady, setIsOpenCVReady] = useState(false);
  const [inputSource, setInputSource] = useState<InputSource>('upload');
  const [isWebcamActive, setIsWebcamActive] = useState(false);

  const [originalMat, setOriginalMat] = useState<any>(null);
  const [colorMode, setColorMode] = useState<ColorMode>('original');
  const [operations, setOperations] = useState<Operation[]>([]);

  const [historyStack, setHistoryStack] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    waitForOpenCV().then(() => {
      setIsOpenCVReady(true);
    });
  }, []);

  // Ensure canvases are painted after the canvas elements mount.
  useEffect(() => {
    if (!originalMat) return;

    // Draw the original image when the original canvas is available
    if (originalCanvasRef.current) {
      matToCanvas(originalMat, originalCanvasRef.current);
    }

    // Draw the processed image depending on history index or color mode
    if (processedCanvasRef.current) {
      if (historyIndex >= 0 && historyStack[historyIndex]?.mat) {
        matToCanvas(historyStack[historyIndex].mat, processedCanvasRef.current);
      } else {
        const transformed = applyColorTransformation(originalMat, colorMode);
        matToCanvas(transformed, processedCanvasRef.current);
        transformed.delete();
      }
    }
  }, [originalMat, historyIndex, colorMode, historyStack]);

  const pushToHistory = (mat: any, newOperations: Operation[], mode: ColorMode) => {
    // Clone the incoming mat and append to a trimmed history (drop redo entries)
    const clonedMat = cloneMat(mat);
    const newState: HistoryState = {
      mat: clonedMat,
      operations: [...newOperations],
      colorMode: mode,
    };

    const trimmedHistory = historyStack.slice(0, historyIndex + 1);

    // Delete redo entries (those after current index) to free memory
    const redoEntries = historyStack.slice(historyIndex + 1);
    redoEntries.forEach((s) => {
      if (s.mat) s.mat.delete();
    });

    trimmedHistory.push(newState);
    setHistoryStack(trimmedHistory);
    setHistoryIndex(trimmedHistory.length - 1);
  };

  const handleImageLoad = (canvas: HTMLCanvasElement) => {
    if (!isOpenCVReady) return;
    // Clear previous original mat
    if (originalMat) {
      originalMat.delete();
    }

    // Delete any previous history mats and reset history
    historyStack.forEach((state) => {
      if (state.mat) state.mat.delete();
    });

    const mat = imageToMat(canvas);
    setOriginalMat(mat);
    setColorMode('original');
    setOperations([]);
    setHistoryStack([]);
    setHistoryIndex(-1);

    if (originalCanvasRef.current) {
      matToCanvas(mat, originalCanvasRef.current);
    }
    if (processedCanvasRef.current) {
      matToCanvas(mat, processedCanvasRef.current);
    }

    // Push the original mat into history (pushToHistory clones internally)
    pushToHistory(mat, [], 'original');
  };

  const applyOperationToMat = (srcMat: any, op: Operation): any => {
    const cv = window.cv;
    if (!op) return cloneMat(srcMat);

    if (op.type === 'color') {
      // Color operations should always be applied on the original image,
      // not cumulatively on previous color transforms.
      const mode = op.colorMode || 'original';
      const base = originalMat || srcMat;
      const transformed = applyColorTransformation(base, mode, op.params);
      return transformed;
    }

    if (op.type === 'geometric') {
      const geom = op.geometricOp as GeometricOperation;
      const params = op.params;
      if (geom === 'resize' && params) {
        // create a resized mat using cv.resize with provided size
        const dst = new cv.Mat();
        const size = new cv.Size(params.width, params.height);
        cv.resize(srcMat, dst, size, 0, 0, cv.INTER_LINEAR);
        return dst;
      }

      // for other geometric ops, use existing helper
      return applyGeometricTransformation(srcMat, geom);
    }

    return cloneMat(srcMat);
  };

  const rebuildHistory = (ops: Operation[]) => {
    // delete existing mats
    historyStack.forEach((s) => { if (s.mat) s.mat.delete(); });

    if (!originalMat) {
      setHistoryStack([]);
      setHistoryIndex(-1);
      return;
    }

    const newHistory: HistoryState[] = [];
    // push original
    const origClone = cloneMat(originalMat);
    newHistory.push({ mat: origClone, operations: [], colorMode: 'original' });

    // sequentially apply operations
    let lastMat = origClone;
    ops.forEach((op, i) => {
      const transformed = applyOperationToMat(lastMat, op);
      const cloned = cloneMat(transformed);
      transformed.delete();
      newHistory.push({ mat: cloned, operations: ops.slice(0, i + 1), colorMode: op.colorMode ?? 'original' });
      // free previous lastMat (we keep clones in history)
      if (lastMat && lastMat !== origClone) lastMat.delete();
      lastMat = cloned;
    });

    setHistoryStack(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setOperations(ops);
  };

  const handleColorModeChange = (mode: ColorMode, options?: any) => {
    if (!originalMat) return;

    // Color operations must always be applied to the original image (independent)
    const transformedMat = applyColorTransformation(originalMat, mode, options);

    if (processedCanvasRef.current) {
      matToCanvas(transformedMat, processedCanvasRef.current);
    }

    const operation: Operation = {
      id: Date.now().toString(),
      type: 'color',
      name: mode.charAt(0).toUpperCase() + mode.slice(1),
      timestamp: Date.now(),
      colorMode: mode,
      params: options,
    };

    const newOperations = [...operations, operation];
    setOperations(newOperations);
    setColorMode(mode);

    pushToHistory(transformedMat, newOperations, mode);
    transformedMat.delete();
  };

  const handleGeometricOperation = (operation: GeometricOperation, params?: any) => {
    if (historyIndex < 0 || !historyStack[historyIndex]) return;

    const currentState = historyStack[historyIndex];
    const currentMat = currentState.mat;

    let transformedMat: any;
    if (operation === 'resize' && params) {
      const cv = window.cv;
      const dst = new cv.Mat();
      const size = new cv.Size(params.width, params.height);
      cv.resize(currentMat, dst, size, 0, 0, cv.INTER_LINEAR);
      transformedMat = dst;
    } else {
      transformedMat = applyGeometricTransformation(currentMat, operation);
    }

    if (processedCanvasRef.current) {
      matToCanvas(transformedMat, processedCanvasRef.current);
    }

    const operationNames: Record<GeometricOperation, string> = {
      rotate90: 'Rotate 90°',
      rotate180: 'Rotate 180°',
      flipHorizontal: 'Flip H',
      flipVertical: 'Flip V',
      crop: 'Crop Center',
      resize: `Resize ${params?.width || 300}×${params?.height || 300}`,
    };

    const newOperation: Operation = {
      id: Date.now().toString(),
      type: 'geometric',
      name: operationNames[operation],
      timestamp: Date.now(),
      geometricOp: operation,
      params,
    };

    const newOperations = [...operations, newOperation];
    setOperations(newOperations);

    pushToHistory(transformedMat, newOperations, colorMode);
    transformedMat.delete();
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);

      const state = historyStack[newIndex];
      // Do not modify the operations array on undo; keep full operation history
      setColorMode(state.colorMode);

      if (processedCanvasRef.current) {
        matToCanvas(state.mat, processedCanvasRef.current);
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);

      const state = historyStack[newIndex];
      // Do not modify the operations array on redo; keep full operation history
      setColorMode(state.colorMode);

      if (processedCanvasRef.current) {
        matToCanvas(state.mat, processedCanvasRef.current);
      }
    }
  };

  const handleJumpToState = (index: number) => {
    if (index >= 0 && index < historyStack.length) {
      setHistoryIndex(index);

      const state = historyStack[index];
      // Keep operations list unchanged when jumping — jump only affects view
      setColorMode(state.colorMode);

      if (processedCanvasRef.current) {
        matToCanvas(state.mat, processedCanvasRef.current);
      }
    }
  };

  const handleDeleteOperation = (opIndex: number) => {
    // opIndex refers to operations array index. Remove it and rebuild history.
    const newOps = operations.filter((_, i) => i !== opIndex);
    rebuildHistory(newOps);
  };

  const handleDownload = () => {
    if (!processedCanvasRef.current) return;

    const canvas = processedCanvasRef.current;
    const link = document.createElement('a');
    const filename = operations.length > 0
      ? `processed_${operations.map((op) => op.name).join('_')}.png`
      : 'processed_image.png';

    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleReset = () => {
    if (originalMat) {
      originalMat.delete();
      setOriginalMat(null);
    }

    historyStack.forEach((state) => {
      if (state.mat) state.mat.delete();
    });

    setHistoryStack([]);
    setHistoryIndex(-1);
    setOperations([]);
    setColorMode('original');
    setIsWebcamActive(false);

    if (originalCanvasRef.current) {
      const ctx = originalCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(
          0,
          0,
          originalCanvasRef.current.width,
          originalCanvasRef.current.height
        );
      }
    }

    if (processedCanvasRef.current) {
      const ctx = processedCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(
          0,
          0,
          processedCanvasRef.current.width,
          processedCanvasRef.current.height
        );
      }
    }
  };

  const handleInputSourceChange = (source: InputSource) => {
    if (source === 'webcam') {
      setIsWebcamActive(true);
    } else {
      setIsWebcamActive(false);
    }
    setInputSource(source);
  };

  if (!isOpenCVReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading OpenCV.js...</p>
        </div>
      </div>
    );
  }

  const hasImage = originalMat !== null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="bg-slate-900/50 border-b border-slate-800 px-6 py-4">
        <h1 className="text-2xl font-bold text-blue-400">
          Image Processing Studio
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          OpenCV Vision Lab - Real-time Image Processing Pipeline
        </p>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-200">
                  Input Source
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleInputSourceChange('upload')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      inputSource === 'upload' && !isWebcamActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <UploadIcon className="w-4 h-4" />
                    Upload
                  </button>
                  <button
                    onClick={() => handleInputSourceChange('webcam')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isWebcamActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    Webcam
                  </button>
                </div>
              </div>

              {!hasImage && !isWebcamActive && (
                <ImageUpload onImageLoad={handleImageLoad} />
              )}

              {isWebcamActive && (
                <WebcamCapture
                  onCapture={handleImageLoad}
                  isActive={isWebcamActive}
                  onStop={() => setIsWebcamActive(false)}
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/30 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-slate-200 mb-4">
                  Original Image
                </h2>
                <div className="bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center min-h-[300px]">
                  {hasImage ? (
                    <canvas ref={originalCanvasRef} className="max-w-full h-auto" />
                  ) : (
                    <p className="text-slate-500">No image loaded</p>
                  )}
                </div>
              </div>

             

                <div className="bg-slate-900/30 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-slate-200 mb-4">
                    Processed Image
                  </h2>
                  <div className="bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center min-h-[300px]">
                    {hasImage ? (
                      <canvas
                        ref={processedCanvasRef}
                        className="max-w-full h-auto"
                      />
                    ) : (
                      <p className="text-slate-500">No operations applied</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 mt-4 flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Undo"
                  >
                    <Undo2 className="w-4 h-4" />
                    Undo
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= historyStack.length - 1}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Redo"
                  >
                    <Redo2 className="w-4 h-4" />
                    Redo
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownload}
                    disabled={!hasImage}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
          </div>

          <div className="bg-slate-900/30 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-200 mb-6">
              Operations
            </h2>
            <OperationsPanel
              colorMode={colorMode}
              onColorModeChange={handleColorModeChange}
              onGeometricOperation={handleGeometricOperation}
              hasImage={hasImage}
            />
          </div>
        </div>

        <div className="mt-6">
          <HistoryTimeline
            operations={operations}
            currentIndex={historyIndex}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onJumpToState={handleJumpToState}
            onDownload={handleDownload}
            onReset={handleReset}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < historyStack.length - 1}
            hasImage={hasImage}
            onDeleteOperation={handleDeleteOperation}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
