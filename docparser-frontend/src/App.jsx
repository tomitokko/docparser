import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import FileUpload from './FileUpload';
import ResultViewer from './ResultViewer';

function App() {
  const [result, setResult] = useState(null)
  console.log('Result: ', result);

  return (
    <>
      <div className="app">
        <header className="navbar">
          <div className="navbar-title">doc parser</div>
        </header>
        <main className="main-content">
          <FileUpload onUploadComplete={setResult} />

          {result ? (
            <ResultViewer result={result} />
          ) : (
            <div className="placeholder-message">
              <p>Upload a PDF to see the extracted content and data points</p>
            </div>
          )}
        </main>
      </div>
    </>
  )
}

export default App
