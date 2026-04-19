// Main dashboard application logic
import { getCurrentUser, logoutUser } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
        // Not logged in – redirect to login
        window.location.href = 'index.html';
        return;
    }

    // Setup UI based on user role
    setupUserInterface(user);

    // Setup sidebar toggle for mobile
    setupSidebarToggle();

    // Setup navigation links
    setupNavigation();

    // Setup user dropdown
    setupUserDropdown();

    // Setup logout
    document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await logoutUser();
    });
});

function setupUserInterface(user) {
    // Display user email
    const emailDisplay = document.getElementById('userEmailDisplay');
    if (emailDisplay) emailDisplay.textContent = user.email;

    // Display user name if available
    const nameDisplay = document.getElementById('userNameDisplay');
    if (nameDisplay) nameDisplay.textContent = user.name || user.email.split('@')[0];

    // Display role badge
    const roleBadge = document.getElementById('userRoleBadge');
    if (roleBadge) {
        roleBadge.textContent = user.role === 'admin' ? 'Admin' : 'Employee';
        roleBadge.className = user.role === 'admin' 
            ? 'px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800'
            : 'px-3 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800';
    }

    // Show/hide admin section based on role
    const adminSection = document.getElementById('adminSection');
    if (adminSection) {
        if (user.role === 'admin') {
            adminSection.classList.remove('hidden');
        } else {
            adminSection.classList.add('hidden');
        }
    }

    // Optionally hide admin-only buttons inside pages
    window.currentUser = user; // Make available globally
}

function setupSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    const openBtn = document.getElementById('openSidebarBtn');
    const closeBtn = document.getElementById('closeSidebarBtn');

    function openSidebar() {
        sidebar.classList.remove('-translate-x-full');
        backdrop.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        sidebar.classList.add('-translate-x-full');
        backdrop.classList.add('hidden');
        document.body.style.overflow = '';
    }

    openBtn?.addEventListener('click', openSidebar);
    closeBtn?.addEventListener('click', closeSidebar);
    backdrop?.addEventListener('click', closeSidebar);

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) {
            closeSidebar();
        }
    });
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const contentFrame = document.getElementById('contentFrame');
    const pageTitle = document.getElementById('pageTitle');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const page = link.dataset.page;
            if (page && contentFrame) {
                const pageFile = getPageFile(page);
                contentFrame.src = `pages/${pageFile}`;

                if (pageTitle) {
                    pageTitle.textContent = link.textContent.trim() || 'Dashboard';
                }

                if (window.innerWidth < 1024) {
                    document.getElementById('closeSidebarBtn')?.click();
                }
            }
        });
    });

    // Set initial active link
    const currentSrc = contentFrame?.src;
    if (currentSrc) {
        const pageName = currentSrc.split('/').pop().replace('.html', '');
        const activeLink = Array.from(navLinks).find(link => link.dataset.page === pageName);
        if (activeLink) activeLink.classList.add('active');
        else {
            const overviewLink = Array.from(navLinks).find(link => link.dataset.page === 'dashboard-overview');
            if (overviewLink) overviewLink.classList.add('active');
        }
    }
}

function getPageFile(page) {
    const map = {
        'dashboard-overview': 'dashboard-overview.html',
        'employees': 'employees.html',
        'payroll': 'payroll.html',
        'invoices': 'invoices.html',
        'inventory': 'inventory.html',
        'financials': 'financials.html',
        'reports': 'reports.html',
        'chart-of-accounts': 'chart-of-accounts.html',
        'admin': 'admin.html'
    };
    return map[page] || 'dashboard-overview.html';
}

function setupUserDropdown() {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');

    userMenuBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown?.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!userMenuBtn?.contains(e.target) && !userDropdown?.contains(e.target)) {
            userDropdown?.classList.add('hidden');
        }
    });
}