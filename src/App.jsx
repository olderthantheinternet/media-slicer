import React from 'react'
import MediaSlicer from './components/MediaSlicer'

// X.com logo component
const XLogo = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-label="X"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-8 px-4 flex flex-col">
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
            className="inline-flex items-center gap-2 hover:text-orange-400 transition-colors"
          >
            <XLogo className="h-4 w-4" />
            <span>@hthighway</span>
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App
