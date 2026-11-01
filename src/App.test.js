import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the calculator', () => {
  render(<App />);
  expect(screen.getByRole('heading', { level: 1, name: /UWaterloo GPA Calculator/i })).toBeInTheDocument();
  expect(screen.getByText(/Drop your transcript PDF here/i)).toBeInTheDocument();
});
