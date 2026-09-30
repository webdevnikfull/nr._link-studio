// SEOHOST: same-origin services. GitHub Pages requires the PHP hosting domain.
// No secrets belong in this file.
(() => {
 const staticHost=location.protocol==='file:'||location.hostname.endsWith('.github.io');
 const origin=staticHost?'https://nikita-portfolio.com.pl':location.origin;
 window.NR_LINK_STUDIO={apiUrl:origin+'/tools/api.php',redirectUrl:origin+'/s.php',imageApiUrl:origin+'/tools/image-api.php',portfolioUrl:'https://nikita-portfolio.com.pl/#projects'};
})();
