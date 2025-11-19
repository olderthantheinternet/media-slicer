import React, { useState, useRef, useEffect } from 'react'
import { useFFmpeg } from '../hooks/useFFmpeg'
import { sanitizeFilename, isSupportedMediaFile, getFileExtension } from '../utils/fileUtils'
import JSZip from 'jszip'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Progress } from './ui/progress'
import { Alert, AlertDescription } from './ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Loader2, File, Upload, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '../lib/utils'

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
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      {!isLoaded && (
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading FFmpeg (this may take a moment on first load)...</p>
        </CardContent>
      )}

      {isLoaded && (
        <>
          <CardHeader>
            <CardTitle className="text-3xl">Media Slicer</CardTitle>
            <CardDescription>
              Split your audio and video files into segments - 100% browser-based
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload */}
            <div className="space-y-2">
              <label className="block">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,video/*"
                  onChange={handleFileSelect}
                  disabled={isProcessing}
                  className="hidden"
                />
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    file
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50",
                    isProcessing && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => !isProcessing && fileInputRef.current?.click()}
                >
                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      <File className="h-12 w-12 text-primary" />
                      <span className="font-medium text-lg">{file.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-12 w-12 text-muted-foreground" />
                      <span className="font-medium text-lg">Click to select a media file</span>
                      <span className="text-sm text-muted-foreground">
                        Supports: MP4, MP3, MOV, WAV, and more
                      </span>
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* Segment Length Input */}
            <div className="space-y-2">
              <label htmlFor="segment-length" className="text-sm font-medium">
                Segment Length (seconds)
              </label>
              <Input
                id="segment-length"
                type="number"
                min="1"
                max="3600"
                value={segmentLength}
                onChange={(e) => setSegmentLength(parseInt(e.target.value) || 30)}
                disabled={isProcessing}
                className="w-full"
              />
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Status Alert */}
            {status && !error && (
              <Alert>
                {status.includes('Success') ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Info className="h-4 w-4" />
                )}
                <AlertDescription>{status}</AlertDescription>
              </Alert>
            )}

            {/* Progress Bar */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Processing...</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Process Button */}
            <Button
              onClick={handleProcess}
              disabled={!file || isProcessing || !isLoaded}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Slice & Download'
              )}
            </Button>

            {/* Info Section */}
            <div className="pt-6 border-t space-y-3">
              <h3 className="font-semibold text-lg">How it works:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Select a media file (audio or video)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Choose segment length in seconds</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Click "Slice & Download" to process</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Segments are automatically numbered and zipped</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>All processing happens in your browser - no server needed!</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  )
}

export default MediaSlicer
