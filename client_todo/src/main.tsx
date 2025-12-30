import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('🚀 Todo App - Starting...');
console.log('📍 Current URL:', window.location.href);

const rootElement = document.getElementById('root');
console.log('🎯 Root element:', rootElement);

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  console.log('✅ App rendered successfully');
} else {
  console.error('❌ Root element not found!');
}
