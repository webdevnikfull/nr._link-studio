<?php
declare(strict_types=1);
// Run this through CLI cron; keep it outside public_html.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require __DIR__ . '/public_html/tools/image-store.php';
$total = 0;
do { $removed = image_cleanup(500); $total += $removed; } while ($removed === 500);
echo "Removed {$total} expired images.\n";
$orphans = image_cleanup_orphans();
echo "Removed {$orphans} orphaned files.\n";
