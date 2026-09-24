<?php
declare(strict_types=1);

// This configuration is independent of the existing URL shortener.
$defaults = [
    'baseUrl' => getenv('NR_IMAGE_BASE_URL') ?: 'https://nikita-portfolio.com.pl',
    'storage' => getenv('NR_IMAGE_STORAGE') ?: dirname(__DIR__, 2) . '/nr-image-data',
    'allowedOrigins' => ['https://webdevnikfull.github.io'],
    'allowHttpLocal' => getenv('NR_IMAGE_ALLOW_HTTP_LOCAL') === '1',
    'maxBytes' => 10 * 1024 * 1024,
    'retentionDays' => 30,
    'maxStorageBytes' => 1024 * 1024 * 1024,
    'maxFiles' => 2000,
    'uploadsPerHourPerIp' => 20,
    'uploadsPerHourGlobal' => 200,
];
// Optional private configuration lives beside public_html, never inside it.
$override = dirname(__DIR__, 2) . '/nr-image-config.php';
if (is_file($override)) {
    $custom = require $override;
    if (!is_array($custom)) throw new RuntimeException('Invalid private configuration.');
    $defaults = array_replace($defaults, $custom);
}
$origins = getenv('NR_IMAGE_ALLOWED_ORIGINS');
if ($origins !== false) $defaults['allowedOrigins'] = array_filter(array_map('trim', explode(',', $origins)));
return $defaults;
