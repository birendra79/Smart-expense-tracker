// Define sidebar injection logic
document.addEventListener('DOMContentLoaded', () => {
  const sidebarContainer = document.getElementById('sidebar-container');
  if (!sidebarContainer) return;

  const currentPath = window.location.pathname;
  
  const links = [
    { name: 'Dashboard', path: '/index.html', icon: '<i data-lucide="layout-dashboard"></i>' },
    { name: 'Add Expense', path: '/add-expense.html', icon: '<i data-lucide="plus-circle"></i>' },
    { name: 'Reports', path: '/reports.html', icon: '<i data-lucide="file-text"></i>' },
    { name: 'Budget Config', path: '/budget.html', icon: '<i data-lucide="calculator"></i>' },
    { name: 'Settings', path: '/settings.html', icon: '<i data-lucide="settings"></i>' }
  ];

  const linkElements = links.map(link => {
    // Treat '/' as '/index.html'
    const isActive = currentPath === link.path || (currentPath === '/' && link.path === '/index.html');
    return `
      <li>
        <a href="${link.path}" class="relative px-4 py-3 flex items-center gap-3 rounded-xl transition-colors ${isActive ? 'text-white font-medium bg-white/10' : 'text-textMuted hover:text-white hover:bg-white/5'}">
          <span class="${isActive ? 'text-primary' : ''}">${link.icon}</span>
          ${link.name}
        </a>
      </li>
    `;
  }).join('');

  sidebarContainer.innerHTML = `
    <div class="w-64 bg-surface/80 backdrop-blur-md border border-white/10 shadow-xl rounded-r-2xl flex flex-col h-full z-10 shrink-0">
      <div class="p-6">
        <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          SmartTracker
        </h1>
      </div>
      <nav class="flex-1 mt-6">
        <ul class="space-y-2 px-4">
          ${linkElements}
        </ul>
      </nav>
      <div class="p-4 border-t border-white/10">
        <button onclick="logout()" class="w-full flex items-center gap-3 px-4 py-3 text-danger hover:bg-danger/10 rounded-xl transition-colors">
          <i data-lucide="log-out"></i>
          <span>Logout</span>
        </button>
      </div>
    </div>
  `;

  // Initialize lucide icons if loaded
  if (window.lucide) {
    lucide.createIcons();
  }
});
