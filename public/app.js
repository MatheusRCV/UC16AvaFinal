// Usuários
// Criação dos Usuários
async function createUsers() {
    const form = document.getElementById('signin-form');
    const formData = new FormData(form);
    const name = formData.get('name');
    const username = formData.get('username');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm-password');

    if (password !== confirmPassword) {
        alert('As senhas não coincidem.');
        return;
    }

    try {
        const response = await fetch("/users", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({name, username, email, password})
        });
        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            // Redirecionar para login ou home
            window.location.href = 'page-login.html';
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        alert('Erro ao criar usuário. Tente novamente.');
    }
}

// Login
async function loginUser() {
    const form = document.getElementById('login-form');
    const formData = new FormData(form);
    const username = formData.get('username');
    const password = formData.get('password');
    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},  
            body: JSON.stringify({username, password})
        });
        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            // Armazenar dados do usuário no localStorage
            localStorage.setItem('user', JSON.stringify(data.user));
            // Redirecionar para a página principal
            window.location.href = 'page-post.html';
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        alert('Erro ao fazer login. Tente novamente.');
    }
}
// -----------------------------------------------------------------------------------------------------------

// Posts
// Criação dos Posts
async function createPosts() {
    const form = document.getElementById('post-form');
    if (!form) return;

    const storedUser = getStoredUser();
    if (!storedUser) {
        alert('Faça login antes de criar uma postagem.');
        return;
    }

    const formData = new FormData(form);
    const title = formData.get('title');
    const theme = formData.get('theme') || 'Geral';
    const content = formData.get('content');

    try {
        const response = await fetch('/posts', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({title, theme, content, user_id: storedUser.id})
        });
        const data = await response.json();

        if (response.ok) {
            alert(data.message || 'Postagem criada com sucesso!');
            form.reset();
            await loadFeed();
        } else {
            alert(data.error || 'Não foi possível criar a postagem.');
        }
    } catch (error) {
        console.error('Erro ao criar a postagem:', error);
        alert('Erro ao criar a postagem. Tente novamente.');
    }
}

// Função para carregar o feed de postagens automaticamente ao acessar a página
async function loadFeed() {
    const feedShow = document.querySelector('.feed-show');
    if (!feedShow) return;

    try {
        const response = await fetch('/posts');
        if (!response.ok) throw new Error('Falha ao carregar feed');
        const posts = await response.json();
        const storedUser = getStoredUser();

        if (!posts.length) {
            feedShow.innerHTML = '<p>Nenhuma postagem disponível.</p>';
            return;
        }

        feedShow.innerHTML = posts.map((post) => `
            <article class="post-card" data-post="${post.id}">
                <div class="post-card-header">
                    <div class="author-box">
                        <img class="author-avatar" src="./imgs/profile_circle_icon.webp" alt="${post.username}">
                        <div>
                            <span class="author-name">${post.username || 'Desconhecido'}</span>
                            <span class="post-time">Publicado recentemente</span>
                        </div>
                    </div>
                    <span class="post-badge">${post.theme || 'Geral'}</span>
                </div>
                <h3 class="post-title">${post.title}</h3>
                <div class="post-panel post-panel-content" data-post="${post.id}">
                    <p class="post-content">${post.content}</p>
                </div>
                <div class="post-actions">
                    <div class="post-tabs">
                        <button type="button" class="tab-button tab-active" data-post="${post.id}" data-target="content">Post</button>
                        <button type="button" class="tab-button" data-post="${post.id}" data-target="comments">Comentários</button>
                    </div>
                </div>
                <div class="post-panel post-panel-comments" data-post="${post.id}" hidden>
                    <div class="comments-list" data-post="${post.id}"></div>
                    ${storedUser ? `
                        <div class="comment-form">
                            <textarea class="comment-input" data-post="${post.id}" placeholder="Escreva um comentário..."></textarea>
                            <button type="button" class="btn comment-submit" data-post="${post.id}">Enviar comentário</button>
                        </div>
                    ` : '<p class="login-note">Faça login para comentar.</p>'}
                </div>
            </article>
        `).join('');

        setupFeedInteractions();
    } catch (error) {
        console.error('Erro ao carregar feed:', error);
        feedShow.innerHTML = '<p>Erro ao carregar o feed. Tente novamente mais tarde.</p>';
    }
}

// Função para configurar as interações do feed (alternar entre post e comentários e enviar comentários)
function setupFeedInteractions() {
    const feedShow = document.querySelector('.feed-show');
    if (!feedShow) return;

    feedShow.addEventListener('click', async (event) => {
        const tabButton = event.target.closest('.tab-button');
        if (tabButton) {
            const postId = tabButton.dataset.post;
            const target = tabButton.dataset.target;
            const card = feedShow.querySelector(`article.post-card[data-post="${postId}"]`);
            if (!card) return;

            card.querySelectorAll('.tab-button').forEach((button) => {
                button.classList.toggle('tab-active', button === tabButton);
            });
            const contentPanel = card.querySelector(`.post-panel-content[data-post="${postId}"]`);
            const commentsPanel = card.querySelector(`.post-panel-comments[data-post="${postId}"]`);
            if (contentPanel) contentPanel.hidden = target !== 'content';
            if (commentsPanel) {
                commentsPanel.hidden = target !== 'comments';
                if (target === 'comments') {
                    await loadComments(postId);
                }
            }
            return;
        }

        const commentSubmit = event.target.closest('.comment-submit');
        if (commentSubmit) {
            const postId = commentSubmit.dataset.post;
            const textarea = feedShow.querySelector(`.comment-input[data-post="${postId}"]`);
            if (!textarea) return;
            await submitComment(postId, textarea.value.trim());
            return;
        }
    });
}
// -----------------------------------------------------------------------------------------------------------

// Comentários
// Função para carregar os comentários de um post
async function loadComments(postId) {
    const commentList = document.querySelector(`.comments-list[data-post="${postId}"]`);
    if (!commentList) return;

    try {
        const response = await fetch('/comments');
        if (!response.ok) throw new Error('Falha ao carregar comentários');
        const comments = await response.json();
        const postComments = comments.filter((comment) => comment.post_id === Number(postId));

        if (!postComments.length) {
            commentList.innerHTML = '<p class="no-comments">Ainda não há comentários.</p>';
            return;
        }

        commentList.innerHTML = postComments.map((comment) => `
            <div class="comment-item">
                <div class="comment-author-box">
                    <img class="comment-avatar" src="./imgs/profile_circle_icon.webp" alt="${comment.username}">
                    <div>
                        <span class="comment-author">${comment.username}</span>
                        <span class="comment-date">Comentado recentemente</span>
                    </div>
                </div>
                <p class="comment-text">${comment.commentContent}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar comentários:', error);
        commentList.innerHTML = '<p class="no-comments">Não foi possível carregar comentários.</p>';
    }
}

// Função para enviar um comentário
async function submitComment(postId, content) {
    if (!content) {
        alert('Escreva algo antes de enviar o comentário.');
        return;
    }
    const storedUser = getStoredUser();
    if (!storedUser) {
        alert('Faça login antes de comentar.');
        return;
    }

    try {
        const response = await fetch('/comments', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ commentContent: content, user_id: storedUser.id, post_id: Number(postId) })
        });
        const data = await response.json();
        if (!response.ok) {
            alert(data.error || 'Não foi possível enviar o comentário.');
            return;
        }
        await loadComments(postId);
        const textarea = document.querySelector(`.comment-input[data-post="${postId}"]`);
        if (textarea) textarea.value = '';
    } catch (error) {
        console.error('Erro ao enviar comentário:', error);
        alert('Erro ao enviar comentário. Tente novamente.');
    }
}
// -----------------------------------------------------------------------------------------------------------

// Configurações do Usuário
// Função para obter o usuário armazenado no localStorage
function getStoredUser() {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    try {
        return JSON.parse(stored);
    } catch (error) {
        console.error('Erro ao ler usuário armazenado:', error);
        return null;
    }
}

// Função para carregar o perfil do usuário
async function loadUserProfile() {
    const profileName = document.getElementById('profile-name');
    const userInfo = document.getElementById('user-info');
    const postsList = document.getElementById('posts-list');
    const noPostsMessage = document.getElementById('no-posts-message');
    
    if (!profileName || !userInfo) return;
    
    const storedUser = getStoredUser();
    if (!storedUser) {
        profileName.textContent = 'Nenhum usuário autenticado';
        userInfo.innerHTML = '<p>Faça login para ver seu perfil.</p>';
        if (postsList) postsList.innerHTML = '';
        if (noPostsMessage) {
            noPostsMessage.style.display = 'none';
        }
        return;
    }

    try {
        const response = await fetch('/users');
        const users = response.ok ? await response.json() : [];
        const currentUser = users.find((u) => u.id === storedUser.id) || storedUser;
        
        profileName.textContent = currentUser.name || currentUser.username || 'Perfil do Usuário';
        
        const details = [];
        if (currentUser.username) {
            details.push(`<p><strong>Usuário:</strong> ${currentUser.username}</p>`);
        }
        if (currentUser.name) {
            details.push(`<p><strong>Nome Completo:</strong> ${currentUser.name}</p>`);
        }
        if (currentUser.email) {
            details.push(`<p><strong>Email:</strong> ${currentUser.email}</p>`);
        }

        userInfo.innerHTML = details.length ? details.join('') : '<p>Sem informações disponíveis.</p>';

        if (postsList) {
            await loadUserPosts(currentUser.id);
        }
    } catch (error) {
        console.error('Erro ao carregar perfil do usuário:', error);
        profileName.textContent = storedUser.name || storedUser.username || 'Perfil do Usuário';
        userInfo.innerHTML = `
        ${storedUser.username ? `<p><strong>Usuário:</strong> ${storedUser.username}</p>` : ''}
        ${storedUser.name ? `<p><strong>Nome Completo:</strong> ${storedUser.name}</p>` : ''}
        ${storedUser.email ? `<p><strong>Email:</strong> ${storedUser.email}</p>` : ''}
        `;
        if (postsList) {
            await loadUserPosts(storedUser.id);
        }
    }
}

// Função para carregar as postagens do usuário
async function loadUserPosts(userId) {
    const postsList = document.getElementById('posts-list');
    const noPostsMessage = document.getElementById('no-posts-message');
    if (!postsList) return;
    
    try {
        const response = await fetch('/posts');
        if (!response.ok) throw new Error('Falha ao carregar postagens');
        const posts = await response.json();
        const userPosts = posts.filter((post) => post.user_id === userId);

        if (userPosts.length === 0) {
            postsList.innerHTML = '';
            if (noPostsMessage) noPostsMessage.style.display = 'block';
            return;
        }

        noPostsMessage.style.display = 'none';
        postsList.innerHTML = userPosts
        .map((post) => `<li><a href="page-post.html">${post.title}</a></li>`)
        .join('');
    } catch (error) {
        console.error('Erro ao carregar postagens do usuário:', error);
        postsList.innerHTML = '';
        if (noPostsMessage) noPostsMessage.style.display = 'block';
    }
}

// Função para carregar as informações do usuário no formulário de configurações
async function loadSettingsProfile() {
    const storedUser = getStoredUser();
    const settingsForm = document.getElementById('settings-form');
    if (!storedUser || !settingsForm) return;

    const usernameInput = document.getElementById('username');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');

    if (usernameInput) usernameInput.value = storedUser.username || '';
    if (nameInput) nameInput.value = storedUser.name || '';
    if (emailInput) emailInput.value = storedUser.email || '';
}

// Função para salvar as alterações do usuário
async function saveSettings() {
    const storedUser = getStoredUser();
    if (!storedUser) {
        alert('Faça login antes de alterar as configurações.');
        return;
    }

    const form = document.getElementById('settings-form');
    if (!form) return;
    
    const formData = new FormData(form);
    const username = formData.get('username');
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm-password');

    if (password && password !== confirmPassword) {
        alert('As senhas não coincidem.');
        return;
    }

    const payload = { username, name, email };
    if (password) payload.password = password;
    
    try {
        const response = await fetch(`/users/${storedUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        
        if (!response.ok) {
            alert(data.error || 'Não foi possível salvar as alterações.');
            return;
        }

        alert(data.message || 'Configurações atualizadas com sucesso.');
        const usersResponse = await fetch('/users');
        if (usersResponse.ok) {
            const users = await usersResponse.json();
            const updatedUser = users.find((u) => u.id === storedUser.id);
            if (updatedUser) {
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        }

        await loadSettingsProfile();
        await loadUserProfile();
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        alert('Erro ao salvar configurações. Tente novamente.');
    }
}
// -----------------------------------------------------------------------------------------------------------

// Event listeners para os formulários
document.addEventListener('DOMContentLoaded', async () => {
    const signinForm = document.getElementById('signin-form');
    if (signinForm) {
        signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await createUsers();
        });
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await loginUser();
        });
    }

    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        await loadSettingsProfile();
        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveSettings();
        });
    }

    const profileName = document.getElementById('profile-name');
    if (profileName) {
        await loadUserProfile();
    }

    const postForm = document.getElementById('post-form');
    if (postForm) {
        const contentTextarea = document.getElementById('content');
        if (contentTextarea) {
            const resizeTextarea = () => {
                contentTextarea.style.height = 'auto';
                contentTextarea.style.height = `${contentTextarea.scrollHeight}px`;
            };
            contentTextarea.addEventListener('input', resizeTextarea);
            resizeTextarea();
        }

        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await createPosts();
        });
    }

    const feedShow = document.querySelector('.feed-show');
    if (feedShow) {
        await loadFeed();
    }
});
