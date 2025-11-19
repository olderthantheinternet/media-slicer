import React, { useState, useRef } from 'react'
import MediaSlicer from './components/MediaSlicer'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <h1>🎬 Media Slicer</h1>
        <p>Split your audio and video files into segments - 100% browser-based</p>
      </header>
      <MediaSlicer />
    </div>
  )
}

export default App

