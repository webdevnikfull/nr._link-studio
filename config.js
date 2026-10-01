// SEOHOST: same-origin services. GitHub Pages requires the PHP hosting domain.
// No secrets belong in this file.
(() => {
 // Keep the PHP API on SEOHOST even when the frontend uses a custom GitHub domain.
 const origin='https://nikita-portfolio.com.pl';
 window.NR_LINK_STUDIO={apiUrl:origin+'/tools/api.php',redirectUrl:origin+'/s.php',imageApiUrl:origin+'/tools/image-api.php',portfolioUrl:'https://nikita-portfolio.com.pl/#projects'};
})();
// Three-tool edition: keep only URL shortener, QR generator and image URL.
(() => {
  document.querySelectorAll('script[src*="converter"]').forEach((script) => script.remove());
  const removeConverter = () => {
    document.querySelectorAll('[href*="tool=convert"], [data-x="convertTab"], #converter-workspace').forEach((node) => node.remove());
  };
  new MutationObserver(removeConverter).observe(document.documentElement, { childList: true, subtree: true });
  removeConverter();
})();
