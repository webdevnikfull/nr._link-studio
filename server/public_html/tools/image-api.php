<?php
declare(strict_types=1);
require __DIR__ . '/image-store.php';

try {
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    image_cors($method);
    if (!in_array($method, ['GET', 'POST', 'DELETE'], true)) {
        header('Allow: GET, POST, DELETE, OPTIONS');
        throw new ImageApiError('method', 405);
    }
    image_db();
    image_cleanup();
    if ($method === 'GET') {
        $config = image_config();
        image_json(['ok'=>true, 'maxBytes'=>$config['maxBytes'], 'formats'=>['jpg','jpeg','png','apng','gif','webp','avif','bmp','ico','tif','tiff','heic','heif'], 'retentionDays'=>$config['retentionDays']]);
    }
    if ($method === 'POST') image_json(image_upload(), 201);
    if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') throw new ImageApiError('invalid_request', 415);
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 1024) throw new ImageApiError('invalid_request', 413);
    $body = file_get_contents('php://input', false, null, 0, 1025);
    if ($body === false || strlen($body) > 1024) throw new ImageApiError('invalid_request', 400);
    $data = json_decode($body, true);
    if (!is_array($data) || !is_string($data['id'] ?? null) || !is_string($data['deleteToken'] ?? null)) throw new ImageApiError('invalid_request', 400);
    image_delete($data['id'], $data['deleteToken']);
    image_json(['ok'=>true, 'deleted'=>true]);
} catch (ImageApiError $e) {
    if ($e->status === 429) header('Retry-After: ' . (3600 - time() % 3600));
    image_json(['ok'=>false, 'error'=>$e->reason], $e->status);
} catch (Throwable $e) {
    error_log('NR image API: ' . $e->getMessage());
    image_json(['ok'=>false, 'error'=>'unavailable'], 503);
}
