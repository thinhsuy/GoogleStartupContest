import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import MainPage from './pages/MainPage';
import BroadcasterPage from './pages/BroadcasterPage';

function App() {
  return (
    <Routes>
      <Route path="*" element={<BroadcasterPage />} />
    </Routes>
  );
}

export default App;
