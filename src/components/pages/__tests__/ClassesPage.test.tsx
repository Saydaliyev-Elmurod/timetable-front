import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ClassesPage from '../ClassesPage';
import { apiCall } from '../../../lib/api';

vi.mock('../../lib/api', () => ({
  apiCall: vi.fn(),
}));

test('renders ClassesPage', () => {
  (apiCall as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { content: [] } });
  render(<ClassesPage />);
  const addButton = screen.getByText(/Add Class/i);
  expect(addButton).toBeTruthy();
});
