import { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AuthPage } from '@/pages/AuthPage';
import { Header } from '@/components/Header';
import { StudioPage } from '@/pages/StudioPage';
import { BibliotecaPage } from '@/pages/BibliotecaPage';
import { Loader2 } from 'lucide-react';
import type { Peca } from '@/types';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'studio' | 'biblioteca'>('studio');
  const [editingPeca, setEditingPeca] = useState<Peca | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-50">
        <Loader2 className="w-6 h-6 text-clay-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleEditPeca = (peca: Peca) => {
    setEditingPeca(peca);
    setCurrentPage('studio');
  };

  const handleNewPeca = () => {
    setEditingPeca(null);
    setCurrentPage('studio');
  };

  return (
    <div className="min-h-screen bg-sand-50">
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      {currentPage === 'studio' && (
        <StudioPage
          editingPeca={editingPeca}
          onClearEditing={() => setEditingPeca(null)}
        />
      )}
      {currentPage === 'biblioteca' && (
        <BibliotecaPage
          onEditPeca={handleEditPeca}
          onNewPeca={handleNewPeca}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
