import { render, screen } from '@testing-library/react'

import App from './App'

describe('App', () => {
  it('renders the project baseline heading', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: '书签清理与归档器' }),
    ).toBeInTheDocument()
    expect(screen.getByText('React + TypeScript + Vite')).toBeInTheDocument()
  })
})
