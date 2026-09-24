"""HTTP integration tests. Usage: python tests/test_api.py --php /path/to/php

Requires PHP 8.3+ with pdo_sqlite and fileinfo; Python standard library only.
Creates isolated temporary storage, starts its own loopback PHP server, and never
connects to or modifies a deployed service.
"""
import argparse
import base64
import hashlib
import hmac
import json
import os
from pathlib import Path
import socket
import sqlite3
import struct
import subprocess
import tempfile
import time
import unittest
import uuid
import shutil
from contextlib import contextmanager
from urllib.error import HTTPError
from urllib.request import Request, urlopen
import zlib

SERVER = Path(__file__).resolve().parents[1]
# Keep unittest's own switches available.
parser = argparse.ArgumentParser(add_help=False)
parser.add_argument('--php', default='php')
parser.add_argument('--temp-root', default=tempfile.gettempdir())
ARGS, REMAINING = parser.parse_known_args()

@contextmanager
def database(path):
    connection = sqlite3.connect(path)
    try:
        with connection:
            yield connection
    finally:
        connection.close()

def png_chunk(kind, data):
    return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xffffffff)

PNG = b'\x89PNG\r\n\x1a\n' + png_chunk(b'IHDR', struct.pack('>IIBBBBB', 1, 1, 8, 2, 0, 0, 0)) + png_chunk(b'IDAT', zlib.compress(b'\x00\x1e\x32\x64')) + png_chunk(b'IEND', b'')
GIF = base64.b64decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7')
WEBP = base64.b64decode('UklGRjQAAABXRUJQVlA4ICgAAACwAQCdASoCAAIAAUAmJZgCdLoABGaAAP75BGf6rxBme1/rynxK0AAA')
TIFF = base64.b64decode('SUkqAAgAAAAKAAABBAABAAAAAgAAAAEBBAABAAAAAgAAAAIBAwADAAAAhgAAAAMBAwABAAAAAQAAAAYBAwABAAAAAgAAABEBBAABAAAAjAAAABUBAwABAAAAAwAAABYBBAABAAAAAgAAABcBBAABAAAADAAAABwBAwABAAAAAQAAAAAAAAAIAAgACAAeMmQeMmQeMmQeMmQ=')
AVIF = base64.b64decode('AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADrbWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAAAAAAAOcGl0bQAAAAAAAQAAAB5pbG9jAAAAAEQAAAEAAQAAAAEAAAETAAAAKAAAAChpaW5mAAAAAAABAAAAGmluZmUCAAAAAAEAAGF2MDFDb2xvcgAAAABqaXBycAAAAEtpcGNvAAAAFGlzcGUAAAAAAAAAAgAAAAIAAAAQcGl4aQAAAAADCAgIAAAADGF2MUOBAAwAAAAAE2NvbHJuY2x4AAEADQAGgAAAABdpcG1hAAAAAAAAAAEAAQQBAoMEAAAAMG1kYXQSAAoIGAA2iAhoNCAyGhTHh4ZlAgggnlAAAABIWtlc1jCriW4Ubr4+')
JPEG = base64.b64decode('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAACAAIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDzGiiivZOM/9k=')
BMP = b'BM' + struct.pack('<IHHI', 58, 0, 0, 54) + struct.pack('<IiiHHIIiiII', 40, 1, 1, 1, 24, 0, 4, 2835, 2835, 0, 0) + b'\x64\x32\x1e\x00'
ICO = struct.pack('<HHH', 0, 1, 1) + struct.pack('<BBBBHHII', 1, 1, 0, 0, 1, 32, len(PNG), 22) + PNG

class ImageApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp_parent = Path(ARGS.temp_root).resolve()
        cls.temp_parent.mkdir(parents=True, exist_ok=True)
        cls.temp = cls.temp_parent / ('nr-image-api-' + uuid.uuid4().hex)
        cls.temp.mkdir()
        cls.storage = cls.temp / 'private-images'
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0)); port = sock.getsockname()[1]
        cls.base = f'http://127.0.0.1:{port}'
        cls.origin = 'https://webdevnikfull.github.io'
        env = dict(os.environ, NR_IMAGE_STORAGE=str(cls.storage), NR_IMAGE_BASE_URL=cls.base,
                   NR_IMAGE_ALLOW_HTTP_LOCAL='1', NR_IMAGE_ALLOWED_ORIGINS=cls.origin)
        command = [ARGS.php]
        ext = Path(ARGS.php).resolve().parent / 'ext'
        if ext.is_dir():
            command += ['-d', f'extension_dir={ext}']
        command += ['-d', 'extension=pdo_sqlite', '-d', 'extension=fileinfo', '-d', 'upload_max_filesize=11M',
                    '-d', 'post_max_size=12M', '-d', 'display_errors=0', '-S', f'127.0.0.1:{port}', '-t', str(SERVER / 'public_html')]
        cls.log = open(cls.temp / 'php.log', 'w+b')
        cls.process = subprocess.Popen(command, env=env, stdout=cls.log, stderr=cls.log, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
        for _ in range(100):
            try:
                with urlopen(cls.base + '/tools/image-api.php', timeout=1) as response:
                    if response.status == 200: return
            except Exception: time.sleep(.05)
        cls.log.seek(0)
        raise RuntimeError(cls.log.read().decode(errors='replace'))

    @classmethod
    def tearDownClass(cls):
        cls.process.terminate(); cls.process.wait(timeout=5); cls.log.close()
        assert cls.temp.resolve().parent == cls.temp_parent and cls.temp.name.startswith('nr-image-api-')
        shutil.rmtree(cls.temp)

    def setUp(self):
        with database(self.storage / 'images.sqlite') as db:
            db.execute('DELETE FROM attempts'); db.execute('DELETE FROM images')
        for file in self.storage.glob('*.img'): file.unlink()

    def request(self, path='/tools/image-api.php', method='GET', data=None, headers=None):
        request = Request(self.base + path, data=data, headers=headers or {}, method=method)
        try: response = urlopen(request, timeout=10)
        except HTTPError as error: response = error
        with response:
            return response.status, response.headers, response.read()

    def upload(self, data=PNG, name='image.png', origin=None):
        boundary = 'NRImageIntegrationBoundary'
        body = f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="{name}"\r\nContent-Type: image/png\r\n\r\n'.encode() + data + f'\r\n--{boundary}--\r\n'.encode()
        status, headers, body = self.request(method='POST', data=body, headers={'Origin': origin or self.origin, 'Content-Type': f'multipart/form-data; boundary={boundary}'})
        return status, headers, json.loads(body)

    def delete(self, result, token=None):
        return self.request(method='DELETE', data=json.dumps({'id':result['id'], 'deleteToken':token or result['deleteToken']}).encode(), headers={'Origin':self.origin, 'Content-Type':'application/json'})

    def test_capabilities(self):
        status, headers, body = self.request()
        self.assertEqual(status, 200); data = json.loads(body)
        self.assertEqual(data['maxBytes'], 10485760); self.assertEqual(data['retentionDays'], 30)
        self.assertIn('heic', data['formats']); self.assertNotIn('svg', data['formats'])

    def test_upload_contract_and_retrieval(self):
        status, headers, result = self.upload()
        self.assertEqual(status, 201); self.assertTrue(result['ok'])
        self.assertRegex(result['id'], r'^[a-f0-9]{32}$'); self.assertRegex(result['deleteToken'], r'^[a-f0-9]{64}$')
        self.assertEqual(result['url'], self.base + '/image.php?id=' + result['id'])
        self.assertEqual(result['size'], len(PNG)); self.assertEqual(result['mime'], 'image/png')
        status, headers, body = self.request('/image.php?id=' + result['id'])
        self.assertEqual((status, body), (200, PNG)); self.assertEqual(headers['Content-Type'], 'image/png')
        self.assertEqual(headers['X-Content-Type-Options'], 'nosniff'); self.assertIn('sandbox', headers['Content-Security-Policy'])
        self.assertEqual(headers['Cache-Control'], 'no-store, max-age=0')

    def test_real_common_formats(self):
        for name, content, mime in [('jpg',JPEG,'image/jpeg'), ('gif',GIF,'image/gif'), ('webp',WEBP,'image/webp'), ('tiff',TIFF,'image/tiff'), ('avif',AVIF,'image/avif'), ('bmp',BMP,'image/bmp'), ('ico',ICO,'image/x-icon')]:
            with self.subTest(format=name):
                status, _, result = self.upload(content, 'sample.' + name)
                self.assertEqual(status, 201, result); self.assertEqual(result['mime'], mime)

    def test_php_filename_cannot_execute(self):
        status, _, result = self.upload(PNG, '../../danger.php')
        self.assertEqual(status, 201); self.assertEqual(result['name'], 'danger.php')
        status, headers, body = self.request('/image.php?id=' + result['id'])
        self.assertEqual(body, PNG); self.assertNotIn('danger', headers['Content-Disposition'])

    def test_svg_is_rejected(self):
        status, _, result = self.upload(b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', 'image.svg')
        self.assertEqual(status, 415); self.assertEqual(result['error'], 'unsupported')

    def test_html_named_jpeg_is_rejected(self):
        self.assertEqual(self.upload(b'<html><script>alert(1)</script></html>', 'photo.jpg')[0], 415)

    def test_truncated_png_is_rejected(self):
        self.assertEqual(self.upload(PNG[:-12])[0], 415)

    def test_oversize_is_rejected(self):
        status, _, result = self.upload(b'x' * (10485760 + 1))
        self.assertEqual(status, 413); self.assertEqual(result['error'], 'too_large')

    def test_empty_upload_is_rejected(self):
        self.assertEqual(self.upload(b'')[0], 422)

    def test_origin_is_exact(self):
        for origin in ['https://webdevnikfull.github.io.attacker.example','null','http://localhost:3000']:
            with self.subTest(origin=origin): self.assertEqual(self.upload(origin=origin)[0], 403)

    def test_missing_origin_cannot_mutate(self):
        self.assertEqual(self.request(method='POST',data=b'')[0], 403)

    def test_same_host_origin_allowed(self):
        self.assertEqual(self.upload(origin=self.base)[0], 201)

    def test_cors_and_delete_preflight(self):
        status, headers, _ = self.request(method='OPTIONS', headers={'Origin':self.origin,'Access-Control-Request-Method':'DELETE','Access-Control-Request-Headers':'content-type'})
        self.assertEqual(status, 204); self.assertEqual(headers['Access-Control-Allow-Origin'], self.origin)
        self.assertIn('DELETE', headers['Access-Control-Allow-Methods']); self.assertIsNone(headers.get('Access-Control-Allow-Credentials'))

    def test_unknown_preflight_header_rejected(self):
        self.assertEqual(self.request(method='OPTIONS',headers={'Origin':self.origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'x-evil'})[0],403)

    def test_owner_can_delete(self):
        _, _, result = self.upload()
        status, _, body = self.delete(result)
        self.assertEqual(status, 200); self.assertTrue(json.loads(body)['deleted'])
        self.assertFalse((self.storage / (result['id']+'.img')).exists())
        self.assertEqual(self.request('/image.php?id='+result['id'])[0],404)

    def test_wrong_delete_token_denied(self):
        _, _, result = self.upload()
        self.assertEqual(self.delete(result, 'f'*64)[0], 403)
        self.assertEqual(self.request('/image.php?id='+result['id'])[0], 200)

    def test_tokens_stored_only_as_hashes(self):
        _, _, result = self.upload()
        with database(self.storage / 'images.sqlite') as db:
            token_hash = db.execute('SELECT token_hash FROM images WHERE id=?',(result['id'],)).fetchone()[0]
        self.assertNotEqual(token_hash, result['deleteToken'])
        self.assertEqual(token_hash, hashlib.sha256(result['deleteToken'].encode()).hexdigest())

    def test_repeated_delete_is_not_found(self):
        _, _, result = self.upload(); self.delete(result)
        self.assertEqual(self.delete(result)[0],404)

    def test_path_traversal_and_array_id_rejected(self):
        for path in ['/image.php?id=../../tools/image-config.php','/image.php?id[]=abc','/image.php?id='+'f'*32]:
            with self.subTest(path=path): self.assertEqual(self.request(path)[0],404)

    def test_expiry_and_cleanup(self):
        _, _, result = self.upload()
        with database(self.storage / 'images.sqlite') as db: db.execute('UPDATE images SET expires_at=0')
        self.assertEqual(self.request('/image.php?id='+result['id'])[0],410)
        self.assertEqual(self.request()[0],200)
        self.assertFalse((self.storage / (result['id']+'.img')).exists())

    def test_rate_limit(self):
        for _ in range(20): self.assertEqual(self.upload(b'')[0],422)
        status, headers, result = self.upload()
        self.assertEqual(status,429); self.assertEqual(result['error'],'rate_limit'); self.assertIsNotNone(headers['Retry-After'])

    def test_global_capacity(self):
        _, _, result = self.upload()
        # A sparse fixture exercises real on-disk accounting without a 1 GiB upload.
        with (self.storage / (result['id']+'.img')).open('r+b') as file: file.truncate(1024**3)
        status, _, result = self.upload()
        self.assertEqual(status,503); self.assertEqual(result['error'],'capacity')

    def test_head_retrieves_metadata_only(self):
        _, _, result = self.upload()
        status, headers, body = self.request('/image.php?id='+result['id'], method='HEAD')
        self.assertEqual(status,200); self.assertEqual(body,b''); self.assertEqual(int(headers['Content-Length']),len(PNG))

    def test_invalid_delete_payload_rejected(self):
        for body in [b'{', b'[]', b'{"id":[],"deleteToken":"x"}']:
            with self.subTest(body=body): self.assertEqual(self.request(method='DELETE', data=body, headers={'Origin':self.origin,'Content-Type':'application/json'})[0],400)

    def test_unsupported_method(self):
        self.assertEqual(self.request(method='PUT')[0],405)

if __name__ == '__main__': unittest.main(argv=['test_api.py'] + REMAINING, verbosity=2)
