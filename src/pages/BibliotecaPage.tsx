import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Peca, Geracao } from '@/types';
import { TIPOS_BIOJOIA } from '@/types';
import {
  Search,
  Images,
  ChevronRight,
  Calendar,
  Trash2,
  Plus,
  Filter,
} from 'lucide-react';

interface BibliotecaPageProps {
  onEditPeca: (peca: Peca) => void;
  onNewPeca: () => void;
}

export function BibliotecaPage({ onEditPeca, onNewPeca }: BibliotecaPageProps) {
  const { user } = useAuth();
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [geracoes, setGeracoes] = useState<Record<string, Geracao[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [sortBy, setSortBy] = useState<'data_desc' | 'data_asc' | 'nome'>('data_desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadPecas();
  }, [user]);

  const loadPecas = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('pecas')
      .select('*')
      .eq('user_id', user.id)
      .order('criada_em', { ascending: false });
    if (data) {
      setPecas(data);
      // Load geracoes for each peca
      for (const p of data) {
        const { data: gens } = await supabase
          .from('geracoes')
          .select('*')
          .eq('peca_id', p.id)
          .order('criada_em', { ascending: false });
        if (gens) setGeracoes((prev) => ({ ...prev, [p.id]: gens }));
      }
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza? Todas as fotografias geradas desta peça serão removidas.')) return;
    await supabase.from('pecas').delete().eq('id', id);
    setPecas((prev) => prev.filter((p) => p.id !== id));
  };

  const filtered = useMemo(() => {
    let result = [...pecas];
    if (search) {
      result = result.filter((p) =>
        p.nome.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (filterTipo) {
      result = result.filter((p) => p.tipo === filterTipo);
    }
    if (sortBy === 'data_desc') result.sort((a, b) => b.criada_em.localeCompare(a.criada_em));
    if (sortBy === 'data_asc') result.sort((a, b) => a.criada_em.localeCompare(b.criada_em));
    if (sortBy === 'nome') result.sort((a, b) => a.nome.localeCompare(b.nome));
    return result;
  }, [pecas, search, filterTipo, sortBy]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-display font-light text-clay-900">Minhas Peças</h2>
          <p className="text-sm text-clay-500 mt-1">
            {pecas.length} {pecas.length === 1 ? 'peça cadastrada' : 'peças cadastradas'}
          </p>
        </div>
        <button onClick={onNewPeca} className="btn-primary">
          <Plus className="w-4 h-4" /> Nova peça
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clay-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
              placeholder="Buscar por nome..."
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="input-field min-w-[140px]"
            >
              <option value="">Todos os tipos</option>
              {TIPOS_BIOJOIA.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="input-field min-w-[140px]"
            >
              <option value="data_desc">Mais recentes</option>
              <option value="data_asc">Mais antigas</option>
              <option value="nome">Nome (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-clay-400">
          <p className="text-sm">Carregando...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Images className="w-12 h-12 text-clay-300 mx-auto mb-4" />
          <p className="text-sm text-clay-500 mb-2">
            {pecas.length === 0 ? 'Nenhuma peça cadastrada ainda.' : 'Nenhuma peça encontrada com os filtros.'}
          </p>
          {pecas.length === 0 && (
            <button onClick={onNewPeca} className="btn-secondary mt-4">
              <Plus className="w-4 h-4" /> Cadastrar primeira peça
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((peca) => {
            const pecaGeracoes = geracoes[peca.id] ?? [];
            const expanded = expandedId === peca.id;
            const editorialGens = pecaGeracoes.filter((g) => g.tipo_geracao === 'editorial' && g.status === 'concluida');
            const modeloGens = pecaGeracoes.filter((g) => g.tipo_geracao === 'modelo' && g.status === 'concluida');

            return (
              <div key={peca.id} className="card overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-sm bg-sand-100 overflow-hidden shrink-0">
                    {peca.foto_original_url ? (
                      <img src={peca.foto_original_url} alt={peca.nome} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Images className="w-6 h-6 text-clay-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-display font-medium text-clay-900 truncate">{peca.nome}</h3>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-clay-400">
                      {peca.tipo && <span>{peca.tipo}</span>}
                      {peca.dimensoes && <span>· {peca.dimensoes}</span>}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(peca.criada_em).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-clay-500">
                      <span>{editorialGens.length} editorial</span>
                      <span>{modeloGens.length} com modelo</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onEditPeca(peca)}
                      className="btn-ghost text-xs"
                      title="Abrir peça"
                    >
                      Abrir <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setExpanded(expanded ? null : peca.id)}
                      className="btn-ghost text-xs"
                    >
                      {pecaGeracoes.length > 0 ? `${pecaGeracoes.length} versões` : ''}
                    </button>
                    <button
                      onClick={() => handleDelete(peca.id)}
                      className="btn-ghost text-xs text-clay-400 hover:text-red-600"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded history */}
                {expanded && pecaGeracoes.length > 0 && (
                  <div className="border-t border-clay-100 p-4 bg-sand-50/50">
                    <h4 className="text-xs tracking-editorial uppercase text-clay-500 mb-3">Histórico de versões</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                      {pecaGeracoes.map((g) => (
                        <div key={g.id} className="text-center">
                          <div className="aspect-square bg-sand-100 rounded-sm overflow-hidden mb-1">
                            {g.imagem_url && g.status === 'concluida' ? (
                              <img src={g.imagem_url} alt="" className="w-full h-full object-cover" />
                            ) : g.status === 'erro' ? (
                              <div className="w-full h-full flex items-center justify-center text-red-400 text-xs">
                                Erro
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-clay-300 text-xs">
                                Processando
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-clay-400">
                            {g.tipo_geracao === 'editorial' ? 'Editorial' : 'Modelo'}
                          </p>
                          <p className="text-[10px] text-clay-300">
                            {new Date(g.criada_em).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
