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