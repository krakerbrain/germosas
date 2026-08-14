/**
 * Germosas & Agendarium Dynamic Site Loader
 * Carga automáticamente la configuración desde data/empresa.json
 * y actualiza dinámicamente el contenido del sitio web.
 */

document.addEventListener('DOMContentLoaded', () => {
    loadCompanyData();
});

async function loadCompanyData() {
    try {
        const response = await fetch('data/empresa.json?t=' + new Date().getTime());
        if (!response.ok) {
            console.log('[SiteLoader] data/empresa.json aún no existe o no se pudo cargar. Usando contenido por defecto.');
            return;
        }

        const data = await response.json();
        console.log('[SiteLoader] Datos cargados exitosamente:', data);

        renderEmpresa(data);
        renderHero(data);
        renderServices(data);
        renderTeam(data);
        renderTestimonials(data);
        renderAbout(data);
        renderContactAndFooter(data);

    } catch (err) {
        console.warn('[SiteLoader] No se pudo cargar data/empresa.json:', err);
    }
}

// 1. Datos Generales de la Empresa
function renderEmpresa(data) {
    const empresa = data.empresa || data;
    if (!empresa) return;

    if (empresa.nombre) {
        document.title = `${empresa.nombre} - ${empresa.subtitulo || 'Nail & Beauty Salon'}`;
    }

    if (empresa.logo) {
        const logos = document.querySelectorAll('.nav-logo img, .footer-logo, .logo');
        logos.forEach(img => {
            img.src = empresa.logo;
            img.alt = empresa.nombre || 'Logo';
        });
    }
}

// 2. Sección Hero
function renderHero(data) {
    const hero = data.hero;
    const empresa = data.empresa || data;
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const heroBtn = document.querySelector('.hero-content .btn');
    const heroImg = document.querySelector('.hero-img');

    if (hero) {
        if (heroTitle && hero.titulo_linea1) {
            heroTitle.innerHTML = `${hero.titulo_linea1}<br><span>${hero.titulo_linea2 || ''}</span>`;
        }
        if (heroSubtitle && hero.subtitulo) {
            heroSubtitle.textContent = hero.subtitulo;
        }
        if (heroBtn && hero.texto_boton) {
            heroBtn.textContent = hero.texto_boton;
        }
        if (heroImg && hero.imagen_principal) {
            heroImg.src = hero.imagen_principal;
        }
    } else if (empresa && heroTitle) {
        if (empresa.nombre) {
            heroTitle.innerHTML = `${empresa.nombre}<br><span>${empresa.subtitulo || ''}</span>`;
        }
        if (empresa.slogan && heroSubtitle) {
            heroSubtitle.textContent = empresa.slogan;
        }
    }
}

// 3. Sección Servicios Dinámica
function renderServices(data) {
    const services = data.servicios || data.services;
    const servicesGrid = document.querySelector('.services-grid');
    if (!services || !Array.isArray(services) || services.length === 0 || !servicesGrid) return;

    servicesGrid.innerHTML = '';

    services.forEach(srv => {
        const card = document.createElement('div');
        card.className = 'service-card';

        const name = srv.nombre || srv.name || 'Servicio';
        const desc = srv.descripcion || srv.description || '';
        const img = srv.imagen || srv.image;
        const icon = srv.icono || srv.icon || '💅';
        const price = srv.precio ? `<span class="service-price" style="display:block; margin-top:8px; font-weight:600; color:var(--text-dark); font-size:0.9rem;">$${Number(srv.precio).toLocaleString('es-CL')}</span>` : '';

        let visualHtml = '';
        if (img) {
            visualHtml = `
                <div class="service-img-wrapper">
                    <img src="${img}" alt="${name}" class="service-img" onerror="this.parentElement.style.display='none'">
                </div>`;
        } else {
            visualHtml = `<div class="service-icon">${icon}</div>`;
        }

        card.innerHTML = `
            ${visualHtml}
            <div class="service-info">
                <h3>${name}</h3>
                <p>${desc}</p>
                ${price}
            </div>
        `;
        servicesGrid.appendChild(card);
    });
}

// 4. Sección Equipo Dinámica
function renderTeam(data) {
    const team = data.equipo || data.team || data.profesionales || data.staff;
    const teamGrid = document.querySelector('.team-grid');
    if (!team || !Array.isArray(team) || team.length === 0 || !teamGrid) return;

    teamGrid.innerHTML = '';

    team.forEach((member, index) => {
        const card = document.createElement('div');
        card.className = 'team-member';

        const name = member.nombre || member.name || 'Especialista';
        const role = member.cargo || member.role || member.especialidad || 'Profesional';
        const photo = member.foto || member.photo || member.image || `team_${(index % 3) + 1}.png`;

        card.innerHTML = `
            <div class="team-img-wrapper">
                <img src="${photo}" alt="${name}" class="team-img" onerror="this.src='team_1.png'">
            </div>
            <h3>${name}</h3>
            <p>${role}</p>
        `;
        teamGrid.appendChild(card);
    });
}

// 5. Sección Testimonios
function renderTestimonials(data) {
    const testimonials = data.testimonios || data.reviews;
    const testGrid = document.querySelector('.testimonials-grid');
    if (!testimonials || !Array.isArray(testimonials) || testimonials.length === 0 || !testGrid) return;

    testGrid.innerHTML = '';

    testimonials.forEach(t => {
        const card = document.createElement('div');
        card.className = 'testimonial-card';
        const text = t.texto || t.comentario || t.text;
        const author = t.cliente || t.autor || t.name || 'Clienta';

        card.innerHTML = `
            <p class="testimonial-text">"${text}"</p>
            <p class="testimonial-author">- ${author}</p>
        `;
        testGrid.appendChild(card);
    });
}

// 6. Sección Nosotros
function renderAbout(data) {
    const nosotros = data.nosotros;
    const aboutText = document.querySelector('.about-text');
    if (nosotros && nosotros.historia && aboutText) {
        aboutText.textContent = nosotros.historia;
    }
}

// 7. Contacto, WhatsApp y Footer
function renderContactAndFooter(data) {
    const contacto = data.contacto || {};
    const empresa = data.empresa || data;

    // Actualizar enlaces de WhatsApp
    if (contacto.whatsapp || contacto.telefono) {
        const waNumber = typeof contacto.whatsapp === 'object' ? contacto.whatsapp.numero : (contacto.whatsapp || contacto.telefono);
        const waMsg = typeof contacto.whatsapp === 'object' ? (contacto.whatsapp.mensaje_predeterminado || 'Hola, me gustaría agendar una cita') : 'Hola, me gustaría agendar una cita';
        
        if (waNumber) {
            const cleanNumber = String(waNumber).replace(/[^0-9]/g, '');
            const waLink = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(waMsg)}`;
            
            const contactButtons = document.querySelectorAll('a[href="#contacto"], a.btn-dark[href*="whatsapp"], .footer-contact a');
            contactButtons.forEach(btn => {
                if (btn.textContent.toLowerCase().includes('whatsapp') || btn.textContent.toLowerCase().includes('reserva') || btn.textContent.toLowerCase().includes('agendar')) {
                    btn.href = waLink;
                    btn.target = '_blank';
                }
            });
        }
    }

    // Actualizar Footer
    const footerDesc = document.querySelector('.footer-info p');
    if (footerDesc && empresa && (empresa.slogan || empresa.descripcion)) {
        footerDesc.textContent = empresa.slogan || empresa.descripcion;
    }

    const copyright = document.querySelector('.footer-bottom p');
    if (copyright && empresa && empresa.nombre) {
        copyright.innerHTML = `&copy; ${new Date().getFullYear()} ${empresa.nombre}. Todos los derechos reservados.`;
    }
}
