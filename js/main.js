/**
 * ALIADO TECNOLÓGICO - JAVASCRIPT PRINCIPAL
 * Soporte Técnico Profesional en Guatemala
 * Email: aliadotecnologico.gt@gmail.com
 * Google Apps Script: CONFIGURADO ✅
 */

// ⚡ CONFIGURACIÓN
const CONFIG = {
    adminEmail: localStorage.getItem('adminEmail') || 'aliadotecnologico.gt@gmail.com',
    googleScriptUrl: 'https://script.google.com/macros/s/AKfycbyT9WUctKAnSn8osd2G0wZdDmIOIs126icMGrEFPfbA-H34j89zL288gnMHr3SeNRRk/exec',
    companyName: 'Aliado Tecnológico',
    whatsappNumber: '502XXXXXXXX'
};

console.log('✅ Aliado Tecnológico - Sistema configurado');
console.log('📧 Email notificaciones:', CONFIG.adminEmail);
console.log('🔗 Google Script conectado');

// =============================================
// BASE DE DATOS LOCAL
// =============================================
class Database {
    static getTickets() {
        try {
            return JSON.parse(localStorage.getItem('tickets') || '[]');
        } catch (e) {
            console.error('Error al leer tickets:', e);
            return [];
        }
    }
    
    static saveTickets(tickets) {
        try {
            localStorage.setItem('tickets', JSON.stringify(tickets));
        } catch (e) {
            console.error('Error al guardar tickets:', e);
        }
    }
    
    static addTicket(ticket) {
        const tickets = this.getTickets();
        ticket.id = 'TK-' + Date.now();
        ticket.createdAt = new Date().toISOString();
        ticket.status = 'pending';
        tickets.push(ticket);
        this.saveTickets(tickets);
        
        // Enviar email de notificación
        this.sendEmailNotification(ticket);
        
        return ticket;
    }
    
    static updateTicket(id, updates) {
        const tickets = this.getTickets();
        const index = tickets.findIndex(t => t.id === id);
        if (index !== -1) {
            tickets[index] = { ...tickets[index], ...updates, updatedAt: new Date().toISOString() };
            this.saveTickets(tickets);
            return tickets[index];
        }
        return null;
    }
    
    static getClients() {
        const tickets = this.getTickets();
        const clients = {};
        tickets.forEach(t => {
            const key = t.email || t.phone || t.name;
            if (!clients[key]) {
                clients[key] = { 
                    name: t.name, 
                    email: t.email, 
                    phone: t.phone, 
                    tickets: 0, 
                    lastContact: t.createdAt 
                };
            }
            clients[key].tickets++;
            if (t.createdAt > clients[key].lastContact) {
                clients[key].lastContact = t.createdAt;
            }
        });
        return Object.values(clients);
    }
    
    static getStats() {
        const tickets = this.getTickets();
        return {
            total: tickets.length,
            resolved: tickets.filter(t => t.status === 'resolved').length,
            pending: tickets.filter(t => t.status === 'pending').length,
            clients: this.getClients().length
        };
    }
    
    static async sendEmailNotification(ticket) {
        const adminEmail = localStorage.getItem('adminEmail') || CONFIG.adminEmail;
        
        console.log('📧 Enviando notificación de nueva solicitud...');
        console.log('📋 Ticket:', ticket.id);
        console.log('👤 Cliente:', ticket.name);
        console.log('📧 Destino:', adminEmail);
        
        // Datos para enviar al script
        const formData = new FormData();
        formData.append('adminEmail', adminEmail);
        formData.append('ticketId', ticket.id);
        formData.append('name', ticket.name);
        formData.append('email', ticket.email || '');
        formData.append('phone', ticket.phone || '');
        formData.append('service', ticket.service);
        formData.append('description', ticket.description);
        formData.append('priority', ticket.priority);
        formData.append('date', new Date(ticket.createdAt).toLocaleString('es-GT'));
        formData.append('source', ticket.source || 'web');
        formData.append('company', CONFIG.companyName);
        
        try {
            console.log('📤 Enviando datos al Google Script...');
            
            const response = await fetch(CONFIG.googleScriptUrl, {
                method: 'POST',
                body: formData
            });
            
            const text = await response.text();
            console.log('📥 Respuesta del servidor:', text);
            
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                // Si no es JSON, probablemente fue exitoso
                console.log('✅ Respuesta recibida (no JSON):', text.substring(0, 100));
                return true;
            }
            
            if (result.success) {
                console.log('✅ Email enviado exitosamente');
                console.log('📨 Mensaje:', result.message);
                return true;
            } else {
                console.error('❌ Error del servidor:', result.error);
                // Respaldo: abrir Gmail
                this.openGmailCompose(ticket, adminEmail);
                return false;
            }
            
        } catch (error) {
            console.error('❌ Error de conexión:', error.message);
            console.log('🔄 Usando método alternativo (Gmail)...');
            // Respaldo: abrir Gmail
            this.openGmailCompose(ticket, adminEmail);
            return false;
        }
    }
    
    static openGmailCompose(ticket, emailTo) {
        const subject = encodeURIComponent(
            `Nueva Solicitud: ${ticket.service} - ${ticket.name} [${ticket.id}]`
        );
        
        const body = encodeURIComponent(
            `🔔 NUEVA SOLICITUD DE SOPORTE TÉCNICO\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `📋 ID DE SEGUIMIENTO: ${ticket.id}\n\n` +
            `👤 DATOS DEL CLIENTE:\n` +
            `   • Nombre: ${ticket.name}\n` +
            `   • Email: ${ticket.email || 'No proporcionado'}\n` +
            `   • Teléfono: ${ticket.phone || 'No proporcionado'}\n\n` +
            `🔧 DETALLES DEL SERVICIO:\n` +
            `   • Tipo: ${ticket.service}\n` +
            `   • Prioridad: ${ticket.priority}\n` +
            `   • Fecha: ${new Date(ticket.createdAt).toLocaleString('es-GT')}\n\n` +
            `📝 DESCRIPCIÓN DEL PROBLEMA:\n` +
            `${ticket.description}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Aliado Tecnológico - Guatemala\n` +
            `📧 aliadotecnologico.gt@gmail.com\n` +
            `📞 +502 XXXXXXXX`
        );
        
        // Intentar abrir Gmail
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${emailTo}&su=${subject}&body=${body}`;
        const opened = window.open(gmailUrl, '_blank');
        
        if (!opened) {
            // Si el popup fue bloqueado, usar mailto:
            window.location.href = `mailto:${emailTo}?subject=${subject}&body=${body}`;
        }
        
        console.log('✅ Cliente de correo abierto');
    }
}

// =============================================
// SITIO PÚBLICO
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    const header = document.getElementById('header');
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    const allNavLinks = document.querySelectorAll('.nav-link');
    const allSections = document.querySelectorAll('section[id]');

    // Menú móvil
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
            const isExpanded = navMenu.classList.contains('active');
            this.setAttribute('aria-expanded', isExpanded);
        });

        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
                mobileToggle.setAttribute('aria-expanded', 'false');
            });
        });

        document.addEventListener('click', function(e) {
            if (!e.target.closest('.nav-container')) {
                navMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
                mobileToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Header scroll
    window.addEventListener('scroll', function() {
        if (window.scrollY > 60) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        let currentSection = '';
        allSections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });

        allNavLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href && href.substring(1) === currentSection) {
                link.classList.add('active');
            }
        });
    });

    // Scroll suave
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href !== '#' && href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const offsetTop = target.offsetTop - 70;
                    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                }
            }
        });
    });

    // Animaciones al scroll
    const animateElements = () => {
        const elements = document.querySelectorAll('.service-card, .mission-card, .why-card, .pricing-table-wrapper, .hero-stat');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

        elements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(25px)';
            el.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            observer.observe(el);
        });
    };
    animateElements();

    // Contadores
    const animateCounters = () => {
        const counters = document.querySelectorAll('[data-counter]');
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseInt(counter.getAttribute('data-counter'));
                    const duration = 2000;
                    const step = target / (duration / 16);
                    let current = 0;
                    const updateCounter = () => {
                        current += step;
                        if (current < target) {
                            counter.textContent = Math.floor(current);
                            requestAnimationFrame(updateCounter);
                        } else {
                            counter.textContent = target;
                        }
                    };
                    updateCounter();
                    counterObserver.unobserve(counter);
                }
            });
        }, { threshold: 0.5 });
        counters.forEach(counter => counterObserver.observe(counter));
    };
    animateCounters();

    // Actualizar contador de clientes
    updateHeroClientCount();
    
    console.log('✅ Aliado Tecnológico - Sistema inicializado');
    console.log('📧 Correo configurado:', CONFIG.adminEmail);
    console.log('🔐 Panel Admin: Presiona Ctrl+Shift+A o escribe adminAccess() en consola');
});

// Pestañas de servicios
window.openServiceTab = function(event, tabId) {
    document.querySelectorAll('.service-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.service-content').forEach(content => {
        content.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
        event.target.setAttribute('aria-selected', 'true');
    }
    const panel = document.getElementById('panel-' + tabId);
    if (panel) panel.classList.add('active');
};

// Formulario de contacto público
function handleContactSubmit(event) {
    event.preventDefault();
    
    const ticket = {
        name: document.getElementById('contactName').value.trim(),
        phone: document.getElementById('contactPhone').value.trim(),
        email: document.getElementById('contactEmail').value.trim(),
        service: document.getElementById('contactService').value || 'No especificado',
        description: document.getElementById('contactMessage').value.trim(),
        priority: 'media',
        source: 'web'
    };
    
    // Validación
    if (!ticket.name || !ticket.email || !ticket.description) {
        alert('⚠️ Por favor completa los campos obligatorios marcados con *.');
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ticket.email)) {
        alert('⚠️ Por favor ingresa un correo electrónico válido.');
        return false;
    }
    
    const savedTicket = Database.addTicket(ticket);
    
    const submitBtn = event.target.querySelector('.btn-submit');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Enviando...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        alert('✅ ¡Solicitud enviada con éxito!\n\nID: ' + savedTicket.id);
        event.target.reset();
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        updateHeroClientCount();
    }, 1500);
    
    return false;
}

function updateHeroClientCount() {
    const stats = Database.getStats();
    const counter = document.getElementById('heroClientCount');
    if (counter) {
        counter.setAttribute('data-counter', stats.clients);
        counter.textContent = stats.clients;
    }
}

// =============================================
// ACCESO AL PANEL ADMIN (OCULTO)
// =============================================

window.adminAccess = function() {
    openLoginModal();
    console.log('🔐 Panel de administración abierto');
};

if (window.location.hash === '#admin' || window.location.hash === '#admin-panel') {
    setTimeout(openLoginModal, 500);
}

let logoClicks = 0;
const secretLogo = document.getElementById('secretLogo');
if (secretLogo) {
    secretLogo.addEventListener('click', function(e) {
        logoClicks++;
        if (logoClicks >= 5) {
            logoClicks = 0;
            openLoginModal();
        }
        setTimeout(() => { logoClicks = 0; }, 2000);
    });
}

document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        openLoginModal();
    }
});

// =============================================
// AUTENTICACIÓN
// =============================================

const USERS = {
    admin: { username: 'admin', password: 'admin123', role: 'admin', name: 'Administrador', avatar: '👨‍💼' },
    support: { username: 'soporte', password: 'soporte123', role: 'support', name: 'Soporte Técnico', avatar: '🔧' },
    manager: { username: 'gestor', password: 'gestor123', role: 'manager', name: 'Gestor', avatar: '📋' }
};

let currentUser = null;

function openLoginModal() {
    document.getElementById('loginModal').classList.add('active');
    document.getElementById('globalOverlay').classList.add('active');
    document.getElementById('loginError').style.display = 'none';
}

function handleLogin(event) {
    event.preventDefault();
    
    const role = document.getElementById('loginRole').value;
    const username = document.getElementById('loginUser').value;
    const password = document.getElementById('loginPass').value;
    
    const user = USERS[role];
    
    if (user && user.username === username && user.password === password) {
        currentUser = user;
        showAdminPanel();
        closeModal('loginModal');
        document.getElementById('loginForm').reset();
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
    
    return false;
}

function showAdminPanel() {
    document.getElementById('publicSite').style.display = 'none';
    document.getElementById('publicFooter').style.display = 'none';
    document.getElementById('header').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    
    const whatsappFloat = document.querySelector('.whatsapp-float');
    if (whatsappFloat) whatsappFloat.style.display = 'none';
    
    document.getElementById('adminName').textContent = currentUser.name;
    document.getElementById('adminRole').textContent = currentUser.role === 'admin' ? 'Administrador' : 
                                                     currentUser.role === 'support' ? 'Soporte' : 'Gestor';
    document.getElementById('adminAvatar').textContent = currentUser.avatar;
    
    document.querySelectorAll('.admin-role-admin').forEach(el => {
        el.style.display = currentUser.role === 'admin' ? 'flex' : 'none';
    });
    
    navigateAdmin('overview');
    updateAdminClock();
    setInterval(updateAdminClock, 1000);
    
    const savedEmail = localStorage.getItem('adminEmail');
    if (savedEmail && document.getElementById('adminEmail')) {
        document.getElementById('adminEmail').value = savedEmail;
    } else if (document.getElementById('adminEmail')) {
        document.getElementById('adminEmail').value = CONFIG.adminEmail;
    }
    
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            navigateAdmin(this.getAttribute('data-section'));
        });
    });
}

function showPublicSite() {
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('publicSite').style.display = 'block';
    document.getElementById('publicFooter').style.display = 'block';
    document.getElementById('header').style.display = 'block';
    
    const whatsappFloat = document.querySelector('.whatsapp-float');
    if (whatsappFloat) whatsappFloat.style.display = 'flex';
    
    currentUser = null;
    updateHeroClientCount();
}

function logoutAdmin() {
    if (confirm('¿Cerrar sesión?')) showPublicSite();
}

function navigateAdmin(section) {
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === section) item.classList.add('active');
    });
    
    document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById('sec-' + section).classList.add('active');
    
    const titles = {
        overview: '📊 Dashboard',
        tickets: '🎫 Gestión de Solicitudes',
        clients: '👥 Clientes',
        'services-mgmt': '🔧 Gestión de Servicios',
        reports: '📈 Reportes',
        settings: '⚙️ Configuración'
    };
    document.getElementById('adminTitle').textContent = titles[section] || section;
    
    switch(section) {
        case 'overview': loadDashboard(); break;
        case 'tickets': refreshTickets(); break;
        case 'clients': loadClients(); break;
        case 'reports': loadReports(); break;
    }
}

// =============================================
// DASHBOARD
// =============================================

function loadDashboard() {
    const stats = Database.getStats();
    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statResolved').textContent = stats.resolved;
    document.getElementById('statPending').textContent = stats.pending;
    document.getElementById('statClients').textContent = stats.clients;
    
    const tickets = Database.getTickets();
    const recent = tickets.slice(-5).reverse();
    document.getElementById('recentTickets').innerHTML = recent.map(t => `
        <div style="padding:0.5rem 0;border-bottom:1px solid rgba(255,255,255,0.05);">
            <strong style="color:var(--neon-cyan);">${t.id}</strong> - ${t.name}<br>
            <small style="color:var(--gray);">${t.service} | ${new Date(t.createdAt).toLocaleDateString()}</small>
            <span class="badge badge-${t.status}">${t.status}</span>
        </div>
    `).join('') || '<p style="color:var(--gray);">No hay solicitudes aún</p>';
    
    const services = {};
    tickets.forEach(t => { services[t.service] = (services[t.service] || 0) + 1; });
    document.getElementById('popularServices').innerHTML = Object.entries(services)
        .sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([service, count]) => `
            <div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                <span>${service}</span><strong style="color:var(--neon-cyan);">${count}</strong>
            </div>
        `).join('') || '<p style="color:var(--gray);">Sin datos</p>';
    
    document.getElementById('badgePending').textContent = stats.pending;
}

// =============================================
// TICKETS
// =============================================

function refreshTickets() {
    let tickets = Database.getTickets();
    const status = document.getElementById('filterStatus').value;
    const priority = document.getElementById('filterPriority').value;
    const search = document.getElementById('searchTicket').value.toLowerCase();
    
    if (status !== 'all') tickets = tickets.filter(t => t.status === status);
    if (priority !== 'all') tickets = tickets.filter(t => t.priority === priority);
    if (search) tickets = tickets.filter(t => 
        t.name.toLowerCase().includes(search) || 
        t.id.toLowerCase().includes(search) || 
        t.service.toLowerCase().includes(search)
    );
    
    tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    document.getElementById('ticketsBody').innerHTML = tickets.map(t => `
        <tr>
            <td><strong style="color:var(--neon-cyan);">${t.id}</strong></td>
            <td>${t.name}<br><small style="color:var(--gray);">${t.email || ''}</small></td>
            <td>${t.service}</td>
            <td><span class="badge badge-${t.priority}">${t.priority}</span></td>
            <td><span class="badge badge-${t.status}">${t.status}</span></td>
            <td>${new Date(t.createdAt).toLocaleDateString('es-GT')}</td>
            <td>
                <button class="btn btn-primary" style="padding:0.3rem 0.7rem;font-size:0.8rem;" onclick="editTicket('${t.id}')">✏️</button>
                ${t.status !== 'resolved' ? `<button class="btn btn-outline" style="padding:0.3rem 0.7rem;font-size:0.8rem;" onclick="resolveTicket('${t.id}')">✅</button>` : ''}
                <button class="btn btn-primary" style="padding:0.3rem 0.7rem;font-size:0.8rem;background:var(--danger);" onclick="deleteTicket('${t.id}')">🗑️</button>
            </td>
        </tr>
    `).join('');
    
    document.getElementById('badgePending').textContent = Database.getStats().pending;
}

function handleTicketSubmit(event) {
    event.preventDefault();
    Database.addTicket({
        name: document.getElementById('tName').value,
        phone: document.getElementById('tPhone').value,
        email: document.getElementById('tEmail').value,
        service: document.getElementById('tService').value,
        description: document.getElementById('tDesc').value,
        priority: document.getElementById('tPriority').value,
        source: 'admin'
    });
    closeModal('ticketModal');
    refreshTickets();
    loadDashboard();
    event.target.reset();
    return false;
}

function resolveTicket(id) {
    if (confirm('¿Marcar como resuelta?')) {
        Database.updateTicket(id, { status: 'resolved' });
        refreshTickets();
        loadDashboard();
    }
}

function editTicket(id) {
    const tickets = Database.getTickets();
    const ticket = tickets.find(t => t.id === id);
    if (ticket) {
        const newStatus = prompt('Nuevo estado (pending/in-progress/resolved):', ticket.status);
        if (newStatus && ['pending', 'in-progress', 'resolved'].includes(newStatus)) {
            Database.updateTicket(id, { status: newStatus });
            refreshTickets();
            loadDashboard();
        }
    }
}

function deleteTicket(id) {
    if (confirm('¿Eliminar esta solicitud?')) {
        const tickets = Database.getTickets().filter(t => t.id !== id);
        Database.saveTickets(tickets);
        refreshTickets();
        loadDashboard();
    }
}

// =============================================
// CLIENTES
// =============================================

function loadClients() {
    const clients = Database.getClients();
    document.getElementById('clientsBody').innerHTML = clients.map(c => `
        <tr>
            <td><strong>${c.name}</strong></td>
            <td>${c.email || '-'}</td>
            <td>${c.phone || '-'}</td>
            <td style="color:var(--neon-cyan);font-weight:700;">${c.tickets}</td>
            <td>${new Date(c.lastContact).toLocaleDateString('es-GT')}</td>
        </tr>
    `).join('');
}

// =============================================
// REPORTES
// =============================================

function loadReports() {
    const tickets = Database.getTickets();
    const statusCount = {
        pending: tickets.filter(t => t.status === 'pending').length,
        'in-progress': tickets.filter(t => t.status === 'in-progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length
    };
    
    document.getElementById('reportStatus').innerHTML = Object.entries(statusCount).map(([status, count]) => `
        <div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid rgba(255,255,255,0.05);">
            <span><span class="badge badge-${status}">${status}</span></span>
            <strong style="color:var(--neon-cyan);">${count}</strong>
        </div>
    `).join('');
    
    const monthlyCount = {};
    tickets.forEach(t => {
        const month = new Date(t.createdAt).toLocaleString('es-GT', { month: 'long', year: 'numeric' });
        monthlyCount[month] = (monthlyCount[month] || 0) + 1;
    });
    
    document.getElementById('reportMonth').innerHTML = Object.entries(monthlyCount)
        .sort((a, b) => b[1] - a[1])
        .map(([month, count]) => `
            <div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                <span>${month}</span><strong style="color:var(--neon-cyan);">${count}</strong>
            </div>
        `).join('') || '<p style="color:var(--gray);">Sin datos</p>';
}

// =============================================
// EXPORTAR A EXCEL
// =============================================

function exportToCSV() {
    const tickets = Database.getTickets();
    if (tickets.length === 0) { alert('No hay datos para exportar'); return; }
    
    const headers = ['ID', 'Cliente', 'Email', 'Teléfono', 'Servicio', 'Descripción', 'Prioridad', 'Estado', 'Fecha'];
    const rows = tickets.map(t => [
        t.id, t.name, t.email || '', t.phone || '', t.service, 
        t.description.replace(/"/g, '""'), t.priority, t.status, 
        new Date(t.createdAt).toLocaleString('es-GT')
    ]);
    
    let csv = '\uFEFF' + headers.join(',') + '\n';
    rows.forEach(row => { csv += row.map(f => `"${f}"`).join(',') + '\n'; });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `solicitudes_aliado_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// =============================================
// RESPALDO Y RESTAURACIÓN
// =============================================

function backupData() {
    const data = {
        tickets: Database.getTickets(),
        config: {
            adminEmail: localStorage.getItem('adminEmail') || CONFIG.adminEmail,
            prices: {
                diagnostico: document.getElementById('priceDiag')?.value || 50,
                mantenimiento: document.getElementById('priceMant')?.value || 100,
                formateo: document.getElementById('priceForm')?.value || 150
            }
        },
        exportDate: new Date().toISOString(),
        version: '3.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup_aliado_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function restoreData(input) {
    const file = input.files[0];
    if (!file) return;
    
    if (confirm('⚠️ Esto reemplazará todos los datos actuales. ¿Continuar?')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                Database.saveTickets(data.tickets || []);
                if (data.config) {
                    if (data.config.adminEmail) localStorage.setItem('adminEmail', data.config.adminEmail);
                    if (data.config.prices) {
                        if (document.getElementById('priceDiag')) document.getElementById('priceDiag').value = data.config.prices.diagnostico || 50;
                        if (document.getElementById('priceMant')) document.getElementById('priceMant').value = data.config.prices.mantenimiento || 100;
                        if (document.getElementById('priceForm')) document.getElementById('priceForm').value = data.config.prices.formateo || 150;
                    }
                }
                alert('✅ Datos restaurados correctamente');
                loadDashboard();
                refreshTickets();
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
}

function clearAllData() {
    if (confirm('⚠️ ¿Eliminar TODOS los datos?')) {
        if (confirm('¿Estás COMPLETAMENTE seguro?')) {
            localStorage.removeItem('tickets');
            localStorage.removeItem('adminEmail');
            localStorage.removeItem('prices');
            alert('✅ Datos eliminados');
            loadDashboard();
            refreshTickets();
        }
    }
}

function savePrices() {
    localStorage.setItem('prices', JSON.stringify({
        diagnostico: document.getElementById('priceDiag').value,
        mantenimiento: document.getElementById('priceMant').value,
        formateo: document.getElementById('priceForm').value
    }));
    alert('✅ Precios guardados');
}

function saveEmailConfig() {
    const email = document.getElementById('adminEmail').value.trim();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        localStorage.setItem('adminEmail', email);
        CONFIG.adminEmail = email;
        alert('✅ Email configurado: ' + email);
    } else {
        alert('⚠️ Ingresa un email válido');
    }
}

// =============================================
// MODALES
// =============================================

function openModal(id) {
    document.getElementById(id).classList.add('active');
    document.getElementById('globalOverlay').classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    document.getElementById('globalOverlay').classList.remove('active');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    document.getElementById('globalOverlay').classList.remove('active');
}

// =============================================
// UTILIDADES
// =============================================

function toggleSidebar() {
    document.getElementById('adminSidebar').classList.toggle('open');
}

function toggleTheme() {
    document.documentElement.setAttribute('data-theme', 
        document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    );
}

function updateAdminClock() {
    const el = document.getElementById('adminClock');
    if (el) el.textContent = new Date().toLocaleTimeString('es-GT', { 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ ALIADO TECNOLÓGICO CONFIGURADO');
console.log('📧 Email:', CONFIG.adminEmail);
console.log('🔗 Script:', CONFIG.googleScriptUrl);
console.log('👤 Admin: admin / admin123');
console.log('🔐 Acceso: Ctrl+Shift+A');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');