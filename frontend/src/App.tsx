import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Docs from './pages/Docs';
import Privacy from './pages/Privacy';
import Demo from './pages/Demo';
import { ErrorTest } from './components/ErrorTest';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/demo" element={<Demo />} />
      </Routes>
      <ErrorTest />
    </BrowserRouter>
  );
}

export default App;