// Posts
// Criação dos Posts
async function createPosts() {
    const postsContainer = document.getElementById('post-form');
    postsContainer.innerHTML = ''; // Limpa o container antes de adicionar os posts
    try {
        const response = await fetch("/posts", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({title, theme, content})
        });
        const data = await response.json();
        data.forEach(post => {
            const postElement = document.createElement('div');
            postElement.classList.add('post');
            postElement.innerHTML = `
                <h3>${post.title}</h3>
                <p>${post.theme}</p>
                <p>${post.content}</p>
            `;
            postsContainer.appendChild(postElement);
        });
    } catch (error) {
        console.error('Erro ao carregar os posts:', error);
        postsContainer.innerHTML = '<p>Erro ao carregar os posts. Tente novamente mais tarde.</p>';
    }
}
