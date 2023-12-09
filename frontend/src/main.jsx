import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import Verify from '../src/components/VerifyImage.jsx'
import { AirstackProvider } from "@airstack/airstack-react";
import MyComponent from './components/Airstack.jsx';
import Feed from './components/Feed.jsx';
import { createClient, Provider } from 'urql';

// URQL Client
const client = createClient({
  url: 'https://api.studio.thegraph.com/query/59475/authenichainscroll/version/latest'
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider value={client}>
    <AirstackProvider apiKey='1cdc1939dda824d66b6c9870638195b41'>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="verify" element={<Verify />} />
        <Route path='airstack' element={<MyComponent/>}/>
        <Route path='feed' element={<Feed/>}/>
      </Routes>
    </Router>
    </AirstackProvider>
    </Provider>
  </React.StrictMode>,
)
