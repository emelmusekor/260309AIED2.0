import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ChapterPage from './pages/ChapterPage';

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Background glow effects */}
        <div className="bg-glow" style={{ top: '-10%', left: '-10%', width: '40vw', height: '40vw', background: '#3b82f6' }}></div>
        <div className="bg-glow" style={{ bottom: '-10%', right: '-10%', width: '30vw', height: '30vw', background: '#8b5cf6' }}></div>

        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chapter/:id" element={<ChapterPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
