import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Docs from './pages/Docs';
import Privacy from './pages/Privacy';
import Import from './pages/Import';
import { ErrorTest } from './components/ErrorTest';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/import" element={<Import />} />
      </Routes>
      <ErrorTest />
    </BrowserRouter>
  );
}

export default App;