<?php
declare(strict_types=1);
// Optional: copy to nr-image-config.php beside public_html and adjust.
return [
    'baseUrl' => 'https://nikita-portfolio.com.pl',
    'storage' => __DIR__ . '/nr-image-data',
    'allowedOrigins' => ['https://webdevnikfull.github.io'],
    'maxBytes' => 10 * 1024 * 1024,
    'retentionDays' => 30,
    'maxStorageBytes' => 1024 * 1024 * 1024,
    'maxFiles' => 2000,
    'uploadsPerHourPerIp' => 20,
    'uploadsPerHourGlobal' => 200,
];
