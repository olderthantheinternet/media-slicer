# Media Slicer 🎬

A browser-based application for slicing audio and video files into segments using FFmpeg.wasm. No server required - everything runs in your browser!

## Features

- ✅ **100% Browser-Based**: No server backend needed
- ✅ **Multiple Formats**: Supports MP4, MP3, MOV, WAV, and any format supported by FFmpeg
- ✅ **Custom Segment Length**: Choose how long each segment should be (in seconds)
- ✅ **Automatic Numbering**: Segments are automatically numbered
- ✅ **ZIP Download**: All segments are compressed into a single ZIP file
- ✅ **Filename Sanitization**: Automatically removes bad characters and replaces spaces with underscores
- ✅ **Security**: File type validation and size limits
- ✅ **Modern UI**: Beautiful, responsive interface

## How It Works

1. Select a media file (audio or video)
2. Choose the segment length in seconds
3. Click "Slice & Download"
4. Wait for processing (happens entirely in your browser)
5. Download the ZIP file containing all segments

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Usage

1. Open the application in your browser
2. Wait for FFmpeg to load (first time may take a moment)
3. Select your media file
4. Set the desired segment length
5. Click "Slice & Download"
6. The segments will be automatically downloaded as a ZIP file

## Technical Details

- **Framework**: React with Vite
- **FFmpeg**: @ffmpeg/ffmpeg (WebAssembly version)
- **ZIP Creation**: JSZip
- **Processing**: Uses FFmpeg's segment muxer with `-c copy` for fast processing without re-encoding

## Limitations

- File size limit: 500MB (browser memory constraints)
- Processing time depends on file size and browser performance
- First load requires downloading FFmpeg.wasm (~30MB)

## Browser Compatibility

Works in modern browsers that support:
- WebAssembly
- File API
- Blob API

Tested on Chrome, Firefox, Safari, and Edge.

## Deployment to GitHub Pages

This app can be easily deployed to GitHub Pages for free hosting!

### Automatic Deployment (Recommended)

1. **Push your code to GitHub** (if you haven't already)
2. **Enable GitHub Pages**:
   - Go to your repository Settings → Pages
   - Under "Source", select "GitHub Actions"
3. **Update the base path** (if needed):
   - If your repository is named `media-slicer`, the default config will work
   - If your repository has a different name, update `vite.config.js`:
     ```js
     base: process.env.NODE_ENV === 'production' ? '/your-repo-name/' : '/'
     ```
   - Or set it via environment variable: `VITE_BASE_PATH=/your-repo-name/`
4. **Push to main/master branch** - The GitHub Action will automatically build and deploy!

### Manual Deployment

```bash
# Build the project
npm run build

# The dist/ folder contains the static files
# You can deploy this folder to any static hosting service
```

### Custom Domain

If you're using a custom domain or `username.github.io` repository:
- Set `base: '/'` in `vite.config.js` for production
- Or set environment variable: `VITE_BASE_PATH=/`

### Live Demo

Once deployed, your app will be available at:
- `https://yourusername.github.io/media-slicer/` (for project pages)
- `https://yourusername.github.io/` (for user/organization pages)

