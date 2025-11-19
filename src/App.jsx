import React from 'react'
import MediaSlicer from './components/MediaSlicer'
import { Twitter } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] py-8 px-4 flex flex-col">
      <div className="max-w-4xl mx-auto flex-1 w-full">
        <MediaSlicer />
      </div>
      <footer className="max-w-4xl mx-auto w-full mt-8 text-center">
        <div className="text-white/90 text-sm">
          <p className="mb-2">
            Created by <span className="font-semibold">Paul Hawkins</span>
          </p>
          <a
            href="https://x.com/hthighway"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:text-white transition-colors"
          >
            <Twitter className="h-4 w-4" />
            <span>@hthighway</span>
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App
