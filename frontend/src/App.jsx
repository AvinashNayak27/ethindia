import './App.css'
import ImageDrop from './components/Imagedrop'
// Header.js
import { Link } from 'react-router-dom';

export const Header = () => {
  return (
    <header className="bg-blue-500 text-white p-4">
      <nav className="container mx-auto flex justify-between">
        <div className="flex space-x-4">
          <Link to="/" className="hover:bg-blue-700 px-3 py-2 rounded-md">Register</Link>
          <Link to="/verify" className="hover:bg-blue-700 px-3 py-2 rounded-md">Verify</Link>
          <Link to="/feed" className="hover:bg-blue-700 px-3 py-2 rounded-md">Feed</Link>
        </div>
      </nav>
    </header>
  );
};


function App() {

  return (
    <>
      <div className="App">
        <div className="App-header">
          <h1 className="text-3xl font-bold underline mb-4">
            AuthentiChain
          </h1>
          <Header />
          <div className="flex justify-center h-screen">
            <ImageDrop />
          </div>
        </div>
      </div>
    </>
  )
}

export default App
