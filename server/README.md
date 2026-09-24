# Zaplecze Image → URL

Ten dodatek zapisuje obrazy na Twoim hostingu i zwraca prawdziwe publiczne adresy HTTPS. GitHub Pages obsługuje interfejs, a hosting PHP przechowuje pliki. Pliki nie są wysyłane do zewnętrznego serwisu obrazów. Samo wgranie plików interfejsu na GitHub Pages nie uruchomi przesyłania obrazów.

## Wdrożenie na SEOHOST

Wymagania: PHP 8.3+, rozszerzenia `pdo_sqlite` i `fileinfo`, prawo zapisu do prywatnego katalogu poza `public_html`. GD i Imagick nie są wymagane. W ustawieniach PHP ustaw `upload_max_filesize = 11M` oraz `post_max_size = 12M` (lub większe); aplikacja samodzielnie egzekwuje 10 MiB dla obrazu. Limit żądania w serwerze WWW/WAF musi umożliwiać te przesłania.

1. Zawartość `server/public_html` połącz z istniejącym katalogiem `public_html` na hostingu. Dodawane pliki to `image.php` i trzy pliki `tools/image-*.php`. Nie zastępuj całego katalogu strony i nie usuwaj plików istniejącego skracacza.
2. Utwórz zapisywalny katalog `nr-image-data` **obok** `public_html`. Przykładowo oba katalogi powinny mieć tego samego rodzica. Nie umieszczaj `nr-image-data` w katalogu publicznym. Kod odmówi działania, jeśli wykryje taki układ.
3. Opcjonalnie skopiuj `nr-image-config.example.php` jako `nr-image-config.php` obok `public_html`. Ten plik pozwala dostosować domenę, katalog i limity. Domyślna domena to `https://nikita-portfolio.com.pl`, a dozwolony origin interfejsu to `https://webdevnikfull.github.io`. Origin nie zawiera nazwy repozytorium, ścieżki ani końcowego ukośnika. Ta sama domena co API także jest dozwolona.
4. W konfiguracji interfejsu ustaw `imageApiUrl` na `https://nikita-portfolio.com.pl/tools/image-api.php`.
5. Otwórz endpoint w przeglądarce. Poprawny stan to JSON zawierający `ok: true`, `maxBytes: 10485760` i `retentionDays: 30`.
6. Z interfejsu wyślij obraz, otwórz otrzymany adres w innej przeglądarce, następnie usuń obraz przyciskiem w aplikacji i sprawdź, że link przestał działać.

Nowe zaplecze ma osobną bazę `nr-image-data/images.sqlite`. Nie korzysta z bazy skracacza ani jej nie modyfikuje. Katalog z obrazami i bazą zachowaj podczas kolejnych aktualizacji. Nie umieszczaj go w repozytorium ani w paczce z frontendem.

## Czas przechowywania i limity

- Obraz: maksymalnie 10 MiB (10 485 760 bajtów).
- Link jest dostępny przez 30 dni od wysłania. Po tym czasie serwer odmawia wydania pliku nawet przed fizycznym usunięciem.
- Łącznie: 1 GiB plików i 2000 obrazów. Do limitu wliczają się również pliki osierocone przez przerwane operacje.
- W stałej godzinie UTC: 20 prób wysłania na adres IP i 200 prób globalnie. Błędne przesłania też zużywają limit. Uwzględniany jest adres bezpośredniego połączenia, nie nagłówki przesłane przez klienta. Przy reverse proxy dostosuj konfigurację zaufanych adresów w serwerze WWW; ten kod nie ufa automatycznie `X-Forwarded-For`.
- API usuwa do 25 wygasłych obrazów przy żądaniu. Dla regularnego sprzątania skopiuj `cleanup.php` obok `public_html` i uruchamiaj raz dziennie przez zadanie cron: `php /pełna/ścieżka/cleanup.php`. Skrypt usuwa wygasłe wpisy oraz do 100 plików osieroconych starszych niż godzinę. Nie jest endpointem WWW.

## Formaty i zachowanie

Serwer rozpoznaje zawartość pliku, a nie tylko jego nazwę: JPEG/JPG, PNG/APNG, GIF, WebP, AVIF, BMP, ICO, TIFF/TIF, HEIC i HEIF. Typ MIME z formularza jest ignorowany. Typy rastrowe sprawdzane są przez sygnaturę, `fileinfo` i metadane obrazu. Dla AVIF/HEIC/HEIF dodatkowo sprawdzana jest struktura kontenera ISO BMFF i marki formatu. Nie są obsługiwane wszystkie możliwe odmiany formatów, np. BigTIFF; niepoprawne i nierozpoznane pliki są odrzucane.

SVG jest odrzucany przez API, ponieważ może zawierać aktywną zawartość. Interfejs może wcześniej zamienić bezpieczny SVG na PNG i przesłać wynik. Podgląd HEIC, HEIF, TIFF i niektórych innych formatów zależy od możliwości przeglądarki. Serwer zachowuje plik w oryginalnym formacie; nie obiecuje jego dekodowania przez każdą przeglądarkę.

Publiczny link nie jest hasłem. Każda osoba posiadająca URL może pobrać obraz. Serwer nie usuwa metadanych EXIF/GPS i nie zmniejsza obrazów. Kod usunięcia jest zwracany tylko przy wysłaniu; baza przechowuje wyłącznie jego skrót SHA-256. Usuwanie wymaga tego kodu. Nie zapisuj go w publicznym URL.

Pliki mają losowe nazwy i znajdują się poza katalogiem WWW. Wydawane są przez `image.php` z ustalonym MIME, `nosniff`, CSP `sandbox` i bez cache przeglądarki/proxy. Nazwa użytkownika nie służy do wyznaczania ścieżki ani nagłówka pobierania. Zaplecze nie wykonuje zawartości plików. Oryginalne metadane są zachowywane, dlatego nie traktuj tej aplikacji jako narzędzia do anonimizacji zdjęć.

## API

`GET /tools/image-api.php`

```json
{"ok":true,"maxBytes":10485760,"formats":["jpg","jpeg","png","apng","gif","webp","avif","bmp","ico","tif","tiff","heic","heif"],"retentionDays":30}
```

`POST /tools/image-api.php`: formularz `multipart/form-data`, pole `image`. Wymagany dozwolony `Origin` (przeglądarka ustawia go automatycznie). Sukces HTTP 201:

```json
{"ok":true,"url":"https://nikita-portfolio.com.pl/image.php?id=32-znaki-hex","id":"32-znaki-hex","deleteToken":"64-znaki-hex","expiresAt":"2026-10-24T12:00:00Z","mime":"image/png","size":12345,"name":"photo.png"}
```

`DELETE /tools/image-api.php`: JSON `{"id":"…","deleteToken":"…"}`, nagłówek `Content-Type: application/json`, dozwolony `Origin`. Sukces: `{"ok":true,"deleted":true}`.

`GET` / `HEAD /image.php?id=…`: publiczny obraz. Nie wymaga originu ani kodu usunięcia. Nie istniejący obraz daje 404; wygasły, jeszcze niesprzątnięty wpis — 410.

Błędy mają postać `{"ok":false,"error":"kod"}`. Kody: `unavailable`, `method`, `origin`, `too_large`, `no_file`, `unsupported`, `invalid_image`, `rate_limit`, `capacity`, `invalid_request`, `not_found`, `forbidden`, `expired`. Przy 429 odpowiedź zawiera `Retry-After`. Komunikaty błędów serwera nie ujawniają ścieżek i szczegółów bazy; szczegóły trafiają do prywatnego logu PHP.

## Testy lokalne

```sh
python tests/test_api.py --php /ścieżka/do/php
```

Test uruchamia własny serwer PHP na losowym porcie loopback i tworzy oddzielny tymczasowy katalog. Nie łączy się z produkcją. Opcjonalnie `--temp-root /ścieżka/z/prawem/zapisu` zmienia katalog roboczy testu. W pakiecie są 25 testów integracyjnych: rzeczywiste HTTP, osiem formatów, upload/pobranie/usunięcie, limit rozmiaru, quota dysku, CORS, wygaśnięcie, walidacja i tokeny. HEIC/HEIF mają implementację walidacji kontenera, ale zestaw nie zawiera rzeczywistego pliku testowego HEIC/HEIF.

Dla ręcznego podglądu lokalnego ustaw jawnie zmienne środowiskowe `NR_IMAGE_BASE_URL=http://127.0.0.1:8782`, `NR_IMAGE_ALLOW_HTTP_LOCAL=1`, `NR_IMAGE_ALLOWED_ORIGINS=http://127.0.0.1:8781`, `NR_IMAGE_STORAGE=/prywatny/katalog/testowy`, a następnie uruchom `php -S 127.0.0.1:8782 -t public_html`. Potrzebne rozszerzenia PHP i limity uploadu muszą być aktywne. Te ustawienia są tylko do testów; domyślna konfiguracja produkcyjna nie dopuszcza localhost ani dowolnych originów.

Dokumentacja PHP: [przesyłanie plików](https://www.php.net/manual/en/features.file-upload.post-method.php), [Fileinfo](https://www.php.net/manual/en/book.fileinfo.php), [getimagesize](https://www.php.net/manual/en/function.getimagesize.php).
