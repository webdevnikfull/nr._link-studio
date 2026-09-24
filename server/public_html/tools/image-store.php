<?php
declare(strict_types=1);

final class ImageApiError extends RuntimeException {
    public function __construct(public readonly string $reason, public readonly int $status) {
        parent::__construct($reason);
    }
}

function image_config(): array {
    static $config;
    if ($config !== null) return $config;
    $config = require __DIR__ . '/image-config.php';
    $config['baseUrl'] = rtrim((string)$config['baseUrl'], '/');
    $parts = parse_url($config['baseUrl']);
    $localHttp = $config['allowHttpLocal'] && ($parts['scheme'] ?? '') === 'http'
        && in_array($parts['host'] ?? '', ['127.0.0.1', 'localhost', '[::1]'], true);
    if (!$parts || empty($parts['host']) || isset($parts['user']) || isset($parts['pass'])
        || isset($parts['query']) || isset($parts['fragment']) || !empty($parts['path'])
        || (($parts['scheme'] ?? '') !== 'https' && !$localHttp)) {
        throw new RuntimeException('baseUrl must be a configured HTTPS origin.');
    }
    $config['allowedOrigins'][] = $config['baseUrl'];
    $config['allowedOrigins'] = array_values(array_unique($config['allowedOrigins']));
    foreach ($config['allowedOrigins'] as $origin) {
        if (!is_string($origin) || preg_match('/[\r\n]/', $origin) || !filter_var($origin, FILTER_VALIDATE_URL)) {
            throw new RuntimeException('Invalid allowed origin.');
        }
        $o = parse_url($origin);
        if (!empty($o['path']) || isset($o['query']) || isset($o['fragment']) || isset($o['user'])
            || (($o['scheme'] ?? '') !== 'https' && !($config['allowHttpLocal'] && ($o['scheme'] ?? '') === 'http'
                && in_array($o['host'] ?? '', ['127.0.0.1', 'localhost', '[::1]'], true)))) {
            throw new RuntimeException('Allowed origins must be exact HTTPS origins.');
        }
    }
    foreach (['maxBytes', 'retentionDays', 'maxStorageBytes', 'maxFiles', 'uploadsPerHourPerIp', 'uploadsPerHourGlobal'] as $key) {
        if (!is_int($config[$key]) || $config[$key] < 1) throw new RuntimeException('Invalid numeric limit.');
    }
    return $config;
}

function image_storage(): string {
    static $storage;
    if ($storage !== null) return $storage;
    $requested = image_config()['storage'];
    if (!is_dir($requested) && !@mkdir($requested, 0700, true) && !is_dir($requested)) {
        throw new RuntimeException('Cannot create private image storage.');
    }
    $resolved = realpath($requested);
    $public = realpath(dirname(__DIR__));
    if ($resolved === false || $public === false) throw new RuntimeException('Invalid storage path.');
    $normalized = strtolower(str_replace('\\', '/', $resolved)) . '/';
    $publicNormalized = strtolower(str_replace('\\', '/', $public)) . '/';
    if (str_starts_with($normalized, $publicNormalized)) throw new RuntimeException('Storage must be outside public_html.');
    if (!is_writable($resolved)) throw new RuntimeException('Private image storage is not writable.');
    return $storage = $resolved;
}

function image_db(): PDO {
    static $db;
    if ($db !== null) return $db;
    if (!extension_loaded('pdo_sqlite') || !extension_loaded('fileinfo')) throw new RuntimeException('Required PHP extension missing.');
    $db = new PDO('sqlite:' . image_storage() . '/images.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $db->exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL;');
    $db->exec('CREATE TABLE IF NOT EXISTS images (id TEXT PRIMARY KEY, token_hash TEXT NOT NULL, name TEXT NOT NULL, mime TEXT NOT NULL, extension TEXT NOT NULL, size INTEGER NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL)');
    $db->exec('CREATE INDEX IF NOT EXISTS images_expiry ON images(expires_at)');
    $db->exec('CREATE TABLE IF NOT EXISTS attempts (identity TEXT NOT NULL, bucket INTEGER NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(identity, bucket))');
    $db->exec('CREATE TABLE IF NOT EXISTS settings (name TEXT PRIMARY KEY, value TEXT NOT NULL)');
    $statement = $db->prepare("INSERT OR IGNORE INTO settings(name, value) VALUES ('rate_secret', ?)");
    $statement->execute([bin2hex(random_bytes(32))]);
    return $db;
}

function image_transaction(callable $operation): mixed {
    $db = image_db();
    $db->exec('BEGIN IMMEDIATE');
    try { $result = $operation($db); $db->exec('COMMIT'); return $result; }
    catch (Throwable $e) { $db->exec('ROLLBACK'); throw $e; }
}

function image_json(array $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; sandbox");
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE | JSON_THROW_ON_ERROR);
    exit;
}

function image_cors(string $method): void {
    header('Vary: Origin');
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '') {
        if (!in_array($origin, image_config()['allowedOrigins'], true)) throw new ImageApiError('origin', 403);
        header('Access-Control-Allow-Origin: ' . $origin);
    } elseif (in_array($method, ['POST', 'DELETE', 'OPTIONS'], true)) {
        throw new ImageApiError('origin', 403);
    }
    if ($method === 'OPTIONS') {
        $requestedMethod = strtoupper($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'] ?? '');
        if (!in_array($requestedMethod, ['GET', 'POST', 'DELETE'], true)) throw new ImageApiError('method', 405);
        $requestedHeaders = strtolower($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'] ?? '');
        foreach (array_filter(array_map('trim', explode(',', $requestedHeaders))) as $name) {
            if (!in_array($name, ['content-type'], true)) throw new ImageApiError('origin', 403);
        }
        header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
        header('Access-Control-Max-Age: 600');
        http_response_code(204);
        exit;
    }
}

function image_rate_limit(): void {
    $config = image_config();
    $db = image_db();
    $secret = $db->query("SELECT value FROM settings WHERE name = 'rate_secret'")->fetchColumn();
    // The TCP peer address is trusted; spoofable proxy headers are intentionally ignored.
    $identity = hash_hmac('sha256', (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown'), $secret);
    $bucket = intdiv(time(), 3600);
    image_transaction(function(PDO $db) use ($identity, $bucket, $config): void {
        $remove = $db->prepare('DELETE FROM attempts WHERE bucket < ?');
        $remove->execute([$bucket - 1]);
        $select = $db->prepare('SELECT count FROM attempts WHERE identity = ? AND bucket = ?');
        foreach ([$identity => $config['uploadsPerHourPerIp'], 'global' => $config['uploadsPerHourGlobal']] as $key => $limit) {
            $select->execute([$key, $bucket]);
            if ((int)$select->fetchColumn() >= $limit) throw new ImageApiError('rate_limit', 429);
        }
        $increment = $db->prepare('INSERT INTO attempts(identity,bucket,count) VALUES(?,?,1) ON CONFLICT(identity,bucket) DO UPDATE SET count=count+1');
        $increment->execute([$identity, $bucket]);
        $increment->execute(['global', $bucket]);
    });
}

function image_cleanup(int $limit = 25): int {
    $storage = image_storage();
    return image_transaction(function(PDO $db) use ($storage, $limit): int {
        $select = $db->prepare('SELECT id FROM images WHERE expires_at <= ? ORDER BY expires_at LIMIT ?');
        $select->bindValue(1, time(), PDO::PARAM_INT);
        $select->bindValue(2, max(1, min(500, $limit)), PDO::PARAM_INT);
        $select->execute();
        $count = 0;
        foreach ($select->fetchAll(PDO::FETCH_COLUMN) as $id) {
            $path = $storage . '/' . $id . '.img';
            if (is_file($path) && !@unlink($path)) continue;
            $remove = $db->prepare('DELETE FROM images WHERE id = ?');
            $remove->execute([$id]);
            ++$count;
        }
        return $count;
    });
}

function image_storage_usage(): array {
    $count = 0; $bytes = 0;
    // Count real files, including an orphan left by an interrupted database commit.
    // This runs inside the same write transaction as every upload.
    foreach (new DirectoryIterator(image_storage()) as $entry) {
        if ($entry->isFile() && preg_match('/^[a-f0-9]{32}\.img$/D', $entry->getFilename())) {
            ++$count; $bytes += $entry->getSize();
        }
    }
    return ['count'=>$count, 'bytes'=>$bytes];
}

function image_cleanup_orphans(int $limit = 100): int {
    return image_transaction(function(PDO $db) use ($limit): int {
        $removed = 0;
        $exists = $db->prepare('SELECT 1 FROM images WHERE id = ?');
        foreach (new DirectoryIterator(image_storage()) as $entry) {
            if (!$entry->isFile() || !preg_match('/^([a-f0-9]{32})\.img$/D', $entry->getFilename(), $match) || $entry->getMTime() > time() - 3600) continue;
            $exists->execute([$match[1]]);
            if (!$exists->fetchColumn() && @unlink($entry->getPathname())) ++$removed;
            if ($removed >= $limit) break;
        }
        return $removed;
    });
}

function image_detect(string $path): array {
    $size = filesize($path);
    if ($size === false || $size < 16) throw new ImageApiError('invalid_image', 422);
    $file = fopen($path, 'rb');
    if ($file === false) throw new RuntimeException('Cannot read upload.');
    try {
        $head = fread($file, min(65536, $size));
        fseek($file, max(0, $size - 16));
        $tail = fread($file, 16);
    } finally { fclose($file); }
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($path);
    $type = null;
    $extensions = ['image/jpeg'=>'jpg', 'image/png'=>'png', 'image/gif'=>'gif', 'image/webp'=>'webp', 'image/bmp'=>'bmp', 'image/x-icon'=>'ico', 'image/tiff'=>'tiff', 'image/avif'=>'avif', 'image/heic'=>'heic', 'image/heif'=>'heif'];
    if (str_starts_with($head, "\xFF\xD8\xFF") && str_ends_with($tail, "\xFF\xD9")) $type = 'image/jpeg';
    elseif (str_starts_with($head, "\x89PNG\r\n\x1a\n") && str_ends_with($tail, "\x00\x00\x00\x00IEND\xAE\x42\x60\x82")) $type = 'image/png';
    elseif ((str_starts_with($head, 'GIF87a') || str_starts_with($head, 'GIF89a')) && str_ends_with($tail, ';')) $type = 'image/gif';
    elseif (substr($head, 0, 4) === 'RIFF' && substr($head, 8, 4) === 'WEBP' && unpack('V', substr($head, 4, 4))[1] + 8 === $size) $type = 'image/webp';
    elseif (str_starts_with($head, 'BM') && unpack('V', substr($head, 2, 4))[1] === $size) $type = 'image/bmp';
    elseif (str_starts_with($head, "\x00\x00\x01\x00")) {
        $count = unpack('v', substr($head, 4, 2))[1];
        if ($count < 1 || $count > 100 || strlen($head) < 6 + $count * 16) throw new ImageApiError('invalid_image', 422);
        for ($i = 0; $i < $count; ++$i) {
            $entry = unpack('Vlength/Voffset', substr($head, 6 + $i * 16 + 8, 8));
            if ($entry['length'] < 1 || $entry['offset'] < 6 + $count * 16 || $entry['offset'] + $entry['length'] > $size) throw new ImageApiError('invalid_image', 422);
        }
        $type = 'image/x-icon';
    } elseif (str_starts_with($head, "II\x2a\x00") || str_starts_with($head, "MM\x00\x2a")) $type = 'image/tiff';
    elseif (substr($head, 4, 4) === 'ftyp') $type = image_detect_bmff($path, $size);
    if ($type === null) throw new ImageApiError('unsupported', 415);
    $aliases = ['image/x-ms-bmp'=>'image/bmp', 'image/vnd.microsoft.icon'=>'image/x-icon', 'image/heic-sequence'=>'image/heic', 'image/heif-sequence'=>'image/heif'];
    $normalized = $aliases[$mime] ?? $mime;
    $bmff = in_array($type, ['image/avif', 'image/heic', 'image/heif'], true);
    // libmagic on some hosts reports generic binary for a structurally verified HEIF container.
    if ($normalized !== $type && !($bmff && in_array($normalized, ['application/octet-stream', 'image/heif', 'image/heic', 'image/avif'], true))) {
        throw new ImageApiError('invalid_image', 422);
    }
    $dimensions = @getimagesize($path);
    if (!$dimensions && !$bmff) throw new ImageApiError('invalid_image', 422);
    if ($dimensions && ($dimensions[0] < 1 || $dimensions[1] < 1 || $dimensions[0] * $dimensions[1] > 200000000)) throw new ImageApiError('invalid_image', 422);
    return ['mime'=>$type, 'extension'=>$extensions[$type]];
}

function image_detect_bmff(string $path, int $size): ?string {
    $file = fopen($path, 'rb');
    if ($file === false) throw new RuntimeException('Cannot read container.');
    $offset = 0; $type = null; $meta = false; $media = false; $boxes = 0;
    try {
        while ($offset + 8 <= $size && ++$boxes <= 1000) {
            fseek($file, $offset); $header = fread($file, 16);
            $length = unpack('N', substr($header, 0, 4))[1]; $box = substr($header, 4, 4); $headerSize = 8;
            if ($length === 1) {
                $wide = unpack('Nhigh/Nlow', substr($header, 8, 8));
                if ($wide['high'] !== 0) return null;
                $length = $wide['low']; $headerSize = 16;
            } elseif ($length === 0) $length = $size - $offset;
            if ($length < $headerSize || $offset + $length > $size) return null;
            if ($box === 'ftyp') {
                if ($offset !== 0 || $length < 16 || $length > 4096 || ($length - $headerSize) % 4 !== 0) return null;
                fseek($file, $offset + $headerSize); $brands = fread($file, $length - $headerSize);
                $list = [substr($brands, 0, 4)];
                for ($i=8; $i < strlen($brands); $i+=4) $list[] = substr($brands, $i, 4);
                if (array_intersect($list, ['avif', 'avis'])) $type = 'image/avif';
                elseif (array_intersect($list, ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs'])) $type = 'image/heic';
                elseif (array_intersect($list, ['mif1', 'msf1'])) $type = 'image/heif';
            }
            if ($box === 'meta' && $length > $headerSize + 4) $meta = true;
            if ($box === 'mdat' && $length > $headerSize) $media = true;
            $offset += $length;
        }
    } finally { fclose($file); }
    return ($offset === $size && $meta && $media) ? $type : null;
}

function image_upload(): array {
    image_rate_limit();
    $config = image_config();
    $requestSize = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($requestSize > $config['maxBytes'] + 1024 * 1024) throw new ImageApiError('too_large', 413);
    $upload = $_FILES['image'] ?? null;
    if (!is_array($upload) || is_array($upload['error'] ?? null)) throw new ImageApiError('no_file', 400);
    $error = $upload['error'] ?? UPLOAD_ERR_NO_FILE;
    if (in_array($error, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) throw new ImageApiError('too_large', 413);
    if ($error !== UPLOAD_ERR_OK || !is_uploaded_file($upload['tmp_name'])) throw new ImageApiError('no_file', 400);
    $size = filesize($upload['tmp_name']);
    if ($size === false || $size < 1) throw new ImageApiError('invalid_image', 422);
    if ($size > $config['maxBytes']) throw new ImageApiError('too_large', 413);
    $detected = image_detect($upload['tmp_name']);
    $id = bin2hex(random_bytes(16)); $token = bin2hex(random_bytes(32));
    $path = image_storage() . '/' . $id . '.img';
    $original = basename(str_replace('\\', '/', (string)($upload['name'] ?? 'image')));
    $name = preg_replace('/[\x00-\x1f\x7f]/', '', $original) ?: 'image.' . $detected['extension'];
    $name = substr($name, 0, 200);
    $expires = time() + $config['retentionDays'] * 86400;
    image_transaction(function(PDO $db) use ($config, $upload, $id, $token, $path, $name, $detected, $size, $expires): void {
        $usage = image_storage_usage();
        if ((int)$usage['count'] >= $config['maxFiles'] || (int)$usage['bytes'] + $size > $config['maxStorageBytes']) throw new ImageApiError('capacity', 503);
        if (!move_uploaded_file($upload['tmp_name'], $path)) throw new RuntimeException('Cannot persist image.');
        @chmod($path, 0600);
        try {
            $insert = $db->prepare('INSERT INTO images(id,token_hash,name,mime,extension,size,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?)');
            $insert->execute([$id, hash('sha256', $token), $name, $detected['mime'], $detected['extension'], $size, time(), $expires]);
        } catch (Throwable $e) { @unlink($path); throw $e; }
    });
    return ['ok'=>true, 'url'=>$config['baseUrl'] . '/image.php?id=' . $id, 'id'=>$id, 'deleteToken'=>$token, 'expiresAt'=>gmdate('Y-m-d\TH:i:s\Z', $expires), 'mime'=>$detected['mime'], 'size'=>$size, 'name'=>$name];
}

function image_delete(string $id, string $token): void {
    if (!preg_match('/^[a-f0-9]{32}$/D', $id) || !preg_match('/^[a-f0-9]{64}$/D', $token)) throw new ImageApiError('invalid_request', 400);
    image_transaction(function(PDO $db) use ($id, $token): void {
        $select = $db->prepare('SELECT token_hash FROM images WHERE id = ?'); $select->execute([$id]);
        $hash = $select->fetchColumn();
        if ($hash === false) throw new ImageApiError('not_found', 404);
        if (!hash_equals($hash, hash('sha256', $token))) throw new ImageApiError('forbidden', 403);
        $path = image_storage() . '/' . $id . '.img';
        if (is_file($path) && !@unlink($path)) throw new RuntimeException('Cannot delete image.');
        $delete = $db->prepare('DELETE FROM images WHERE id = ?'); $delete->execute([$id]);
    });
}
