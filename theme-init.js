/* Apply the saved theme before the first paint to avoid a light flash. */
try {
 document.documentElement.dataset.theme=localStorage.getItem('qa-portfolio-theme')==='dark'?'dark':'light';
} catch { document.documentElement.dataset.theme='light'; }
