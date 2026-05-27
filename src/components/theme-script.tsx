// Script anti-flash. Disuntik sebelum body render: membaca preferensi tema dari
// localStorage (atau prefers-color-scheme) lalu menambahkan class `dark` pada <html>
// sebelum browser melukis pertama kali — sehingga tidak ada kedip putih → gelap.
export function ThemeScript() {
  const code = `
    (function() {
      try {
        var t = localStorage.getItem('theme') || 'system';
        var mq = window.matchMedia('(prefers-color-scheme: dark)');
        var isDark = t === 'dark' || (t === 'system' && mq.matches);
        document.documentElement.classList.toggle('dark', isDark);
        document.documentElement.dataset.theme = t;
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
