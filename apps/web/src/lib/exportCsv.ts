import { Lead } from '../components/LeadList';

const CRM_STATUS_LABELS: Record<string, string> = {
    NOVO: 'Novo Lead',
    CONTATADO: 'Tentativa de Contato',
    EM_NUTRICAO: 'Em Nutrição',
    RESPOSTA_RECEBIDA: 'Resposta Recebida',
    REUNIAO_AGENDADA: 'Reunião Agendada',
    PROPOSTA_ENVIADA: 'Proposta Enviada',
    NEGOCIACAO: 'Em Negociação',
    CLIENTE_GANHO: 'Cliente Ganho',
    CLIENTE_PERDIDO: 'Cliente Perdido',
    DESCARTADO: 'Descartado',
};

/** Wraps a CSV cell value in double quotes and escapes internal quotes. */
function escapeCell(value: string | undefined | null): string {
    if (value == null) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
}

export function exportLeadsToCsv(leads: Lead[], filename?: string) {
    const headers = [
        'Nome',
        'Nicho',
        'Cidade',
        'Status',
        'Telefone',
        'Website',
        'E-mail',
        'Instagram',
        'Facebook',
        'LinkedIn',
        'Gaps', // empty placeholder column for manual notes
    ];

    const rows = leads.map((lead) => [
        escapeCell(lead.name),
        escapeCell(lead.niche),
        escapeCell(lead.city),
        escapeCell(CRM_STATUS_LABELS[lead.status ?? 'NOVO'] ?? lead.status),
        escapeCell(lead.phone),
        escapeCell(lead.website),
        escapeCell(lead.email),
        escapeCell(lead.instagram),
        escapeCell(lead.facebook),
        escapeCell(lead.linkedin),
        '""', // Gaps — empty, for manual annotation
    ]);

    const csvContent = [
        headers.map(escapeCell).join(','),
        ...rows.map((row) => row.join(',')),
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const date = new Date().toISOString().slice(0, 10);
    link.download = filename ?? `leads-${date}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
