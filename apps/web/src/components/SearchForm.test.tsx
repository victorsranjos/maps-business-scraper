import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchForm } from './SearchForm';

describe('SearchForm Component', () => {
    it('should render city and niche inputs', () => {
        // Failing Test: Component does not exist yet Let alone the inputs
        render(<SearchForm onSubmit={vi.fn()} />);
        expect(screen.getByPlaceholderText(/cidade/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/nicho/i)).toBeInTheDocument();
    });

    it('should call onSubmit with correct values when form is submitted', () => {
        const handleSubmit = vi.fn();
        render(<SearchForm onSubmit={handleSubmit} />);

        // Simulate user typing
        const cityInput = screen.getByPlaceholderText(/cidade/i);
        const nicheInput = screen.getByPlaceholderText(/nicho/i);
        const submitButton = screen.getByRole('button', { name: /buscar/i });

        fireEvent.change(cityInput, { target: { value: 'São Paulo' } });
        fireEvent.change(nicheInput, { target: { value: 'Restaurantes' } });
        fireEvent.click(submitButton);

        expect(handleSubmit).toHaveBeenCalledWith({ city: 'São Paulo', niche: 'Restaurantes' });
    });
});
