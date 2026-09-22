# NR. Link Studio — URL & QR

Jeden projekt z dwoma narzędziami: skracaczem linków i generatorem kodów QR.
Interfejs PL / EN / DE, ciemny i jasny motyw, eksport PNG i SVG.

## GitHub Pages

1. Utwórz repozytorium `nr-link-studio` na koncie `webdevnikfull`.
2. Wgraj zawartość tej paczki do głównego katalogu repozytorium. `index.html` powinien być bezpośrednio w katalogu głównym.
3. **Settings → Pages → Build and deployment → Deploy from a branch**, gałąź `main`, folder `/ (root)` → **Save**.
4. Po publikacji projekt będzie pod adresem `https://webdevnikfull.github.io/nr-link-studio/`.

To planowany adres: repozytorium ani publikacja nie zostały utworzone w ramach przygotowania plików. Przy innej nazwie repozytorium zmień także odnośnik w karcie portfolio.

Nie potrzebujesz npm ani procesu budowania. Zasoby mają względne ścieżki i działają w podkatalogu GitHub Pages. `.nojekyll` wyłącza przetwarzanie Jekyll.

## Skracacz: zaplecze na SEOHOST

Generator QR działa od razu po publikacji. Skracacz wymaga aktualnego zaplecza PHP z paczki `portfolio-jeden-projekt-seohost.zip`, wgranego na `nikita-portfolio.com.pl`. GitHub Pages nie wykonuje PHP.

Pliki zaplecza z paczki portfolio:

- `public_html/tools/api.php`
- `public_html/tools/store.php`
- `public_html/tools/server-config.php`
- `public_html/s.php`
- prywatny katalog `nr-link-data` **obok**, nie wewnątrz `public_html`.

Potrzebne są PHP 8.3+ i `pdo_sqlite`. Szczegółowe wymagania i limity opisuje instrukcja w paczce portfolio. Przy aktualizacji nie nadpisuj istniejącej bazy danych.

`config.js` ma już adresy:

```js
window.NR_LINK_STUDIO = {
  apiUrl: 'https://nikita-portfolio.com.pl/tools/api.php',
  redirectUrl: 'https://nikita-portfolio.com.pl/s.php',
  portfolioUrl: 'https://nikita-portfolio.com.pl/#projects'
};
```

`server-config.php` dopuszcza origin `https://webdevnikfull.github.io` — bez nazwy repozytorium i końcowego ukośnika. Przy innej domenie aplikacji dodaj jej dokładny origin do listy. Nie potrzeba ujawniać haseł ani kluczy API.

Nowa karta portfolio zawiera jeden projekt NR. Link Studio i odnośnik do planowanego adresu GitHub Pages.

## Kontrola po wdrożeniu

1. Otwórz GitHub Pages, wygeneruj QR, pobierz PNG / SVG i zeskanuj telefonem.
2. Przełącz na skracacz, wpisz adres i utwórz link.
3. Otwórz krótki link w drugiej przeglądarce.
4. Kliknij „Utwórz QR” — adres przejdzie do drugiej zakładki tej samej aplikacji.

Przed wgraniem zaplecza skracacz może zgłaszać niedostępność. Nie tworzy fikcyjnych linków działających tylko na jednym komputerze.

## Testy

Lokalnie sprawdzono: dozwolone i odrzucane originy, preflight CORS, tworzenie linku między dwoma originami, przekierowanie HTTP 302 i przepływ skracacz → QR w jednej aplikacji. Poprzednia wersja przeszła także 16 sprawdzeń API oraz niezależne dekodowanie eksportów PNG i SVG.

Nie opublikowano projektu na GitHub Pages i nie zmieniono działającej strony SEOHOST.

Biblioteka: qrcode-generator 2.0.4 (MIT), lokalnie w `vendor/`.
Dokumentacja: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
