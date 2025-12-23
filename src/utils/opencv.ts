import { ColorMode, GeometricOperation } from '../types';

export const waitForOpenCV = (): Promise<void> => {
  return new Promise((resolve) => {
    if (window.cv && window.cv.Mat) {
      resolve();
    } else {
      const checkInterval = setInterval(() => {
        if (window.cv && window.cv.Mat) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    }
  });
};

export const imageToMat = (canvas: HTMLCanvasElement): any => {
  const cv = window.cv;
  return cv.imread(canvas);
};

export const matToCanvas = (mat: any, canvas: HTMLCanvasElement): void => {
  const cv = window.cv;
  cv.imshow(canvas, mat);
};

export const applyColorTransformation = (
  srcMat: any,
  colorMode: ColorMode,
  options?: { threshold?: number }
): any => {
  const cv = window.cv;
  const dstMat = new cv.Mat();

  switch (colorMode) {
    case 'original':
      srcMat.copyTo(dstMat);
      break;

    case 'grayscale':
      if (srcMat.channels() === 1) {
        srcMat.copyTo(dstMat);
      } else {
        cv.cvtColor(srcMat, dstMat, cv.COLOR_RGBA2GRAY);
      }
      break;

    case 'hsv':
      if (srcMat.channels() === 1) {
        cv.cvtColor(srcMat, dstMat, cv.COLOR_GRAY2RGB);
        cv.cvtColor(dstMat, dstMat, cv.COLOR_RGB2HSV);
      } else {
        cv.cvtColor(srcMat, dstMat, cv.COLOR_RGBA2RGB);
        cv.cvtColor(dstMat, dstMat, cv.COLOR_RGB2HSV);
      }
      break;

    case 'binary':
      let grayMat = new cv.Mat();
      if (srcMat.channels() === 1) {
        srcMat.copyTo(grayMat);
      } else {
        cv.cvtColor(srcMat, grayMat, cv.COLOR_RGBA2GRAY);
      }
      const thresh = options?.threshold ?? 120;
      cv.threshold(grayMat, dstMat, thresh, 255, cv.THRESH_BINARY);
      grayMat.delete();
      break;
  }

  return dstMat;
};

export const applyGeometricTransformation = (
  srcMat: any,
  operation: GeometricOperation
): any => {
  const cv = window.cv;
  const dstMat = new cv.Mat();

  switch (operation) {
    case 'rotate90':
      cv.rotate(srcMat, dstMat, cv.ROTATE_90_CLOCKWISE);
      break;

    case 'rotate180':
      cv.rotate(srcMat, dstMat, cv.ROTATE_180);
      break;

    case 'flipHorizontal':
      cv.flip(srcMat, dstMat, 1);
      break;

    case 'flipVertical':
      cv.flip(srcMat, dstMat, 0);
      break;

    case 'crop':
      const cropSize = Math.min(srcMat.rows, srcMat.cols) * 0.7;
      const startX = Math.floor((srcMat.cols - cropSize) / 2);
      const startY = Math.floor((srcMat.rows - cropSize) / 2);
      const rect = new cv.Rect(startX, startY, cropSize, cropSize);
      srcMat.roi(rect).copyTo(dstMat);
      break;

    case 'resize':
      const size = new cv.Size(300, 300);
      cv.resize(srcMat, dstMat, size, 0, 0, cv.INTER_LINEAR);
      break;
  }

  return dstMat;
};

export const cloneMat = (srcMat: any): any => {
  const dstMat = new cv.Mat();
  srcMat.copyTo(dstMat);
  return dstMat;
};

export const createCanvasFromMat = (mat: any): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = mat.cols;
  canvas.height = mat.rows;
  matToCanvas(mat, canvas);
  return canvas;
};

export const loadImageToCanvas = (
  file: File | string
): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));

    if (typeof file === 'string') {
      img.src = file;
    } else {
      img.src = URL.createObjectURL(file);
    }
  });
};
