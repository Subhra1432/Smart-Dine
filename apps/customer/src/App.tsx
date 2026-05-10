// ═══════════════════════════════════════════
// DineSmart — Customer App Component
// ═══════════════════════════════════════════

import { Routes, Route } from 'react-router-dom';
import MenuPage from './pages/MenuPage';
import OrderTracking from './pages/OrderTracking';
import OfflinePage from './pages/OfflinePage';

function App() {
  return (
    <div className="min-h-screen bg-surface">
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/offline" element={<OfflinePage />} />
        <Route path="/order/:sessionId" element={<OrderTracking />} />
        <Route path="/track/:sessionId" element={<OrderTracking />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/menu/:slug" element={<MenuPage />} />
        <Route path="/:slug" element={<MenuPage />} />
        <Route path="*" element={
          <div className="flex items-center justify-center min-h-screen p-6">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-primary mb-4">DineSmart</h1>
              <p className="text-on-surface-variant text-lg">Scan a QR code at your table to start ordering</p>
              <div className="mt-8 w-40 h-40 mx-auto rounded-2xl bg-surface-container border-2 border-dashed border-outline-variant flex items-center justify-center">
                <span className="text-6xl">📱</span>
              </div>
            </div>
          </div>
        } />
      </Routes>
    </div>
  );
}

export default App;
