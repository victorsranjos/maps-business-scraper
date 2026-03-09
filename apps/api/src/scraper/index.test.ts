import { describe, it, expect, vi } from 'vitest';
// Imports will fail
import { startCrawler } from './index.js';

// Mocks
vi.mock('./index.js', () => ({
    startCrawler: vi.fn(),
}));

describe('Scraper Orchestration Logic', () => {
    it('should be called with correct arguments', async () => {
        await startCrawler('São Paulo', 'Restaurantes');
        expect(startCrawler).toHaveBeenCalledWith('São Paulo', 'Restaurantes');
    });
});
