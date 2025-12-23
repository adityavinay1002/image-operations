export type ColorMode = 'original' | 'grayscale' | 'hsv' | 'binary';

export type GeometricOperation =
  | 'rotate90'
  | 'rotate180'
  | 'flipHorizontal'
  | 'flipVertical'
  | 'crop'
  | 'resize';

export type InputSource = 'upload' | 'webcam';

export interface Operation {
  id: string;
  type: 'color' | 'geometric';
  name: string;
  timestamp: number;
  // optional details for replaying or editing operations
  colorMode?: ColorMode;
  geometricOp?: GeometricOperation;
  params?: any;
}

export interface ImageState {
  imageData: ImageData;
  canvas: HTMLCanvasElement;
}

export interface HistoryState {
  imageState: ImageState;
  operations: Operation[];
  colorMode: ColorMode;
}

declare global {
  interface Window {
    cv: any;
  }
}
