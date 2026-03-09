import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LeadList } from './LeadList';

describe('LeadList Component', () => {
    it('should render a list of leads', () => {
        const mockLeads = [
            { _id: '1', name: 'Pizza Show', niche: 'Pizzaria', city: 'São Paulo', email: 'contato@pizzashow.com', phone: '11999999999', website: 'pizzashow.com', instagram: '@pizzashow' }
        ];

        // Failing test: Component and mocked useQuery not yet implemented
        render(<LeadList leads={mockLeads} loading={false} />);

        expect(screen.getByText('Pizza Show')).toBeInTheDocument();
        expect(screen.getByText('Pizzaria')).toBeInTheDocument();
        expect(screen.getByText('contato@pizzashow.com')).toBeInTheDocument();
    });

    it('should render a loading state when data is being fetched', () => {
        render(<LeadList leads={[]} loading={true} />);
        expect(screen.getByText(/carregando/i)).toBeInTheDocument();
    });
});
