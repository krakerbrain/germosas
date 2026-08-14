<?php
/**
 * Panel de Administración - Germosas Studio & Agendarium Sync
 */
session_start();

// Configuración de credenciales de acceso (puedes cambiarlas aquí)
define('ADMIN_USER', 'admin');
define('ADMIN_PASS', 'admin123'); // Contraseña por defecto

$errorMsg = '';
$successMsg = '';

// Procesar Logout
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    unset($_SESSION['admin_logged_in']);
    session_destroy();
    header('Location: admin.php');
    exit;
}

// Procesar Login
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login_action'])) {
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if ($username === ADMIN_USER && $password === ADMIN_PASS) {
        $_SESSION['admin_logged_in'] = true;
        header('Location: admin.php');
        exit;
    } else {
        $errorMsg = 'Usuario o contraseña incorrectos. (Por defecto: admin / admin123)';
    }
}

// Procesar Guardado Manual de JSON desde el editor
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_json_action'])) {
    if (!isset($_SESSION['admin_logged_in'])) {
        die('No autorizado');
    }
    $manualJson = trim($_POST['json_content'] ?? '');
    $decoded = json_decode($manualJson, true);
    if ($decoded !== null || empty($manualJson)) {
        if (!is_dir(__DIR__ . '/data')) {
            mkdir(__DIR__ . '/data', 0777, true);
        }
        file_put_contents(__DIR__ . '/data/empresa.json', json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        $successMsg = '¡Archivo empresa.json guardado manualmente con éxito!';
    } else {
        $errorMsg = 'El contenido no es un JSON válido: ' . json_last_error_msg();
    }
}

$isLoggedIn = isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;

// Comprobar estado del archivo data/empresa.json
$jsonPath = __DIR__ . '/data/empresa.json';
$fileExists = file_exists($jsonPath);
$jsonContent = $fileExists ? file_get_contents($jsonPath) : '';
$jsonData = $fileExists ? json_decode($jsonContent, true) : null;
$fileSize = $fileExists ? round(filesize($jsonPath) / 1024, 2) . ' KB' : 'No creado aún';
$fileModified = $fileExists ? date('d/m/Y H:i:s', filemtime($jsonPath)) : 'Nunca';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Administración | Sincronizador Agendarium</title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --bg-color: #F8F7F4;
            --surface: #FFFFFF;
            --text-dark: #2B2624;
            --text-muted: #7A726D;
            --accent: #D8C3B4;
            --accent-dark: #8C7362;
            --primary: #2B2624;
            --success: #2E7D32;
            --success-bg: #E8F5E9;
            --error: #C62828;
            --error-bg: #FFEBEE;
            --font-heading: 'Playfair Display', serif;
            --font-body: 'Montserrat', sans-serif;
            --radius: 12px;
            --shadow: 0 4px 20px rgba(43, 38, 36, 0.08);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--font-body);
            background-color: var(--bg-color);
            color: var(--text-dark);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* Top Header */
        .admin-header {
            background-color: var(--primary);
            color: #fff;
            padding: 16px 32px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .admin-brand {
            display: flex;
            align-items: center;
            gap: 14px;
        }

        .admin-brand img {
            height: 38px;
            width: auto;
            background: #fff;
            padding: 4px;
            border-radius: 8px;
        }

        .admin-brand h1 {
            font-family: var(--font-heading);
            font-size: 1.25rem;
            font-weight: 600;
            letter-spacing: 0.5px;
        }

        .admin-nav-actions {
            display: flex;
            align-items: center;
            gap: 14px;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            border-radius: 24px;
            font-family: var(--font-body);
            font-size: 0.85rem;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.25s ease;
            border: none;
        }

        .btn-primary {
            background-color: var(--primary);
            color: #fff;
        }
        .btn-primary:hover {
            background-color: #403936;
            transform: translateY(-1px);
        }

        .btn-accent {
            background-color: var(--accent);
            color: var(--text-dark);
        }
        .btn-accent:hover {
            background-color: #c9b3a3;
        }

        .btn-outline {
            background: transparent;
            color: #fff;
            border: 1px solid rgba(255,255,255,0.3);
        }
        .btn-outline:hover {
            background: rgba(255,255,255,0.1);
        }

        .btn-logout {
            background: rgba(255,255,255,0.15);
            color: #fff;
            padding: 8px 16px;
            font-size: 0.8rem;
        }
        .btn-logout:hover {
            background: rgba(239, 83, 80, 0.8);
        }

        /* Container */
        .container {
            max-width: 1100px;
            width: 100%;
            margin: 30px auto;
            padding: 0 20px;
            flex: 1;
        }

        /* Login Card */
        .login-wrapper {
            max-width: 420px;
            margin: 60px auto;
            background: var(--surface);
            padding: 40px;
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            text-align: center;
        }

        .login-logo {
            max-width: 140px;
            margin-bottom: 20px;
        }

        .login-title {
            font-family: var(--font-heading);
            font-size: 1.6rem;
            margin-bottom: 8px;
        }

        .login-desc {
            color: var(--text-muted);
            font-size: 0.85rem;
            margin-bottom: 24px;
        }

        .form-group {
            text-align: left;
            margin-bottom: 18px;
        }

        .form-label {
            display: block;
            font-size: 0.8rem;
            font-weight: 600;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-dark);
        }

        .form-input {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid #D1CAC4;
            border-radius: 8px;
            font-family: var(--font-body);
            font-size: 0.95rem;
            background: #FAFAFA;
            transition: border 0.2s ease;
        }
        .form-input:focus {
            outline: none;
            border-color: var(--text-dark);
            background: #fff;
        }

        /* Alert notifications */
        .alert {
            padding: 12px 18px;
            border-radius: 8px;
            font-size: 0.85rem;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .alert-error {
            background-color: var(--error-bg);
            color: var(--error);
            border: 1px solid #FFCDD2;
        }
        .alert-success {
            background-color: var(--success-bg);
            color: var(--success);
            border: 1px solid #C8E6C9;
        }

        /* Dashboard Grid */
        .grid-dashboard {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 24px;
        }

        @media (max-width: 850px) {
            .grid-dashboard {
                grid-template-columns: 1fr;
            }
        }

        .card {
            background: var(--surface);
            padding: 28px;
            border-radius: var(--radius);
            box-shadow: var(--shadow);
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 1px solid #F0ECE9;
            padding-bottom: 12px;
        }

        .card-title {
            font-family: var(--font-heading);
            font-size: 1.25rem;
            color: var(--text-dark);
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        .badge-success { background: var(--success-bg); color: var(--success); }
        .badge-warning { background: #FFF3E0; color: #E65100; }

        /* Sync Box */
        .sync-box {
            background: #FAF8F6;
            border: 1px dashed #D8C3B4;
            padding: 20px;
            border-radius: 10px;
            margin: 16px 0;
        }

        .endpoint-preview {
            background: #2B2624;
            color: #A5D6A7;
            padding: 10px 14px;
            border-radius: 6px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 0.8rem;
            word-break: break-all;
            margin: 10px 0 16px 0;
            display: block;
        }

        /* Status info list */
        .info-list {
            list-style: none;
        }
        .info-list li {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #F5F2EF;
            font-size: 0.9rem;
        }
        .info-list li:last-child {
            border-bottom: none;
        }
        .info-label {
            color: var(--text-muted);
        }
        .info-val {
            font-weight: 600;
        }

        /* JSON editor / viewer */
        .json-viewer-container {
            margin-top: 10px;
        }
        .json-textarea {
            width: 100%;
            height: 320px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 0.85rem;
            background: #1E1E1E;
            color: #D4D4D4;
            padding: 16px;
            border-radius: 8px;
            border: none;
            resize: vertical;
            line-height: 1.4;
        }

        .footer {
            text-align: center;
            padding: 24px;
            color: var(--text-muted);
            font-size: 0.8rem;
            margin-top: auto;
        }

        /* Spinner */
        .spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>

    <!-- Header -->
    <header class="admin-header">
        <div class="admin-brand">
            <img src="logo_germosas.png" alt="Germosas Logo">
            <div>
                <h1>Panel de Control & Agendarium</h1>
            </div>
        </div>
        <div class="admin-nav-actions">
            <a href="home.html" target="_blank" class="btn btn-outline">🌐 Ver Sitio Web</a>
            <a href="mvp.html" target="_blank" class="btn btn-outline">✨ Demo MVP</a>
            <?php if ($isLoggedIn): ?>
                <a href="admin.php?action=logout" class="btn btn-logout">Cerrar Sesión</a>
            <?php endif; ?>
        </div>
    </header>

    <div class="container">

        <?php if (!$isLoggedIn): ?>
            <!-- VISTA DE LOGIN -->
            <div class="login-wrapper">
                <img src="logo_germosas.png" alt="Germosas Studio" class="login-logo">
                <h2 class="login-title">Acceso de Administración</h2>
                <p class="login-desc">Ingresa tus credenciales para sincronizar datos con Agendarium</p>

                <?php if ($errorMsg): ?>
                    <div class="alert alert-error"><?= htmlspecialchars($errorMsg) ?></div>
                <?php endif; ?>

                <form method="POST" action="admin.php">
                    <input type="hidden" name="login_action" value="1">
                    <div class="form-group">
                        <label class="form-label" for="username">Usuario</label>
                        <input type="text" id="username" name="username" class="form-input" value="admin" required autofocus>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="password">Contraseña</label>
                        <input type="password" id="password" name="password" class="form-input" placeholder="admin123" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 12px;">
                        Iniciar Sesión
                    </button>
                </form>
                <p style="font-size: 0.75rem; color: #888; margin-top: 16px;">
                    Credenciales por defecto: <strong>admin</strong> / <strong>admin123</strong>
                </p>
            </div>

        <?php else: ?>
            <!-- VISTA DE ADMINISTRADOR LOGUEADO -->

            <?php if ($errorMsg): ?>
                <div class="alert alert-error"><?= htmlspecialchars($errorMsg) ?></div>
            <?php endif; ?>
            <?php if ($successMsg): ?>
                <div class="alert alert-success"><?= htmlspecialchars($successMsg) ?></div>
            <?php endif; ?>

            <!-- Mensaje dinámico de sincronización vía AJAX -->
            <div id="sync-notification" style="display: none;" class="alert"></div>

            <div class="grid-dashboard">
                
                <!-- CARD 1: SINCRONIZADOR DESDE AGENDARIUM -->
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">
                            <span>⚡</span> Sincronización Agendarium
                        </h2>
                        <span class="badge badge-success">API Conectada</span>
                    </div>

                    <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 16px;">
                        Descarga en un clic los servicios, horarios, datos y equipo directamente desde tu cuenta de Agendarium y genera automáticamente el archivo <code>data/empresa.json</code>.
                    </p>

                    <div class="form-group">
                        <label class="form-label" for="company_slug">Slug de la Empresa</label>
                        <input type="text" id="company_slug" class="form-input" value="germosas-studio" placeholder="ej: germosas-studio">
                    </div>

                    <div class="sync-box">
                        <span style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted);">
                            URL Endpoint de Agendarium:
                        </span>
                        <code id="endpoint-url-preview" class="endpoint-preview">
                            https://agendarium.com/api/empresa.php?slug=germosas-studio
                        </code>
                        
                        <button id="btn-sync-action" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 14px; font-size: 0.95rem;">
                            <span id="sync-btn-icon">🔄</span>
                            <span id="sync-btn-text">Sincronizar Datos desde Agendarium</span>
                        </button>
                    </div>

                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <a id="btn-open-api" href="https://agendarium.com/api/empresa.php?slug=germosas-studio" target="_blank" class="btn btn-accent" style="flex: 1; justify-content: center; font-size: 0.8rem;">
                            🔗 Ver API en Navegador
                        </a>
                        <a href="data/empresa.json" download="empresa.json" class="btn btn-accent" style="flex: 1; justify-content: center; font-size: 0.8rem;">
                            📥 Descargar JSON
                        </a>
                    </div>
                </div>

                <!-- CARD 2: ESTADO DEL ARCHIVO LOCAL -->
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">
                            <span>📁</span> Estado del Archivo Local
                        </h2>
                        <?php if ($fileExists): ?>
                            <span class="badge badge-success">Activo (data/empresa.json)</span>
                        <?php else: ?>
                            <span class="badge badge-warning">Sin archivo aún</span>
                        <?php endif; ?>
                    </div>

                    <ul class="info-list">
                        <li>
                            <span class="info-label">Ruta en servidor:</span>
                            <span class="info-val"><code>/data/empresa.json</code></span>
                        </li>
                        <li>
                            <span class="info-label">Estado:</span>
                            <span class="info-val" id="info-status">
                                <?= $fileExists ? '✅ Creado y disponible' : '⚠️ Pendiente de sincronizar' ?>
                            </span>
                        </li>
                        <li>
                            <span class="info-label">Última sincronización:</span>
                            <span class="info-val" id="info-modified"><?= $fileModified ?></span>
                        </li>
                        <li>
                            <span class="info-label">Tamaño del archivo:</span>
                            <span class="info-val" id="info-size"><?= $fileSize ?></span>
                        </li>
                        <li>
                            <span class="info-label">Empresa detectada:</span>
                            <span class="info-val" id="info-empresa">
                                <?= htmlspecialchars($jsonData['empresa']['nombre'] ?? ($jsonData['nombre'] ?? 'Germosas Studio')) ?>
                            </span>
                        </li>
                        <li>
                            <span class="info-label">Servicios cargados:</span>
                            <span class="info-val" id="info-services">
                                <?= isset($jsonData['servicios']) && is_array($jsonData['servicios']) ? count($jsonData['servicios']) . ' servicios' : 'N/A' ?>
                            </span>
                        </li>
                    </ul>

                    <div style="margin-top: 20px; text-align: center;">
                        <a href="home.html" target="_blank" class="btn btn-primary" style="width: 100%; justify-content: center;">
                            🚀 Abrir Sitio Web con los nuevos datos
                        </a>
                    </div>
                </div>

            </div>

            <!-- CARD 3: VISOR Y EDITOR EN VIVO DEL JSON -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">
                        <span>📝</span> Contenido de <code>data/empresa.json</code>
                    </h2>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">Puedes editarlo manualmente o dejar que se actualice desde Agendarium</span>
                </div>

                <form method="POST" action="admin.php">
                    <input type="hidden" name="save_json_action" value="1">
                    <div class="json-viewer-container">
                        <textarea id="json_content_area" name="json_content" class="json-textarea" spellcheck="false"><?= htmlspecialchars($jsonContent) ?></textarea>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 14px;">
                        <button type="button" id="btn-format-json" class="btn btn-accent">
                            ✨ Formatear / Embellecer JSON
                        </button>
                        <button type="submit" class="btn btn-primary">
                            💾 Guardar Cambios Manualmente
                        </button>
                    </div>
                </form>
            </div>

        <?php endif; ?>

    </div>

    <footer class="footer">
        <p>Germosas Studio & Agendarium SaaS Integration &copy; <?= date('Y') ?></p>
    </footer>

    <!-- Script para AJAX y manejo de Sincronización -->
    <script>
        const slugInput = document.getElementById('company_slug');
        const endpointPreview = document.getElementById('endpoint-url-preview');
        const btnOpenApi = document.getElementById('btn-open-api');
        const btnSync = document.getElementById('btn-sync-action');
        const syncBtnText = document.getElementById('sync-btn-text');
        const syncBtnIcon = document.getElementById('sync-btn-icon');
        const notificationBox = document.getElementById('sync-notification');
        const jsonContentArea = document.getElementById('json_content_area');
        const btnFormat = document.getElementById('btn-format-json');

        // Actualizar URL dinámica cuando el usuario cambia el slug
        if (slugInput) {
            slugInput.addEventListener('input', () => {
                const slug = slugInput.value.trim() || 'germosas-studio';
                const newUrl = `https://agendarium.com/api/empresa.php?slug=${encodeURIComponent(slug)}`;
                endpointPreview.textContent = newUrl;
                btnOpenApi.href = newUrl;
            });
        }

        // Formatear JSON en el textarea
        if (btnFormat && jsonContentArea) {
            btnFormat.addEventListener('click', () => {
                try {
                    const parsed = JSON.parse(jsonContentArea.value);
                    jsonContentArea.value = JSON.stringify(parsed, null, 2);
                } catch (e) {
                    alert('El JSON contiene errores de sintaxis y no se puede formatear.');
                }
            });
        }

        // Ejecutar Sincronización vía AJAX hacia sync.php
        if (btnSync) {
            btnSync.addEventListener('click', async () => {
                const slug = slugInput ? slugInput.value.trim() : 'germosas-studio';
                
                // Feedback visual de carga
                btnSync.disabled = true;
                syncBtnIcon.className = 'spinner';
                syncBtnIcon.textContent = '';
                syncBtnText.textContent = 'Conectando con Agendarium...';
                
                if (notificationBox) {
                    notificationBox.style.display = 'none';
                    notificationBox.className = 'alert';
                }

                try {
                    const response = await fetch(`sync.php?slug=${encodeURIComponent(slug)}`, {
                        method: 'GET'
                    });
                    
                    const resData = await response.json();

                    if (resData.success) {
                        notificationBox.className = 'alert alert-success';
                        notificationBox.innerHTML = `<strong>¡Éxito!</strong> ${resData.message}`;
                        notificationBox.style.display = 'flex';

                        // Actualizar textarea
                        if (jsonContentArea && resData.data) {
                            jsonContentArea.value = JSON.stringify(resData.data, null, 2);
                        }

                        // Actualizar datos en pantalla
                        const infoModified = document.getElementById('info-modified');
                        const infoSize = document.getElementById('info-size');
                        const infoStatus = document.getElementById('info-status');
                        const infoEmpresa = document.getElementById('info-empresa');
                        const infoServices = document.getElementById('info-services');

                        if (infoModified) infoModified.textContent = resData.timestamp;
                        if (infoSize) infoSize.textContent = (resData.bytes / 1024).toFixed(2) + ' KB';
                        if (infoStatus) infoStatus.textContent = '✅ Creado y disponible';
                        if (infoEmpresa && resData.data.empresa) {
                            infoEmpresa.textContent = resData.data.empresa.nombre || resData.data.nombre || slug;
                        }
                        if (infoServices && resData.data.servicios) {
                            infoServices.textContent = `${resData.data.servicios.length} servicios`;
                        }

                    } else {
                        notificationBox.className = 'alert alert-error';
                        notificationBox.innerHTML = `<strong>Error de sincronización:</strong> ${resData.message}`;
                        notificationBox.style.display = 'flex';
                    }
                } catch (err) {
                    notificationBox.className = 'alert alert-error';
                    notificationBox.innerHTML = `<strong>Error en la petición:</strong> ${err.message}`;
                    notificationBox.style.display = 'flex';
                } finally {
                    btnSync.disabled = false;
                    syncBtnIcon.className = '';
                    syncBtnIcon.textContent = '🔄';
                    syncBtnText.textContent = 'Sincronizar Datos desde Agendarium';
                }
            });
        }
    </script>
</body>
</html>
