import { useState } from 'react';

import {
  Palette,
  RotateCw,
  FlipHorizontal2,
  FlipVertical2,
  Crop,
  Maximize2,
} from 'lucide-react';
import { ColorMode, GeometricOperation } from '../types';

interface OperationsPanelProps {
  colorMode: ColorMode;
  // extended callbacks: options for binary threshold and resize dims
  onColorModeChange: (mode: ColorMode, options?: any) => void;
  onGeometricOperation: (operation: GeometricOperation, params?: any) => void;
  hasImage: boolean;
}

export const OperationsPanel: React.FC<OperationsPanelProps> = ({
  colorMode,
  onColorModeChange,
  onGeometricOperation,
  hasImage,
}) => {
  const [showResize, setShowResize] = useState(false);
  const [resizeWidth, setResizeWidth] = useState(300);
  const [resizeHeight, setResizeHeight] = useState(300);
  const [showBinary, setShowBinary] = useState(false);
  const [threshold, setThreshold] = useState(120);
  const colorModes: { value: ColorMode; label: string }[] = [
    { value: 'original', label: 'Original' },
    { value: 'grayscale', label: 'Grayscale' },
    { value: 'hsv', label: 'HSV' },
    { value: 'binary', label: 'Binary' },
  ];

  const geometricOps: {
    value: GeometricOperation;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: 'rotate90',
      label: 'Rotate 90°',
      icon: <RotateCw className="w-4 h-4" />,
    },
    {
      value: 'rotate180',
      label: 'Rotate 180°',
      icon: <RotateCw className="w-4 h-4" />,
    },
    {
      value: 'flipHorizontal',
      label: 'Flip Horizontal',
      icon: <FlipHorizontal2 className="w-4 h-4" />,
    },
    {
      value: 'flipVertical',
      label: 'Flip Vertical',
      icon: <FlipVertical2 className="w-4 h-4" />,
    },
    {
      value: 'crop',
      label: 'Crop Center',
      icon: <Crop className="w-4 h-4" />,
    },
    {
      value: 'resize',
      label: 'Resize',
      icon: <Maximize2 className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-slate-200">
            Color Transformations
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {colorModes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => {
                if (mode.value === 'binary') {
                  setShowBinary(true);
                  return;
                }
                onColorModeChange(mode.value);
              }}
              disabled={!hasImage}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                colorMode === mode.value
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              } ${!hasImage ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {mode.label}
            </button>
          ))}

          {showBinary && (
            <div className="col-span-2 mt-3 p-3 bg-slate-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm">Binary Threshold: {threshold}</div>
                <div>
                  <button
                    className="px-2 py-1 bg-red-600 rounded text-white mr-2"
                    onClick={() => setShowBinary(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-2 py-1 bg-green-600 rounded text-white"
                    onClick={() => {
                      onColorModeChange('binary', { threshold });
                      setShowBinary(false);
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={255}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <RotateCw className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-slate-200">
            Geometric Transformations
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {geometricOps.map((op) => (
            <button
              key={op.value}
              onClick={() => {
                if (op.value === 'resize') {
                  setShowResize(true);
                  return;
                }
                onGeometricOperation(op.value);
              }}
              disabled={!hasImage}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-slate-700 text-slate-300 hover:bg-slate-600 ${
                !hasImage ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {op.icon}
              {op.label}
            </button>
          ))}

          {showResize && (
            <div className="col-span-2 mt-3 p-3 bg-slate-800 rounded-lg">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm">Resize: {resizeWidth}px × {resizeHeight}px</div>
                <div>
                  <button
                    className="px-2 py-1 bg-red-600 rounded text-white mr-2"
                    onClick={() => setShowResize(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-2 py-1 bg-green-600 rounded text-white"
                    onClick={() => {
                      onGeometricOperation('resize', { width: resizeWidth, height: resizeHeight });
                      setShowResize(false);
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Width</div>
                  <input
                    type="range"
                    min={50}
                    max={2000}
                    value={resizeWidth}
                    onChange={(e) => setResizeWidth(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Height</div>
                  <input
                    type="range"
                    min={50}
                    max={2000}
                    value={resizeHeight}
                    onChange={(e) => setResizeHeight(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
