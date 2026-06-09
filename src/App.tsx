import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CompletePage } from './pages/CompletePage';
import { VotePage } from './pages/VotePage';
import { AdminGuard } from './pages/admin/AdminGuard';
import { EditPollPage } from './pages/admin/EditPollPage';
import { LoginPage } from './pages/admin/LoginPage';
import { ManagePage } from './pages/admin/ManagePage';
import { ResultsPage } from './pages/admin/ResultsPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-root">
        <Routes>
          <Route path="/" element={<Navigate to="/polls/42" replace />} />
          <Route path="/polls/:pollId" element={<VotePage />} />
          <Route path="/polls/:pollId/complete" element={<CompletePage />} />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route element={<AdminGuard />}>
            <Route path="/admin" element={<ManagePage />} />
            <Route path="/admin/polls/:pollId/results" element={<ResultsPage />} />
            <Route path="/admin/polls/:pollId/edit" element={<EditPollPage />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}
