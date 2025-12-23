# Image Processing Studio

A complete web-based Image Processing Studio built with OpenCV.js, React, and TypeScript. This application provides a professional interface for real-time image processing with full undo/redo functionality, similar to desktop computer vision applications.

## Features

- **Dual Input Sources**: Upload images or capture from webcam
- **Color Space Transformations**: Original, Grayscale, HSV, Binary
- **Geometric Operations**: Rotate, Flip, Crop, Resize
- **Full Undo/Redo System**: Navigate through operation history
- **Interactive Timeline**: Jump to any previous state
- **Download Processed Images**: Export results with operation names
- **Professional Dark UI**: Modern, responsive design
- **Real-time Processing**: Instant visual feedback

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open browser to `http://localhost:5173`

## Build for Production

```bash
npm run build
```

## Documentation

See [DOCUMENTATION.md](./DOCUMENTATION.md) for complete technical documentation, including:
- Architecture details
- Image processing pipeline explanation
- Color space transformations
- Geometric transformations
- Undo/redo implementation
- Academic applications
- Usage guide

## Technology Stack

- React 18.3.1
- TypeScript 5.5.3
- OpenCV.js 4.8.0
- Vite 5.4.2
- Tailwind CSS 3.4.1
- Lucide React (Icons)

## Project Structure

```
src/
├── App.tsx                    # Main application
├── types.ts                   # TypeScript definitions
├── utils/
│   └── opencv.ts             # OpenCV utilities
└── components/
    ├── ImageUpload.tsx       # File upload
    ├── WebcamCapture.tsx     # Webcam integration
    ├── OperationsPanel.tsx   # Operations controls
    └── HistoryTimeline.tsx   # History & undo/redo
```

## Usage

1. **Load Image**: Upload a file or capture from webcam
2. **Apply Color Mode**: Choose Original, Grayscale, HSV, or Binary
3. **Apply Transformations**: Stack geometric operations
4. **Navigate History**: Use undo/redo or click timeline
5. **Download**: Save your processed image

## Academic Applications

Perfect for:
- Computer Vision courses
- Image Processing labs
- Visual Computing projects
- Portfolio demonstrations
- Research prototypes

## License

MIT
