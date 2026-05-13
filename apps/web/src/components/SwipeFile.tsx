import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import {
    Plus, X, Trash2, ExternalLink, Tag, Copy, AlertTriangle,
    Image, Mail, Megaphone, Layers, ClipboardList,
} from 'lucide-react';

// ─── Tipos & Constantes ───────────────────────────────────────────────────────

type Category = 'COPY' | 'SCRIPT' | 'IMAGEM' | 'EMAIL' | 'ANUNCIO' | 'OUTRO';

const SWIPE_COLUMNS: {
    value: Category;
    label: string;
    icon: React.ElementType;
    color: string;          // border-t color
    headerBg: string;
    iconColor: string;
    dot: string;
}[] = [
    { value: 'COPY',    label: 'Copy / Texto',        icon: Copy,        color: 'border-t-violet-500', headerBg: 'bg-violet-50',  iconColor: 'text-violet-500', dot: 'bg-violet-500' },
    { value: 'SCRIPT',  label: 'Script / Roteiro',    icon: ClipboardList, color: 'border-t-blue-500',   headerBg: 'bg-blue-50',    iconColor: 'text-blue-500',   dot: 'bg-blue-500'   },
    { value: 'EMAIL',   label: 'E-mail',               icon: Mail,        color: 'border-t-indigo-500', headerBg: 'bg-indigo-50',  iconColor: 'text-indigo-500', dot: 'bg-indigo-500' },
    { value: 'ANUNCIO', label: 'Anúncio / Ad',         icon: Megaphone,   color: 'border-t-orange-500', headerBg: 'bg-orange-50',  iconColor: 'text-orange-500', dot: 'bg-orange-500' },
    { value: 'IMAGEM',  label: 'Imagem / Referência',  icon: Image,       color: 'border-t-pink-500',   headerBg: 'bg-pink-50',    iconColor: 'text-pink-500',   dot: 'bg-pink-500'   },
    { value: 'OUTRO',   label: 'Outro',                icon: Layers,      color: 'border-t-gray-400',   headerBg: 'bg-gray-50',    iconColor: 'text-gray-500',   dot: 'bg-gray-400'   },
];

// ─── Formulário modal para adicionar item ─────────────────────────────────────

interface AddItemModalProps {
    defaultCategory: Category;
    onClose: () => void;
}

function AddItemModal({ defaultCategory, onClose }: AddItemModalProps) {
    const createItem = useMutation(api.swipeFile.create);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<Category>(defaultCategory);
    const [source, setSource] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    const addTag = () => {
        const t = tagInput.trim();
        if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
        setTagInput('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        setSaving(true);
        try {
            await createItem({
                title: title.trim(),
                content: content.trim() || undefined,
                category,
                source: source.trim() || undefined,
                imageUrl: imageUrl.trim() || undefined,
                tags: tags.length ? tags : undefined,
            });
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Novo item no Swipe File</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                    {/* Categoria */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Categoria</label>
                        <div className="flex flex-wrap gap-2">
                            {SWIPE_COLUMNS.map(col => (
                                <button
                                    key={col.value}
                                    type="button"
                                    onClick={() => setCategory(col.value)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                                        ${category === col.value
                                            ? `${col.iconColor} bg-white border-current shadow-sm`
                                            : 'text-gray-500 border-gray-200 hover:border-gray-300 bg-white'
                                        }`}
                                >
                                    <col.icon className="w-3.5 h-3.5" />
                                    {col.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Título */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Título *</label>
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Ex: Hook de abertura de cold DM"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Conteúdo */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Conteúdo / Copy</label>
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            rows={5}
                            placeholder="Cole aqui o texto, script ou descrição do exemplo..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent resize-none font-mono"
                        />
                    </div>

                    {/* URL de imagem */}
                    {category === 'IMAGEM' && (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">URL da Imagem</label>
                            <input
                                value={imageUrl}
                                onChange={e => setImageUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                            />
                        </div>
                    )}

                    {/* Fonte / referência */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Fonte / URL de origem</label>
                        <input
                            value={source}
                            onChange={e => setSource(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tags</label>
                        <div className="flex gap-2">
                            <input
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                                placeholder="Ex: cold-outreach, prospecção..."
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                            />
                            <button type="button" onClick={addTag}
                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-semibold transition-colors">
                                Add
                            </button>
                        </div>
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {tags.map(tag => (
                                    <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full text-xs font-medium">
                                        <Tag className="w-2.5 h-2.5" />{tag}
                                        <button type="button" onClick={() => setTags(t => t.filter(x => x !== tag))} className="ml-0.5 hover:text-red-500">
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Botão salvar */}
                    <button
                        type="submit"
                        disabled={saving || !title.trim()}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
                    >
                        {saving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                            <Plus className="w-4 h-4" />
                        )}
                        Salvar no Swipe File
                    </button>
                </form>
            </div>
        </div>
    );
}

// ─── Card individual do swipe file ───────────────────────────────────────────

type SwipeItem = {
    _id: Id<'swipe_items'>;
    title: string;
    content?: string;
    category: Category;
    source?: string;
    imageUrl?: string;
    tags?: string[];
    createdAt: number;
};

interface SwipeCardProps {
    item: SwipeItem;
}

function SwipeCard({ item }: SwipeCardProps) {
    const removeItem = useMutation(api.swipeFile.remove);
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!item.content) return;
        await navigator.clipboard.writeText(item.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirming(true);
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirming(false);
    };

    const handleConfirmDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleting(true);
        try {
            await removeItem({ id: item._id });
        } finally {
            setDeleting(false);
            setConfirming(false);
        }
    };

    return (
        <div
            onClick={() => !confirming && setExpanded(v => !v)}
            className={`bg-white rounded-lg border p-3 shadow-sm cursor-pointer hover:shadow-md transition-all duration-150 group
                ${ confirming
                    ? 'border-red-300 ring-2 ring-red-100'
                    : 'border-gray-200 hover:border-violet-300'
                }`}
        >
            {/* Imagem de referência */}
            {item.imageUrl && (
                <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-32 object-cover rounded-md mb-2"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
            )}

            {/* Título + ações */}
            <div className="flex items-start gap-2">
                <p className={`flex-1 text-sm font-bold leading-tight transition-colors
                    ${ confirming ? 'text-red-600' : 'text-gray-900 group-hover:text-violet-700' }`}>
                    {item.title}
                </p>

                {/* Ações normais */}
                {!confirming && (
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.content && (
                            <button
                                onClick={handleCopy}
                                title="Copiar conteúdo"
                                className="p-1 rounded hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-colors"
                            >
                                {copied
                                    ? <span className="text-[10px] font-bold text-green-600">OK!</span>
                                    : <Copy className="w-3.5 h-3.5" />
                                }
                            </button>
                        )}
                        {item.source && (
                            <a
                                href={item.source}
                                target="_blank"
                                rel="noreferrer"
                                onClick={e => e.stopPropagation()}
                                title="Ver fonte"
                                className="p-1 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        )}
                        <button
                            onClick={handleDeleteClick}
                            title="Excluir"
                            className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Confirmação de exclusão inline */}
            {confirming && (
                <div
                    className="mt-2.5 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150"
                    onClick={e => e.stopPropagation()}
                >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    <span className="flex-1 text-xs text-red-600 font-medium">Excluir este item?</span>
                    <button
                        onClick={handleCancel}
                        className="px-2.5 py-1 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirmDelete}
                        disabled={deleting}
                        className="px-2.5 py-1 text-xs font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-md transition-colors flex items-center gap-1"
                    >
                        {deleting
                            ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                            : <Trash2 className="w-3 h-3" />
                        }
                        Excluir
                    </button>
                </div>
            )}

            {/* Conteúdo expandível */}
            {item.content && (
                <p className={`mt-1.5 text-xs text-gray-600 font-mono whitespace-pre-wrap leading-relaxed transition-all ${expanded ? '' : 'line-clamp-3'}`}>
                    {item.content}
                </p>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.map(tag => (
                        <span key={tag} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-violet-50 text-violet-700 rounded-full text-[10px] font-medium">
                            <Tag className="w-2 h-2" />{tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Coluna do Kanban ─────────────────────────────────────────────────────────

interface SwipeColumnProps {
    col: typeof SWIPE_COLUMNS[number];
    onAdd: (cat: Category) => void;
}

function SwipeColumn({ col, onAdd }: SwipeColumnProps) {
    const items = useQuery(api.swipeFile.listByCategory, { category: col.value });
    const count = items?.length ?? 0;
    const Icon = col.icon;

    return (
        <div className="flex flex-col flex-shrink-0 w-64">
            {/* Header */}
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-xl border-t-4 ${col.color} ${col.headerBg}`}>
                <span className={`w-2 h-2 rounded-full ${col.dot} flex-shrink-0`} />
                <Icon className={`w-3.5 h-3.5 ${col.iconColor} flex-shrink-0`} />
                <h3 className="text-sm font-bold text-gray-800 flex-1 truncate">{col.label}</h3>
                <span className="text-xs font-bold text-gray-500 bg-white/70 px-1.5 py-0.5 rounded-full">
                    {items === undefined ? '…' : count}
                </span>
            </div>

            {/* Cards */}
            <div className="flex-1 min-h-[100px] max-h-[calc(100vh-280px)] overflow-y-auto p-2 flex flex-col gap-2 rounded-b-xl bg-gray-100/60">
                {items === undefined && (
                    <div className="flex justify-center items-center py-6">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400" />
                    </div>
                )}

                {items?.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-200 rounded-lg gap-2">
                        <p className="text-xs text-gray-400">Nenhum exemplo ainda</p>
                    </div>
                )}

                {items?.map(item => (
                    <SwipeCard key={item._id} item={item as unknown as SwipeItem} />
                ))}

                {/* Botão + colado ao final */}
                <button
                    onClick={() => onAdd(col.value)}
                    className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 border-dashed text-xs font-semibold transition-all
                        border-gray-200 text-gray-400 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50`}
                >
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
            </div>
        </div>
    );
}

// ─── Board principal ──────────────────────────────────────────────────────────

export function SwipeFile() {
    const [modalCategory, setModalCategory] = useState<Category | null>(null);

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 mb-2">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">📌 Swipe File</h2>
                    <p className="text-sm text-gray-500">Guarde bons exemplos de copy, scripts, anúncios e mais</p>
                </div>
                <button
                    onClick={() => setModalCategory('COPY')}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Novo Exemplo
                </button>
            </div>

            {/* Board — scroll horizontal */}
            <div className="flex-1 overflow-x-auto px-4 pb-6">
                <div className="flex gap-3 min-w-max">
                    {SWIPE_COLUMNS.map(col => (
                        <SwipeColumn
                            key={col.value}
                            col={col}
                            onAdd={(cat) => setModalCategory(cat)}
                        />
                    ))}
                </div>
            </div>

            {/* Modal de criação */}
            {modalCategory && (
                <AddItemModal
                    defaultCategory={modalCategory}
                    onClose={() => setModalCategory(null)}
                />
            )}
        </div>
    );
}
