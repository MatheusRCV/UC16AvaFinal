const head = document.getElementById('head');
const body = document.getElementById('body');

const styleGlobals = `<link rel="stylesheet" href="./globals.css">`;
head.innerHTML += styleGlobals;

const footer = document.createElement('footer');
footer.setAttribute('id', 'footer');
footer.setAttribute('class', 'footer');
body.appendChild(footer);

footer.innerHTML += `
    <p>2026 Retro Blogger - Site para fins educacionais</p>
    `;

function logout() {
    // Limpar dados de sessão, se houver
    localStorage.removeItem('user');
    sessionStorage.clear();
    // Redirecionar para login
    window.location.href = 'page-login.html';
}

// Animação de fade-in ao carregar a página
window.addEventListener('load', () => {
    setTimeout(() => {
        body.style.opacity = '1';
    }, 200);
});

// Animação de fade-out ao clicar em links internos
document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.href && link.href.startsWith(window.location.origin) && !link.hasAttribute('download') && !link.getAttribute('target')) {
        e.preventDefault();
        body.style.opacity = '0';
        setTimeout(() => {
            window.location.href = link.href;
        }, 500);
    }
});