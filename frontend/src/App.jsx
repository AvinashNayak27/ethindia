import './App.css'
import ImageDrop from './components/Imagedrop'

function App() {

  return (
    <>
      <div className="App">
        <header className="App-header">
          <h1 className="text-3xl font-bold underline mb-4">
            AuthentiChain
          </h1>
          <div className="flex justify-center h-screen">
            <ImageDrop />
          </div>
        </header>
      </div>
    </>
  )
}

export default App
