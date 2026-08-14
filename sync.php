<?php
/**
 * Agendarium Sync Controller
 * Descarga y sincroniza la información de la empresa desde Agendarium API y la guarda en /data/empresa.json
 */
header('Content-Type: application/json; charset=utf-8');

// Directorio y archivo de destino
$dataDir = __DIR__ . '/data';
$jsonFile = $dataDir . '/empresa.json';

// Obtener slug desde POST o GET
$slug = isset($_REQUEST['slug']) && !empty(trim($_REQUEST['slug'])) ? trim($_REQUEST['slug']) : 'germosas-studio';

// Sanitizar slug (solo letras, números, guiones y guiones bajos)
$slug = preg_replace('/[^a-zA-Z0-9_-]/', '', $slug);

if (empty($slug)) {
    echo json_encode([
        'success' => false,
        'message' => 'El slug de la empresa es obligatorio.'
    ]);
    exit;
}

$apiUrl = "https://agendarium.com/api/empresa.php?slug=" . urlencode($slug);

// Función para consultar API con cURL o file_get_contents con opciones robustas
function fetchFromApi($url) {
    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Germosas-Agendarium-Sync/1.0');
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Permite conexiones en entornos locales XAMPP
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($response === false || $httpCode >= 400) {
            return ['error' => 'cURL error: ' . ($error ?: "HTTP Code $httpCode")];
        }
        return ['data' => $response];
    } else {
        $opts = [
            'http' => [
                'method' => 'GET',
                'timeout' => 15,
                'header' => "User-Agent: Germosas-Agendarium-Sync/1.0\r\n"
            ],
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false
            ]
        ];
        $context = stream_context_create($opts);
        $response = @file_get_contents($url, false, $context);
        if ($response === false) {
            return ['error' => 'No se pudo conectar al endpoint con file_get_contents.'];
        }
        return ['data' => $response];
    }
}

$fetchResult = fetchFromApi($apiUrl);

if (isset($fetchResult['error'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al conectar con Agendarium: ' . $fetchResult['error'],
        'apiUrl' => $apiUrl
    ]);
    exit;
}

$rawJson = $fetchResult['data'];
$decoded = json_decode($rawJson, true);

if ($decoded === null && json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode([
        'success' => false,
        'message' => 'La respuesta de la API no es un JSON válido. Respuesta recibida: ' . substr($rawJson, 0, 300),
        'apiUrl' => $apiUrl
    ]);
    exit;
}

// Crear carpeta data/ si no existe
if (!is_dir($dataDir)) {
    if (!mkdir($dataDir, 0777, true)) {
        echo json_encode([
            'success' => false,
            'message' => 'No se pudo crear la carpeta /data en el servidor.'
        ]);
        exit;
    }
}

// Agregar metadatos de sincronización
$decoded['_meta_sync'] = [
    'last_sync' => date('Y-m-d H:i:s'),
    'slug' => $slug,
    'source_url' => $apiUrl
];

// Guardar archivo JSON formateado
$formattedJson = json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
$saveResult = @file_put_contents($jsonFile, $formattedJson);

if ($saveResult === false) {
    echo json_encode([
        'success' => false,
        'message' => 'No se pudo escribir en ' . $jsonFile . '. Revisa permisos de carpeta.'
    ]);
    exit;
}

echo json_encode([
    'success' => true,
    'message' => '¡Datos de ' . htmlspecialchars($slug) . ' sincronizados y guardados con éxito en data/empresa.json!',
    'file' => 'data/empresa.json',
    'bytes' => $saveResult,
    'timestamp' => date('Y-m-d H:i:s'),
    'slug' => $slug,
    'data' => $decoded
]);
