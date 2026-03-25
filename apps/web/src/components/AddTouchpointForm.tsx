import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { Check, X } from 'lucide-react';

type Channel = 'WHATSAPP' | 'EMAIL' | 'INSTAGRAM' | 'TELEFONE' | 'LINKEDIN' | 'OUTRO';
type Direction = 'OUTBOUND' | 'INBOUND';
type Status = 'ENVIADO' | 'RESPONDIDO' | 'SEM_RESPOSTA';

interface AddTouchpointFormProps {
    leadId: Id<'leads'>;
    onDone: () => void;
}

const CHANNELS: { value: Channel; label: string; emoji: string }[] = [
    { value: 'WHATSAPP',  label: 'WhatsApp',  emoji: '💬' },
    { value: 'EMAIL',     label: 'E-mail',    emoji: '📧' },
    { value: 'INSTAGRAM', label: 'Instagram', emoji: '📸' },
    { value: 'TELEFONE',  label: 'Telefone',  emoji: '📞' },
    { value: 'LINKEDIN',  label: 'LinkedIn',  emoji: '💼' },
    { value: 'OUTRO',     label: 'Outro',     emoji: '🔗' },
];

const STATUSES: { value: Status; label: string }[] = [
    { value: 'ENVIADO',      label: 'Enviado' },
    { value: 'RESPONDIDO',   label: 'Respondido' },
    { value: 'SEM_RESPOSTA', label: 'Sem Resposta' },
];

export function AddTouchpointForm({ leadId, onDone }: AddTouchpointFormProps) {
    const addTouchpoint = useMutation(api.touchpoints.add);

    const [channel, setChannel] = useState<Channel>('WHATSAPP');
    const [direction, setDirection] = useState<Direction>('OUTBOUND');
    const [status, setStatus] = useState<Status>('ENVIADO');
    const [message, setMessage] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    // Data/hora default = agora
    const toLocalDatetimeValue = (ts: number) => {
        const d = new Date(ts);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    const [contactedAt, setContactedAt] = useState(toLocalDatetimeValue(Date.now()));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addTouchpoint({
                leadId,
                channel,
                direction,
                status,
                message: message.trim() || undefined,
                notes: notes.trim() || undefined,
                contactedAt: new Date(contactedAt).getTime(),
            });
            onDone();
        } finally {
            setLoading(false);
        }
    };

    const fieldClass = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white";
    const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5";

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-3"
        >
            {/* Canal */}
            <div>
                <label className={labelClass}>Canal</label>
                <div className="flex flex-wrap gap-1.5">
                    {CHANNELS.map(ch => (
                        <button
                            key={ch.value}
                            type="button"
                            onClick={() => setChannel(ch.value)}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors
                                ${channel === ch.value
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
                                }`}
                        >
                            {ch.emoji} {ch.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Direção + Status */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className={labelClass}>Direção</label>
                    <select
                        value={direction}
                        onChange={e => setDirection(e.target.value as Direction)}
                        className={fieldClass}
                    >
                        <option value="OUTBOUND">↑ Você enviou</option>
                        <option value="INBOUND">↓ Lead respondeu</option>
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Status</label>
                    <select
                        value={status}
                        onChange={e => setStatus(e.target.value as Status)}
                        className={fieldClass}
                    >
                        {STATUSES.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Data/hora */}
            <div>
                <label className={labelClass}>Data do Contato</label>
                <input
                    type="datetime-local"
                    value={contactedAt}
                    onChange={e => setContactedAt(e.target.value)}
                    className={fieldClass}
                />
            </div>

            {/* Mensagem exata */}
            <div>
                <label className={labelClass}>Mensagem Enviada</label>
                <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Cole ou escreva o texto exato que você enviou..."
                    rows={4}
                    className={`${fieldClass} resize-y`}
                />
            </div>

            {/* Notas */}
            <div>
                <label className={labelClass}>Anotações Internas</label>
                <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Observações sobre esse contato (não enviadas)..."
                    rows={2}
                    className={`${fieldClass} resize-y`}
                />
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-1">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                    <Check className="w-4 h-4" />
                    {loading ? 'Salvando…' : 'Salvar Contato'}
                </button>
                <button
                    type="button"
                    onClick={onDone}
                    className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </form>
    );
}
