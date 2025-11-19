import React, { useState, useRef, useEffect } from 'react'
import { useFFmpeg } from '../hooks/useFFmpeg'
import { sanitizeFilename, isSupportedMediaFile, getFileExtension } from '../utils/fileUtils'
import JSZip from 'jszip'
import './MediaSlicer.css'

function MediaSlicer() {
  const [file, setFile] = useState(null)
  const [segmentLength, setSegmentLength] = useState(30)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)
  const { ffmpeg, isLoaded, loadFFmpeg } = useFFmpeg()

  useEffect(() => {
    loadFFmpeg()
  }, [loadFFmpeg])

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    setError('')
    
    // Validate file type
    if (!isSupportedMediaFile(selectedFile)) {
      setError('Unsupported file format. Please select a media file (mp4, mp3, mov, wav, etc.)')
      return
    }

    // Validate file size (limit to 500MB for browser processing)
    const maxSize = 500 * 1024 * 1024 // 500MB
    if (selectedFile.size > maxSize) {
      setError('File size too large. Maximum size is 500MB for browser processing.')
      return
    }

    setFile(selectedFile)
    setStatus('File selected. Ready to process.')
  }

  const handleProcess = async () => {
    if (!file || !isLoaded) {
      setError('Please select a file and wait for FFmpeg to load.')
      return
    }

    if (!ffmpeg) {
      setError('FFmpeg is not initialized. Please wait for it to load.')
      return
    }

    if (segmentLength <= 0) {
      setError('Segment length must be greater than 0.')
      return
    }

    setIsProcessing(true)
    setError('')
    setProgress(0)
    setStatus('Processing... This may take a while for large files.')

    try {
      // Sanitize filename
      const sanitized = sanitizeFilename(file.name)
      const ext = getFileExtension(sanitized)
      const baseName = sanitized.substring(0, sanitized.lastIndexOf('.')) || sanitized

      // Write input file to FFmpeg
      // FFmpeg.wasm requires Uint8Array, not ArrayBuffer
      setStatus('Loading file into FFmpeg...')
      const fileData = await file.arrayBuffer()
      await ffmpeg.writeFile(sanitized, new Uint8Array(fileData))
      setProgress(10)

      // Determine output format (preserve original or use appropriate format)
      const outputExt = ext || 'mp4'
      const outputPattern = `out_%02d.${outputExt}`

      setStatus('Slicing media file...')
      
      // Run FFmpeg command
      // Using -c copy for faster processing (no re-encoding)
      // -reset_timestamps ensures proper playback
      try {
        await ffmpeg.exec([
          '-i', sanitized,
          '-f', 'segment',
          '-segment_time', segmentLength.toString(),
          '-c', 'copy',
          '-reset_timestamps', '1',
          '-segment_format', outputExt === 'mp3' || outputExt === 'wav' ? outputExt : 'mp4',
          outputPattern
        ])
      } catch (execErr) {
        // FFmpeg exec errors might not have standard error format
        const execErrorMessage = execErr?.message || execErr?.toString() || String(execErr) || 'FFmpeg execution failed'
        throw new Error(`FFmpeg processing failed: ${execErrorMessage}`)
      }

      setProgress(60)
      setStatus('Collecting segments...')

      // List all output files
      const files = await ffmpeg.listDir('/')
      const outputFiles = files
        .filter(f => f.name.startsWith('out_') && f.name.endsWith(`.${outputExt}`))
        .sort((a, b) => a.name.localeCompare(b.name))

      if (outputFiles.length === 0) {
        throw new Error('No output files were created. The file might be too short or there was an error.')
      }

      setProgress(70)
      setStatus(`Creating ZIP file with ${outputFiles.length} segments...`)

      // Create ZIP file
      const zip = new JSZip()
      
      for (let i = 0; i < outputFiles.length; i++) {
        const outputFile = outputFiles[i]
        const data = await ffmpeg.readFile(outputFile.name)
        const segmentNumber = String(i + 1).padStart(2, '0')
        const zipFileName = `${baseName}_segment_${segmentNumber}.${outputExt}`
        zip.file(zipFileName, data)
        setProgress(70 + (i + 1) / outputFiles.length * 20)
      }

      setProgress(95)
      setStatus('Finalizing ZIP file...')

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${baseName}_segments.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Clean up FFmpeg files
      for (const outputFile of outputFiles) {
        await ffmpeg.deleteFile(outputFile.name)
      }
      await ffmpeg.deleteFile(sanitized)

      setProgress(100)
      setStatus(`Success! Created ${outputFiles.length} segments. Download started.`)
      
      // Reset after 3 seconds
      setTimeout(() => {
        setFile(null)
        setProgress(0)
        setStatus('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }, 3000)

    } catch (err) {
      console.error('Processing error:', err)
      // Safely extract error message
      const errorMessage = err?.message || err?.toString() || String(err) || 'Unknown error occurred'
      setError(`Error processing file: ${errorMessage}`)
      setStatus('')
      
      // Clean up any files that might have been created
      try {
        if (ffmpeg) {
          const sanitized = sanitizeFilename(file.name)
          const files = await ffmpeg.listDir('/')
          for (const f of files) {
            if (f.name === sanitized || f.name.startsWith('out_')) {
              await ffmpeg.deleteFile(f.name).catch(() => {})
            }
          }
        }
      } catch (cleanupErr) {
        console.error('Cleanup error:', cleanupErr)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="media-slicer">
      <div className="slicer-card">
        {!isLoaded && (
          <div className="loading-section">
            <div className="spinner"></div>
            <p>Loading FFmpeg (this may take a moment on first load)...</p>
          </div>
        )}

        {isLoaded && (
          <>
            <div className="file-upload-section">
              <label className="file-label">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,video/*"
                  onChange={handleFileSelect}
                  disabled={isProcessing}
                  className="file-input"
                />
                <div className="file-input-display">
                  {file ? (
                    <div className="file-info">
                      <span className="file-name">📄 {file.name}</span>
                      <span className="file-size">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  ) : (
                    <div className="file-placeholder">
                      <span>📁 Click to select a media file</span>
                      <small>Supports: MP4, MP3, MOV, WAV, and more</small>
                    </div>
                  )}
                </div>
              </label>
            </div>

            <div className="segment-config">
              <label className="config-label">
                Segment Length (seconds):
                <input
                  type="number"
                  min="1"
                  max="3600"
                  value={segmentLength}
                  onChange={(e) => setSegmentLength(parseInt(e.target.value) || 30)}
                  disabled={isProcessing}
                  className="segment-input"
                />
              </label>
            </div>

            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            {status && (
              <div className="status-message">
                {status}
              </div>
            )}

            {isProcessing && (
              <div className="progress-section">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{Math.round(progress)}%</span>
              </div>
            )}

            <button
              onClick={handleProcess}
              disabled={!file || isProcessing || !isLoaded}
              className="process-button"
            >
              {isProcessing ? 'Processing...' : 'Slice & Download'}
            </button>

            <div className="info-section">
              <h3>How it works:</h3>
              <ul>
                <li>Select a media file (audio or video)</li>
                <li>Choose segment length in seconds</li>
                <li>Click "Slice & Download" to process</li>
                <li>Segments are automatically numbered and zipped</li>
                <li>All processing happens in your browser - no server needed!</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MediaSlicer

