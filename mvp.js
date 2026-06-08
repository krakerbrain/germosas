// Germosas MVP Interactive Logic (Updated for Presential Diagnostic Interview Flow)

// Mock Database State
const mockClients = {
    'client-new': {
        id: 'client-new',
        name: 'Andrea Morales (Tú)',
        email: 'andrea.morales@correo.com',
        phone: '+56987654321',
        rut: '19.876.543-2',
        status: 'pending', // Diagnóstico pendiente por defecto
        evaluationAnswers: {
            pregnancy: false,
            keloids: false,
            skindisease: false,
            heartmeds: false,
            bloodthinners: false
        },
        // Interview diagnostic results
        diagnosticAnswers: {
            prevWork: 'No',
            skinType: 'Mixta',
            allergyTest: 'Realizado-Negativo',
            visagism: 'Aprobado',
            approvalState: 'Aprobado'
        },
        date: '12 de Junio, 2026',
        time: '09:30 AM',
        treatment: 'Cejas',
        phototype: 'II',
        pigment: 'Soft Brown #4',
        needle: '3RL',
        anesthesia: 'Lidocaína 5% tópica en crema',
        datePerformed: '2026-06-12',
        notes: 'Pre-evaluación médica completada online. Cliente agendada para Entrevista Presencial de Diagnóstico.',
        signature: null
    },
    'client-1': {
        id: 'client-1',
        name: 'Carla Espinoza',
        email: 'carla.esp@email.com',
        phone: '+56912345678',
        rut: '15.432.876-K',
        status: 'completed', // Procedimiento realizado y finalizado
        evaluationAnswers: {
            pregnancy: false,
            keloids: false,
            skindisease: false,
            heartmeds: false,
            bloodthinners: false
        },
        diagnosticAnswers: {
            prevWork: 'No',
            skinType: 'Normal',
            allergyTest: 'No-Requiere',
            visagism: 'Aprobado',
            approvalState: 'Aprobado'
        },
        date: '8 de Junio, 2026',
        time: '11:00 AM',
        treatment: 'Cejas',
        phototype: 'II',
        pigment: 'Golden Brown #4 + Dark Brown',
        needle: '3RL',
        anesthesia: 'Lidocaína 5% tópica en crema',
        datePerformed: '2026-06-08',
        notes: 'Paciente evaluada presencialmente. Piel óptima, visagismo aprobado. Tratamiento realizado con éxito sin complicaciones.',
        signature: 'MOCK_SIGNATURE'
    },
    'client-2': {
        id: 'client-2',
        name: 'María José Pinto',
        email: 'mariajose.p@email.com',
        phone: '+56976543210',
        rut: '18.987.654-3',
        status: 'pending', // Aún en evaluación diagnóstica
        evaluationAnswers: {
            pregnancy: false,
            keloids: false,
            skindisease: true, // Afección activa
            heartmeds: false,
            bloodthinners: false
        },
        diagnosticAnswers: {
            prevWork: 'Si-Oscuro', // Trabajos previos muy oscuros
            skinType: 'Sensible',
            allergyTest: 'Pendiente',
            visagism: 'Ajustes',
            approvalState: 'Rechazado'
        },
        date: '20 de Junio, 2026',
        time: '03:30 PM',
        treatment: 'Labios',
        phototype: 'III',
        pigment: 'Rose Wood #12',
        needle: '1R 0.3mm',
        anesthesia: 'Lidocaína 5% tópica en crema',
        datePerformed: '2026-06-20',
        notes: 'ALERTA ONLINE: Cliente reporta dermatitis. En la cita presencial se constata trabajo anterior muy oscuro que requiere neutralización previa o remoción láser. Test de alergia pendiente por piel sensible.',
        signature: null
    }
};

let currentStaffClientId = 'client-1';

// Form evaluation answers tracking
const clientAnswers = {
    pregnancy: null,
    keloids: null,
    skindisease: null,
    heartmeds: null,
    bloodthinners: null
};

// Selection tracking
let selectedDateNum = null;
let selectedTimeVal = null;
let hasSignature = false;

// DOM Elements & Canvas Initialization
let canvas, ctx, isDrawing = false;

window.addEventListener('DOMContentLoaded', () => {
    updateStaffClientDetails('client-1');
    
    // Window resize handler for canvas
    window.addEventListener('resize', resizeCanvas);
});

// Mode Switching (Client Flow vs Staff Dashboard)
function switchMode(mode) {
    document.querySelectorAll('.mvp-view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.mode-btn').forEach(el => el.classList.remove('active'));
    
    if (mode === 'client') {
        document.getElementById('view-client').classList.add('active');
        document.getElementById('btn-mode-client').classList.add('active');
    } else {
        document.getElementById('view-staff').classList.add('active');
        document.getElementById('btn-mode-staff').classList.add('active');
        
        // Sync active state of new client if they finished the flow
        const newClient = mockClients['client-new'];
        const listNameEl = document.getElementById('lbl-new-name');
        const listBadgeEl = document.getElementById('badge-new-status');
        
        if (newClient.status === 'completed') {
            listNameEl.textContent = newClient.name;
            listBadgeEl.className = 'client-item-status status-completed';
            listBadgeEl.textContent = 'Completado';
        } else {
            listNameEl.textContent = newClient.name;
            listBadgeEl.className = 'client-item-status status-pending';
            listBadgeEl.textContent = 'Diagnóstico';
        }
        
        // Default select to new client if they just completed their booking
        if (selectedDateNum && selectedTimeVal) {
            selectStaffClient('client-new');
        } else {
            selectStaffClient(currentStaffClientId);
        }
    }
}

// Client Steps Flow Controller
function goToStep(stepNum) {
    document.querySelectorAll('.step-content-card').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.step-item').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`step-card-${stepNum}`).classList.add('active');
    
    // Update active states on progress dots
    for (let i = 1; i <= 4; i++) {
        const item = document.getElementById(`step-i-${i}`);
        if (i < stepNum) {
            item.classList.add('completed');
            item.classList.remove('active');
        } else if (i === stepNum) {
            item.classList.add('active');
            item.classList.remove('completed');
        } else {
            item.classList.remove('active', 'completed');
        }
    }
}

// STEP 1: Questionnaire Handlers
function setAnswer(questionKey, val) {
    clientAnswers[questionKey] = val;
    
    // Update button visual states
    const qGroup = document.querySelector(`.question-group[data-q="${questionKey}"]`);
    const btnYes = qGroup.querySelector('.btn-yes');
    const btnNo = qGroup.querySelector('.btn-no');
    
    if (val) {
        btnYes.classList.add('active-yes');
        btnNo.classList.remove('active-no');
    } else {
        btnNo.classList.add('active-no');
        btnYes.classList.remove('active-yes');
    }
    
    checkQuestionnaireCompletion();
}

function checkQuestionnaireCompletion() {
    const allAnswered = Object.values(clientAnswers).every(v => v !== null);
    if (!allAnswered) return;
    
    // Evaluate conditions
    const hasContraindications = clientAnswers.pregnancy || clientAnswers.keloids || clientAnswers.skindisease || clientAnswers.heartmeds || clientAnswers.bloodthinners;
    const resultBox = document.getElementById('evaluation-result');
    const nextBtn = document.getElementById('btn-next-1');
    
    resultBox.className = 'validation-result';
    
    if (hasContraindications) {
        resultBox.classList.add('warning');
        resultBox.innerHTML = `
            <h4 style="margin-top:0; font-weight:600; margin-bottom:5px;">⚠️ Atención: Requiere Evaluación Especialista</h4>
            <p style="margin:0; font-size:0.85rem; line-height:1.4;">
                Hemos detectado condiciones de salud que requieren revisión en persona por una micropigmentadora de Germosas. 
                <strong>No te preocupes:</strong> Habilitaremos tu agendamiento para una **Entrevista y Diagnóstico Presencial** gratuita para evaluar la viabilidad de forma segura.
            </p>
        `;
        // Store evaluation outcome in mock client
        mockClients['client-new'].status = 'pending';
        mockClients['client-new'].notes = 'ALERTA ONLINE: El cliente reporta condiciones especiales de salud. Evaluar en persona en la entrevista.';
    } else {
        resultBox.classList.add('success');
        resultBox.innerHTML = `
            <h4 style="margin-top:0; font-weight:600; margin-bottom:5px;">✓ Pre-Aprobación Inicial Exitosa</h4>
            <p style="margin:0; font-size:0.85rem; line-height:1.4;">
                No registras contraindicaciones severas iniciales. Puedes continuar para elegir la fecha y hora de tu Cita de Diagnóstico y Visagismo Presencial en Germosas.
            </p>
        `;
        mockClients['client-new'].status = 'pending'; // Sigue en diagnóstico hasta la entrevista
        mockClients['client-new'].notes = 'Pre-evaluación médica online limpia. Pendiente de diagnóstico presencial.';
    }
    
    // Save answers back to our new client mock object
    mockClients['client-new'].evaluationAnswers = { ...clientAnswers };
    
    nextBtn.removeAttribute('disabled');
}

// STEP 2: Calendar Handlers
function selectDate(day) {
    selectedDateNum = day;
    document.querySelectorAll('.calendar-day').forEach(el => {
        if (!el.classList.contains('disabled') && !el.classList.contains('empty')) {
            if (el.textContent == day) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        }
    });
    updateCalendarSummary();
}

function selectTime(timeVal) {
    selectedTimeVal = timeVal;
    document.querySelectorAll('.time-slot').forEach(el => {
        if (!el.classList.contains('disabled')) {
            if (el.textContent === timeVal) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        }
    });
    updateCalendarSummary();
}

function updateCalendarSummary() {
    const summary = document.getElementById('selection-summary');
    const nextBtn = document.getElementById('btn-next-2');
    
    if (selectedDateNum && selectedTimeVal) {
        const fullDate = `${selectedDateNum} de Junio, 2026`;
        summary.innerHTML = `<strong>Diagnóstico agendado:</strong> ${fullDate} a las ${selectedTimeVal}`;
        nextBtn.removeAttribute('disabled');
        
        // Save calendar info in mock new client
        mockClients['client-new'].date = fullDate;
        mockClients['client-new'].time = selectedTimeVal;
    } else {
        summary.textContent = 'Por favor, selecciona una fecha y una hora.';
        nextBtn.setAttribute('disabled', 'true');
    }
}

// STEP 3 Submit -> Final page
function submitClientFlow() {
    // Capture user details
    const nameVal = document.getElementById('client-name').value;
    const emailVal = document.getElementById('client-email').value;
    const phoneVal = document.getElementById('client-phone').value;
    const rutVal = document.getElementById('client-rut').value;

    if (!nameVal || !emailVal) {
        alert('Por favor rellena tu nombre y correo electrónico.');
        return;
    }
    
    // Save to our new client database
    const newClient = mockClients['client-new'];
    newClient.name = nameVal;
    newClient.email = emailVal;
    newClient.phone = phoneVal;
    newClient.rut = rutVal;

    // Update final step text
    document.getElementById('summary-final-date').textContent = newClient.date;
    document.getElementById('summary-final-time').textContent = newClient.time;
    document.getElementById('summary-email').textContent = newClient.email;

    goToStep(4);
}

// STEP 4: Signature Pad Logic in Cabinet (Staff View)
function initSignaturePad() {
    canvas = document.getElementById('signature-pad');
    if (!canvas) return;
    
    ctx = canvas.getContext('2d');
    resizeCanvas();
    
    // Clear canvas setup
    ctx.strokeStyle = "#2B2624";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Mouse Events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Touch Events (for Tablet/Mobile in Cabin)
    canvas.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        startDrawing(getTouchPos(canvas, touch));
        e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        draw(getTouchPos(canvas, touch));
        e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener('touchend', stopDrawing);
}

function getTouchPos(canvasDom, touch) {
    const rect = canvasDom.getBoundingClientRect();
    return {
        clientX: touch.clientX,
        clientY: touch.clientY
    };
}

function resizeCanvas() {
    if (!canvas) return;
    // Store current drawings if any
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);

    const rect = canvas.parentNode.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = 160;

    // Restore drawings
    ctx = canvas.getContext('2d');
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.strokeStyle = "#2B2624";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
}

function startDrawing(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.clientX === 0 ? e.clientX : e.x) - rect.left;
    const y = (e.clientY || e.clientY === 0 ? e.clientY : e.y) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function draw(e) {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.clientX === 0 ? e.clientX : e.x) - rect.left;
    const y = (e.clientY || e.clientY === 0 ? e.clientY : e.y) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
    hasSignature = true;
}

function stopDrawing() {
    isDrawing = false;
}

function clearSignature() {
    if (!canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSignature = false;
}

// Interactive display of Consent & Treatment fields based on diagnostic status
function toggleTreatmentSections() {
    const approvalSelect = document.getElementById('diag-approval');
    const isApproved = (approvalSelect.value === 'Aprobado');
    const consentSection = document.getElementById('section-consent-signature');
    const specsSection = document.getElementById('section-treatment-specs');
    
    if (isApproved) {
        consentSection.style.display = 'block';
        specsSection.style.display = 'block';
        // Initialize signature pad after showing it
        setTimeout(initSignaturePad, 100);
    } else {
        consentSection.style.display = 'none';
        specsSection.style.display = 'none';
    }
}

// Automatic clinical decision helper
function updateDiagnosticLogic() {
    const prevWork = document.getElementById('diag-prev-work').value;
    const allergy = document.getElementById('diag-allergy').value;
    const visagism = document.getElementById('diag-visagism').value;
    const approvalSelect = document.getElementById('diag-approval');
    
    // If previous work is too dark (needs laser removal) or allergy test is pending, automatically suggest not apt
    if (prevWork === 'Si-Oscuro' || allergy === 'Pendiente' || visagism === 'Ajustes') {
        approvalSelect.value = 'Rechazado';
    } else {
        approvalSelect.value = 'Aprobado';
    }
    
    toggleTreatmentSections();
}

// VIEW STAFF: Select client from Sidebar
function selectStaffClient(clientId) {
    currentStaffClientId = clientId;
    
    // Toggle active list item styling
    document.querySelectorAll('.client-item').forEach(el => el.classList.remove('active'));
    // Find item
    const items = document.querySelectorAll('.client-item');
    items.forEach(el => {
        if (el.getAttribute('onclick').includes(clientId)) {
            el.classList.add('active');
        }
    });

    updateStaffClientDetails(clientId);
}

function updateStaffClientDetails(clientId) {
    const client = mockClients[clientId];
    if (!client) return;

    // Set general info
    document.getElementById('staff-selected-name').textContent = client.name;
    document.getElementById('staff-selected-rut').textContent = client.rut;
    document.getElementById('staff-selected-date').textContent = `${client.date} - ${client.time}`;
    document.getElementById('mock-email-to').textContent = client.email;
    
    // Fill pre-evaluation online details
    const evalAnswers = client.evaluationAnswers;
    document.getElementById('lbl-eval-pregnancy').textContent = evalAnswers.pregnancy ? 'SÍ (Alerta)' : 'NO';
    document.getElementById('lbl-eval-keloids').textContent = evalAnswers.keloids ? 'SÍ (Alerta)' : 'NO';
    document.getElementById('lbl-eval-skindisease').textContent = evalAnswers.skindisease ? 'SÍ (Alerta)' : 'NO';
    document.getElementById('lbl-eval-heartmeds').textContent = evalAnswers.heartmeds ? 'SÍ (Alerta)' : 'NO';
    document.getElementById('lbl-eval-bloodthinners').textContent = evalAnswers.bloodthinners ? 'SÍ (Alerta)' : 'NO';

    // Highlight evaluation problems if any
    const fields = ['lbl-eval-pregnancy', 'lbl-eval-keloids', 'lbl-eval-skindisease', 'lbl-eval-heartmeds', 'lbl-eval-bloodthinners'];
    fields.forEach(f => {
        const el = document.getElementById(f);
        if (el.textContent.includes('SÍ')) {
            el.style.color = '#A35C58';
            el.style.fontWeight = 'bold';
        } else {
            el.style.color = 'inherit';
            el.style.fontWeight = 'normal';
        }
    });

    // Fill interview diagnostics
    const diag = client.diagnosticAnswers || { prevWork: 'No', skinType: 'Mixta', allergyTest: 'Realizado-Negativo', visagism: 'Aprobado', approvalState: 'Aprobado' };
    document.getElementById('diag-prev-work').value = diag.prevWork;
    document.getElementById('diag-skin-type').value = diag.skinType;
    document.getElementById('diag-allergy').value = diag.allergyTest;
    document.getElementById('diag-density').value = diag.eyebrowDensity || 'Medio';
    document.getElementById('diag-visagism').value = diag.visagism;
    document.getElementById('diag-approval').value = diag.approvalState;

    // Fill Ficha Técnica inputs (if procedure was done)
    document.getElementById('tech-area').value = client.treatment || 'Cejas';
    document.getElementById('tech-phototype').value = client.phototype || 'II';
    document.getElementById('tech-pigment').value = client.pigment || 'Soft Brown #4';
    document.getElementById('tech-needle').value = client.needle || '3RL';
    document.getElementById('tech-anesthesia').value = client.anesthesia || 'Lidocaína 5% tópica en crema';
    document.getElementById('tech-date').value = client.datePerformed || '2026-06-08';
    document.getElementById('tech-notes').value = client.notes || '';

    // Calculate suggestion date for touchup (+30 days)
    const touchupDateText = document.getElementById('staff-touchup-date');
    const performedDate = new Date(client.datePerformed || '2026-06-08');
    const touchupDate = new Date(performedDate.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    touchupDateText.textContent = touchupDate.toLocaleDateString('es-ES', options);

    // Set status badge
    const badge = document.getElementById('staff-selected-status-badge');
    badge.textContent = client.status.toUpperCase();
    
    const alertsPanel = document.getElementById('section-alerts');
    
    if (client.status === 'completed') {
        badge.className = 'badge badge-success';
        badge.textContent = 'Completado';
        alertsPanel.style.display = 'block'; // Show touch-up alerts since treatment is finished
    } else {
        badge.className = 'badge badge-warning';
        badge.textContent = 'En Diagnóstico';
        alertsPanel.style.display = 'none'; // Hide touch-up alerts since no treatment is done yet
    }

    // Toggle sections based on diagnostic selection
    toggleTreatmentSections();

    // Reset signature drawing canvas tracking
    clearSignature();
    if (client.signature) {
        hasSignature = true;
    }

    // Update alert preview names
    document.querySelectorAll('.mock-client-name').forEach(el => {
        el.textContent = client.name.split(' ')[0];
    });
}

function saveTechnicalCard() {
    const client = mockClients[currentStaffClientId];
    if (!client) return;

    const approvalState = document.getElementById('diag-approval').value;
    
    // Save diagnostic checklist
    client.diagnosticAnswers = {
        prevWork: document.getElementById('diag-prev-work').value,
        skinType: document.getElementById('diag-skin-type').value,
        allergyTest: document.getElementById('diag-allergy').value,
        eyebrowDensity: document.getElementById('diag-density').value,
        visagism: document.getElementById('diag-visagism').value,
        approvalState: approvalState
    };

    if (approvalState === 'Aprobado') {
        // Validation check for signature
        if (!hasSignature && !client.signature) {
            alert('Atención: El cliente debe firmar el Consentimiento Digital antes de guardar e iniciar el tratamiento.');
            return;
        }

        // Save procedure card
        client.treatment = document.getElementById('tech-area').value;
        client.phototype = document.getElementById('tech-phototype').value;
        client.pigment = document.getElementById('tech-pigment').value;
        client.needle = document.getElementById('tech-needle').value;
        client.anesthesia = document.getElementById('tech-anesthesia').value;
        client.datePerformed = document.getElementById('tech-date').value;
        client.notes = document.getElementById('tech-notes').value;
        client.status = 'completed'; // Marked as completed

        // Save canvas signature image
        if (canvas && hasSignature && !client.signature) {
            client.signature = canvas.toDataURL('image/png');
        }
    } else {
        // Saved as rejected/pending
        client.status = 'pending';
        client.notes = 'RECHAZADO/POSPONIDO EN ENTREVISTA: ' + document.getElementById('tech-notes').value;
    }

    // Success notification
    const toast = document.getElementById('save-toast');
    toast.style.opacity = '1';
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 2500);

    // Refresh client list state in sidebar
    const listBadgeEl = document.getElementById('badge-new-status');
    if (currentStaffClientId === 'client-new') {
        if (client.status === 'completed') {
            listBadgeEl.className = 'client-item-status status-completed';
            listBadgeEl.textContent = 'Completado';
        } else {
            listBadgeEl.className = 'client-item-status status-pending';
            listBadgeEl.textContent = 'Diagnóstico';
        }
    }
    
    updateStaffClientDetails(currentStaffClientId);
}

// PDF Generation using jsPDF (Updated to include Diagnosis details)
function generateAndDownloadPDF(context = 'client') {
    const client = (context === 'client') ? mockClients['client-new'] : mockClients[currentStaffClientId];
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Theme Colors
    const primary = "#2B2624";
    const accent = "#C5A880";

    // Elegant Header
    doc.setFillColor(43, 38, 36);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(248, 247, 244);
    doc.setFont("playfair", "bold");
    doc.setFontSize(22);
    doc.text("GERMOSAS STUDIO", 15, 20);
    
    doc.setFont("montserrat", "normal");
    doc.setFontSize(9);
    doc.text("Ficha Clínica Consolidada de Micropigmentación", 15, 30);
    doc.text("Evaluación + Entrevista + Consentimiento", 130, 25);

    // Client Info Section
    doc.setTextColor(43, 38, 36);
    doc.setFontSize(13);
    doc.setFont("playfair", "bold");
    doc.text("1. Datos Generales del Cliente", 15, 52);
    
    doc.setDrawColor(216, 195, 180);
    doc.setLineWidth(0.5);
    doc.line(15, 55, 195, 55);

    doc.setFont("montserrat", "normal");
    doc.setFontSize(9);
    doc.text(`Nombre Completo: ${client.name}`, 15, 63);
    doc.text(`RUT / ID: ${client.rut}`, 15, 70);
    doc.text(`Correo Electrónico: ${client.email}`, 15, 77);
    doc.text(`Teléfono: ${client.phone}`, 15, 84);
    doc.text(`Cita Agendada: ${client.date} a las ${client.time}`, 15, 91);

    // Cuestionario de Pre-Evaluación
    doc.setFont("playfair", "bold");
    doc.setFontSize(13);
    doc.text("2. Cuestionario Pre-Evaluación Online", 15, 103);
    doc.line(15, 106, 195, 106);

    doc.setFont("montserrat", "normal");
    doc.setFontSize(9);
    const answers = client.evaluationAnswers;
    doc.text(`¿Embarazo o Lactancia?: ${answers.pregnancy ? "SÍ (Advertido)" : "NO"}`, 15, 114);
    doc.text(`¿Cicatrización Queloides?: ${answers.keloids ? "SÍ (Advertido)" : "NO"}`, 15, 121);
    doc.text(`¿Afección de la piel activa?: ${answers.skindisease ? "SÍ (Advertido)" : "NO"}`, 15, 128);
    doc.text(`¿Problemas de Coagulación?: ${answers.heartmeds ? "SÍ (Advertido)" : "NO"}`, 15, 135);
    doc.text(`¿Toma Anticoagulantes?: ${answers.bloodthinners ? "SÍ (Advertido)" : "NO"}`, 15, 142);

    // Ficha de Diagnóstico Presencial
    doc.setFont("playfair", "bold");
    doc.setFontSize(13);
    doc.text("3. Ficha de Diagnóstico Clínico (Entrevista Presencial)", 15, 154);
    doc.line(15, 157, 195, 157);

    doc.setFont("montserrat", "normal");
    doc.setFontSize(9);
    const diag = client.diagnosticAnswers || { prevWork: 'No', skinType: 'Mixta', allergyTest: 'No-Requiere', visagism: 'Aprobado', approvalState: 'Aprobado' };
    doc.text(`¿Micropigmentación Previa?: ${diag.prevWork === 'No' ? 'No tiene' : diag.prevWork}`, 15, 165);
    doc.text(`Tipo de Piel Evaluado: ${diag.skinType}`, 15, 172);
    doc.text(`Prueba Alergia Pigmento: ${diag.allergyTest}`, 15, 179);
    doc.text(`Diseño y Visagismo Lápiz: ${diag.visagism}`, 15, 186);
    doc.text(`Habilitación Profesional: ${diag.approvalState.toUpperCase()}`, 15, 193);

    // Ficha Técnica (Procedure Specs)
    doc.setFont("playfair", "bold");
    doc.setFontSize(13);
    doc.text("4. Ficha Técnica de Aplicación y Consentimiento", 15, 205);
    doc.line(15, 208, 195, 208);

    doc.setFont("montserrat", "normal");
    doc.setFontSize(9);
    doc.text(`Zona Tratada: ${client.treatment || "Cejas"}`, 15, 216);
    doc.text(`Fototipo Fitzpatrick: ${client.phototype || "II"}`, 15, 223);
    doc.text(`Pigmento Utilizado: ${client.pigment || "Golden Brown #4"}`, 15, 230);
    doc.text(`Aguja de Trabajo: ${client.needle || "3RL"}`, 15, 237);
    doc.text(`Anestésico Utilizado: ${client.anesthesia || "Lidocaína 5%"}`, 15, 244);
    
    // Notes
    doc.text("Observaciones Clínicas:", 15, 252);
    doc.setFontSize(8);
    const splitNotes = doc.splitTextToSize(client.notes || "Sin observaciones adicionales.", 180);
    doc.text(splitNotes, 15, 257);

    // Legal Terms
    doc.setFontSize(7);
    doc.setTextColor(122, 112, 107);
    const terms = "Declaro bajo juramento que toda la información provista en la evaluación online y en la entrevista presencial es verídica. Autorizo la recopilación y almacenamiento de mis datos en la ficha estética de Germosas Studio, respaldado por mi firma digital.";
    const splitTerms = doc.splitTextToSize(terms, 180);
    doc.text(splitTerms, 15, 272);

    // Draw Signature Image
    if (client.signature && client.signature !== 'MOCK_SIGNATURE') {
        doc.setFont("playfair", "bold");
        doc.setFontSize(10);
        doc.setTextColor(43, 38, 36);
        // Signature box border
        doc.rect(130, 275, 65, 18);
        try {
            doc.addImage(client.signature, 'PNG', 132, 276, 60, 15);
        } catch (e) {
            console.error("Error drawing signature image in PDF:", e);
        }
    } else {
        doc.setFont("playfair", "bold");
        doc.setFontSize(10);
        doc.setTextColor(43, 38, 36);
        doc.text("Firma Legal Digitalizada", 135, 280);
    }

    doc.save(`Germosas_Historial_Clinico_${client.name.replace(/\s+/g, '_')}.pdf`);
}

// Alert notification simulated triggers
function simulateAlert(type) {
    const client = mockClients[currentStaffClientId];
    const clientFirstName = client.name.split(' ')[0];
    const phoneNum = client.phone;
    
    // Create elegant custom modal dialog in page
    const alertModal = document.createElement('div');
    alertModal.style.position = 'fixed';
    alertModal.style.top = '0';
    alertModal.style.left = '0';
    alertModal.style.width = '100vw';
    alertModal.style.height = '100vh';
    alertModal.style.background = 'rgba(43, 38, 36, 0.6)';
    alertModal.style.zIndex = '9999';
    alertModal.style.display = 'flex';
    alertModal.style.alignItems = 'center';
    alertModal.style.justifyContent = 'center';
    alertModal.style.backdropFilter = 'blur(5px)';
    alertModal.style.animation = 'fadeIn 0.3s ease';

    const card = document.createElement('div');
    card.style.background = '#FFFFFF';
    card.style.borderRadius = '16px';
    card.style.padding = '30px';
    card.style.maxWidth = '450px';
    card.style.width = '90%';
    card.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
    card.style.textAlign = 'center';
    card.style.border = '1px solid #D8C3B4';
    
    let icon = '';
    let title = '';
    let text = '';
    
    if (type === 'whatsapp') {
        icon = '📲 WhatsApp';
        title = 'Simulación de Mensaje de WhatsApp';
        text = `Mensaje automático enviado con éxito a **${client.name}** (${phoneNum}):\n\n_"Hola, ${clientFirstName}. 🌟 Ha pasado un mes desde tu tratamiento de micropigmentación en Germosas Studio. Es momento de agendar tu retoque..."_`;
    } else {
        icon = '✉️ Correo Electrónico';
        title = 'Simulación de Correo Enviado';
        text = `Correo de fidelización enviado con éxito a la dirección **${client.email}**.\n\nEl correo incluye los enlaces de reserva directa en Agendarium y las indicaciones de cuidados post-tratamiento.`;
    }

    card.innerHTML = `
        <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 15px; color: #2B2624;">${icon}</div>
        <h3 style="font-family: 'Playfair Display', serif; font-size: 1.4rem; margin-bottom: 15px; color: #2B2624;">${title}</h3>
        <p style="font-size: 0.9rem; color: #5A514D; line-height: 1.6; text-align: left; background: #F8F7F4; padding: 15px; border-radius: 8px; border: 1px solid #EAE8E2; margin-bottom: 20px; white-space: pre-line;">${text}</p>
        <button class="btn btn-dark" style="width: 100%;" onclick="this.closest('.mvp-modal').remove()">Entendido / Cerrar</button>
    `;
    
    alertModal.className = 'mvp-modal';
    alertModal.appendChild(card);
    document.body.appendChild(alertModal);
}
