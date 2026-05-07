/**
 * TECHSURPPORT GT - JAVASCRIPT PRINCIPAL
 * Soporte Técnico Profesional en Guatemala
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // ========== ELEMENTOS DEL DOM ==========
    const header = document.getElementById('header');
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    const contactForm = document.getElementById('contactForm');
    const allNavLinks = document.querySelectorAll('.nav-link');
    const allSections = document.querySelectorAll('section[id]');

    // ========== MENÚ MÓVIL ==========
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
            
            // Actualizar atributo de accesibilidad
            const isExpanded = navMenu.classList.contains('active');
            this.setAttribute('aria-expanded', isExpanded);
        });

        // Cerrar menú al hacer clic en un enlace
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
                mobileToggle.setAttribute('aria-expanded', 'false');
            });
        });

        // Cerrar menú al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.nav-container')) {
                navMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
                mobileToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // ========== HEADER SCROLL EFFECT ==========
    window.addEventListener('scroll', function() {
        // Cambiar estilo del header
        if (window.scrollY > 60) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Resaltar enlace activo según la sección visible
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

    // ========== PESTAÑAS DE SERVICIOS ==========
    window.openServiceTab = function(event, tabId) {
        // Desactivar todas las pestañas
        document.querySelectorAll('.service-tab').forEach(tab => {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
        });

        // Ocultar todos los contenidos
        document.querySelectorAll('.service-content').forEach(content => {
            content.classList.remove('active');
        });

        // Activar la pestaña clickeada
        if (event && event.target) {
            event.target.classList.add('active');
            event.target.setAttribute('aria-selected', 'true');
        }

        // Mostrar el contenido correspondiente
        const panel = document.getElementById('panel-' + tabId);
        if (panel) {
            panel.classList.add('active');
        }
    };

    // ========== SCROLL SUAVE ==========
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Solo para enlaces internos que empiezan con #
            if (href && href !== '#' && href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                
                if (target) {
                    const offsetTop = target.offsetTop - 70;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // ========== FORMULARIO DE CONTACTO ==========
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validación básica
            const name = document.getElementById('name')?.value.trim();
            const email = document.getElementById('email')?.value.trim();
            const message = document.getElementById('message')?.value.trim();
            
            if (!name || !email || !message) {
                alert('⚠️ Por favor completa los campos obligatorios marcados con *.');
                return;
            }
            
            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('⚠️ Por favor ingresa un correo electrónico válido.');
                return;
            }
            
            // Simulación de envío exitoso
            const submitBtn = contactForm.querySelector('.btn-submit');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = '⏳ Enviando...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                alert('✅ ¡Solicitud enviada con éxito!\n\nGracias por contactarnos. Un técnico se comunicará contigo en menos de 24 horas para atender tu caso.');
                contactForm.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 1500);
        });
    }

    // ========== ANIMACIONES AL HACER SCROLL ==========
    const animateElements = () => {
        const elements = document.querySelectorAll(`
            .service-card, 
            .mission-card, 
            .why-card, 
            .pricing-table-wrapper,
            .hero-stat
        `);
        
        const observerOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        elements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(25px)';
            el.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            observer.observe(el);
        });
    };

    // Iniciar animaciones
    animateElements();

    // ========== CONTADOR DE ESTADÍSTICAS ==========
    const animateCounters = () => {
        const counters = document.querySelectorAll('[data-counter]');
        
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseInt(counter.getAttribute('data-counter'));
                    const duration = 2000; // 2 segundos
                    const step = target / (duration / 16); // 60 FPS
                    let current = 0;

                    const updateCounter = () => {
                        current += step;
                        if (current < target) {
                            counter.textContent = Math.floor(current) + '+';
                            requestAnimationFrame(updateCounter);
                        } else {
                            counter.textContent = target + '+';
                        }
                    };

                    updateCounter();
                    counterObserver.unobserve(counter);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => {
            counterObserver.observe(counter);
        });
    };

    // Iniciar contadores
    animateCounters();

    // ========== DETECCIÓN DE TEMA DEL SISTEMA ==========
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Puedes agregar soporte para modo oscuro en el futuro
    // prefersDarkScheme.addEventListener('change', (e) => {
    //     if (e.matches) {
    //         // Activar modo oscuro
    //     } else {
    //         // Activar modo claro
    //     }
    // });

    // ========== LOG DE INICIALIZACIÓN ==========
    console.log('✅ TechSupport GT - Sitio web inicializado correctamente');
    console.log('📍 Guatemala - Soporte Técnico Profesional');
    console.log('📅 ' + new Date().getFullYear());
});