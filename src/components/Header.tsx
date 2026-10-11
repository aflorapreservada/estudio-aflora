import { useAuth } from '@/contexts/AuthContext';
import { Flower2, LogOut, Images, Camera } from 'lucide-react';

interface HeaderProps {
  currentPage: 'studio' | 'biblioteca';
  onNavigate: (page: 'studio' | 'biblioteca') => void;
}

export function Header({ currentPage, onNavigate }: HeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-sand-50/95 backdrop-blur-sm border-b border-clay-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => onNavigate('studio')}
            className="flex items-center gap-2.5 group"
          >
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-clay-700 transition-transform group-hover:scale-105">
              <Flower2 className="w-4.5 h-4.5 text-sand-50" />
            </span>
            <div className="text-left">
              <p className="font-display text-lg font-medium text-clay-900 leading-none">Estúdio Aflora</p>
              <p className="text-[10px] text-clay-400 tracking-editorial uppercase mt-0.5">Ateliê Aflora</p>
            </div>
          </button>

          <nav className="flex items-center gap-1">
            <button
              onClick={() => onNavigate('studio')}
              className={`btn-ghost ${currentPage === 'studio' ? 'bg-clay-100 text-clay-900' : ''}`}
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Estúdio</span>
            </button>
            <button
              onClick={() => onNavigate('biblioteca')}
              className={`btn-ghost ${currentPage === 'biblioteca' ? 'bg-clay-100 text-clay-900' : ''}`}
            >
              <Images className="w-4 h-4" />
              <span className="hidden sm:inline">Minhas Peças</span>
            </button>

            <div className="w-px h-6 bg-clay-200 mx-2" />

            <div className="hidden sm:block text-xs text-clay-500 max-w-[160px] truncate">
              {user?.email}
            </div>
            <button
              onClick={() => signOut()}
              className="btn-ghost"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
