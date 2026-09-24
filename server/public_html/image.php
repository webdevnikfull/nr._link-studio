<?php
declare(strict_types=1);
require __DIR__ . '/tools/image-store.php';

try {
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    if (!in_array($method, ['GET', 'HEAD'], true)) {
        header('Allow: GET, HEAD'); throw new ImageApiError('method', 405);
    }
    $id = $_GET['id'] ?? '';
    if (!is_string($id) || !preg_match('/^[a-f0-9]{32}$/D', $id)) throw new ImageApiError('not_found', 404);
    $select = image_db()->prepare('SELECT * FROM images WHERE id = ?');
    $select->execute([$id]); $row = $select->fetch(PDO::FETCH_ASSOC);
    if (!$row) throw new ImageApiError('not_found', 404);
    if ((int)$row['expires_at'] <= time()) throw new ImageApiError('expired', 410);
    $handle = @fopen(image_storage() . '/' . $id . '.img', 'rb');
    if ($handle === false) throw new ImageApiError('not_found', 404);
    header('Content-Type: ' . $row['mime']);
    header('Content-Length: ' . $row['size']);
    header('Content-Disposition: inline; filename="image-' . $id . '.' . $row['extension'] . '"');
    header('X-Content-Type-Options: nosniff');
    header("Content-Security-Policy: default-src 'none'; script-src 'none'; object-src 'none'; base-uri 'none'; sandbox");
    header('Cross-Origin-Resource-Policy: cross-origin');
    header('Referrer-Policy: no-referrer');
    // Do not retain a browser/proxy copy after the owner deletes the image.
    header('Cache-Control: no-store, max-age=0');
    if ($method === 'GET') fpassthru($handle);
    fclose($handle);
} catch (ImageApiError $e) {
    image_json(['ok'=>false, 'error'=>$e->reason], $e->status);
} catch (Throwable $e) {
    error_log('NR image retrieval: ' . $e->getMessage());
    image_json(['ok'=>false, 'error'=>'unavailable'], 503);
}
