// Inject Tailwind config directly to customize the CDN build
tailwind.config = {
  theme: {
    extend: {
      colors: {
        background: '#0f172a',
        surface: '#1e293b',
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        accent: '#10b981',
        danger: '#ef4444',
        textMain: '#f8fafc',
        textMuted: '#94a3b8'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      }
    }
  }
}

// Reusable Utilities Logic
const BASE_URL = ''; // using relative paths since API is on same origin

// Check Auth state immediately
const checkAuth = () => {
  const token = localStorage.getItem('token');
  const path = window.location.pathname;
  const isAuthPage = path.includes('login.html') || path.includes('register.html');

  if (!token && !isAuthPage) {
    window.location.href = '/login.html';
  } else if (token && isAuthPage) {
    window.location.href = '/index.html';
  }
};
checkAuth();

// Logout
const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login.html';
};
