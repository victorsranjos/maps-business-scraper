import { useState, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { Lead } from './LeadList';
import { LeadKanbanCard, PIPELINE_STAGES } from './LeadKanbanCard';
import { Eye, EyeOff } from 'lucide-react';

// Colunas principais do funil (excluindo saídas por padrão)
const MAIN_STAGES = PIPELINE_STAGES.filter(
    s => s.value !== 'CLIENTE_PERDIDO' && s.value !== 'DESCARTADO'
);
const EXIT_STAGES = PIPELINE_STAGES.filter(
    s => s.value === 'CLIENTE_PERDIDO' || s.value === 'DESCARTADO'
);

type StatusValue = typeof PIPELINE_STAGES[number]['value'];

// Componente de coluna individual — faz sua própria query
function KanbanColumn({
    stage,
    onDrop,
    onDragOver,
    onDragLeave,
    isDragOver,
    onDragStart,
}: {
    stage: typeof PIPELINE_STAGES[number];
    onDrop: (e: React.DragEvent, targetStatus: StatusValue) => void;
    onDragOver: (e: React.DragEvent, status: StatusValue) => void;
    onDragLeave: () => void;
    isDragOver: boolean;
    onDragStart: (e: React.DragEvent, leadId: string) => void;
}) {
    const leads = useQuery(api.business.getLeadsByStatus, { status: stage.value });
    const count = leads?.length ?? 0;

    return (
        <div
            className={`flex flex-col flex-shrink-0 w-64 rounded-xl border-2 transition-all duration-150
                ${isDragOver
                    ? 'border-blue-400 shadow-lg shadow-blue-100 scale-[1.01]'
                    : 'border-transparent'
                }`}
            onDragOver={(e) => onDragOver(e, stage.value)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, stage.value)}
        >
            {/* Header da coluna */}
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-xl border-t-4 ${stage.color} ${stage.headerBg}`}>
                <span className={`w-2 h-2 rounded-full ${stage.dot} flex-shrink-0`} />
                <h3 className="text-sm font-bold text-gray-800 flex-1 truncate">{stage.label}</h3>
                <span className="text-xs font-bold text-gray-500 bg-white/70 px-1.5 py-0.5 rounded-full">
                    {leads === undefined ? '…' : count}
                </span>
            </div>

            {/* Cards */}
            <div
                className={`flex-1 min-h-[100px] max-h-[calc(100vh-260px)] overflow-y-auto p-2 flex flex-col gap-2 rounded-b-xl transition-colors duration-150
                    ${isDragOver ? 'bg-blue-50/60' : 'bg-gray-100/60'}`}
            >
                {leads === undefined && (
                    <div className="flex justify-center items-center py-6">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400" />
                    </div>
                )}

                {leads && leads.length === 0 && (
                    <div className={`flex-1 flex items-center justify-center py-6 border-2 border-dashed rounded-lg transition-colors duration-150
                        ${isDragOver ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                        <p className="text-xs text-gray-400">Solte aqui</p>
                    </div>
                )}

                {leads?.map(lead => (
                    <LeadKanbanCard
                        key={lead._id}
                        lead={lead as unknown as Lead}
                        onDragStart={onDragStart}
                    />
                ))}
            </div>
        </div>
    );
}

export function Pipeline() {
    const [showExitStages, setShowExitStages] = useState(false);
    const [dragOverStatus, setDragOverStatus] = useState<StatusValue | null>(null);
    const dragLeadId = useRef<string | null>(null);
    const updateLeadStatus = useMutation(api.business.updateLeadStatus);

    const handleDragStart = (e: React.DragEvent, leadId: string) => {
        dragLeadId.current = leadId;
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, status: StatusValue) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverStatus(status);
    };

    const handleDragLeave = () => {
        setDragOverStatus(null);
    };

    const handleDrop = async (e: React.DragEvent, targetStatus: StatusValue) => {
        e.preventDefault();
        setDragOverStatus(null);
        const leadId = dragLeadId.current;
        if (!leadId) return;
        dragLeadId.current = null;
        await updateLeadStatus({
            leadId: leadId as Id<'leads'>,
            status: targetStatus,
        });
    };

    const visibleStages = showExitStages
        ? [...MAIN_STAGES, ...EXIT_STAGES]
        : MAIN_STAGES;

    const columnProps = {
        onDrop: handleDrop,
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onDragStart: handleDragStart,
    };

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar do Pipeline */}
            <div className="flex items-center justify-between px-4 py-3 mb-2">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Pipeline de Outreach</h2>
                    <p className="text-sm text-gray-500">Arraste os cards entre as colunas para avançar no funil</p>
                </div>
                <button
                    onClick={() => setShowExitStages(v => !v)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-600 transition-colors"
                >
                    {showExitStages ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showExitStages ? 'Ocultar saídas' : 'Mostrar Perdido/Descartado'}
                </button>
            </div>

            {/* Board — scroll horizontal */}
            <div className="flex-1 overflow-x-auto px-4 pb-6">
                <div className="flex gap-3 min-w-max">
                    {visibleStages.map(stage => (
                        <KanbanColumn
                            key={stage.value}
                            stage={stage}
                            isDragOver={dragOverStatus === stage.value}
                            {...columnProps}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
