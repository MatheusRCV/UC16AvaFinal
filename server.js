const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = 3000;

const USERS_FILE = path.join(__dirname, 'database', 'users.json');
const POSTS_FILE = path.join(__dirname, 'database', 'posts.json');
const COMMENTS_FILE = path.join(__dirname, 'database', 'comments.json');

function readJSON(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
};
function writeJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};
function randomID(data) {
    if (data.length === 0) return 1;
    const maxId = Math.max(...data.map(item => item.id));
    return maxId + 1
};
// *******************************************************************************
// Users CRUD
// Cadastro
app.post('/users', (req, res) => {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const users = readJSON(USERS_FILE);
    if (users.find(u => u.username === username)) {
        return res.status(409).json({ error: 'Nome de usuário já existe' });
    } else if (users.find(u => u.email === email)) {
        return res.status(409).json({ error: 'Endereço de email já existe' });
    } else if (password.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    const newUser = { id: randomID(users), name, username, email, password };

    users.push(newUser);
    writeJSON(USERS_FILE, users);
    res.status(201).json({message: `Seu cadastro foi realizado com sucesso!`, user: { id: newUser.id, name, username, email }});
});

// Listagem
app.get('/users', (req, res) => {
    const users = readJSON(USERS_FILE);
    const sanitized = users.map(u => ({id: u.id, name: u.name, username: u.username, email: u.email}));
    res.json(sanitized);
});

// Atualizar Usuário
app.put('/users/:id', (req, res) => {
    const users = readJSON(USERS_FILE);
    const { id } = req.params;
    const { name, username, email, password } = req.body;
    const updates = {};
    
    // Criação do Index para pesquisar o usuário.
    const usersIndex = users.findIndex(u => u.id == id);
    if (usersIndex === -1) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Condicionais que evitam valores inválidos nos campos da database.
    if (name !== undefined && name === "") {
        return res.status(400).json({ error: "Nome não pode ser vazio" });
    }
    if (username !== undefined && username === "") {
        return res.status(400).json({ error: "Username não pode ser vazio" });
    }
    if (email !== undefined && email === "") {
        return res.status(400).json({ error: "E-mail não pode ser vazio" });
    }
    if (password !== undefined && password.length < 6) {
        return res.status(400).json({ error: "Senha não pode conter menos que 6 caracteres." });
    }

    // Pesquisa de nome e e-mail já existente.
    if (username !== undefined && users.find(u => u.username === username && u.id != id)) {
    return res.status(400).json({ error: 'O nome de Usuário já está em uso.' });
    }
    if (email !== undefined && users.find (u => u.email === email && u.id != id)) {
        return res.status(400).json({ error: 'O endereço de E-mail já está em uso.'})
    }

    // Condicionais que evitam que Undefined seja armazenado em Updates.
    if (name !== undefined) updates.name = name;
    if (username !== undefined) updates.username = username;
    if (email !== undefined) updates.email = email;
    if (password !== undefined) updates.password = password;

    // Aplicação automatizada do filtro nos espaços da database, aplicando somente o que foi alterado.
    users[usersIndex] = { ...users[usersIndex], ...updates };
    writeJSON(USERS_FILE, users);
    res.json({ message: 'Usuário atualizado com sucesso.' });
});

// Deletar Usuário
app.delete('/users/:id', (req, res) => {
    const users = readJSON(USERS_FILE);
    const { id } = req.params;

    const index = users.findIndex(u => u.id == id);
    if (index === -1) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    users.splice(index, 1);
    writeJSON(USERS_FILE, users);

    res.json({message: "Usuário deletado com sucesso."});
});
// *******************************************************************************
// Posts CRUD
// Criar Post
app.post('/posts', (req, res) => {
    const { title, theme, content, user_id } = req.body;
    if (!title || !theme || !content || !user_id) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const users = readJSON(USERS_FILE);
    const userId = parseInt(user_id);
    if (!users.some(u => u.id == userId)) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const posts = readJSON(POSTS_FILE);
    const newPost = { id: randomID(posts), title, theme, content, user_id: userId };

    posts.push(newPost);
    writeJSON(POSTS_FILE, posts);
    res.status(201).json({message: `Seu post foi criado com sucesso!`, post: { id: newPost.id, title, theme, content, user_id: userId }});
});

// *******************************************************************************
// Listar Posts
app.get('/posts', (req, res) => {
    const posts = readJSON(POSTS_FILE);
    const sanitized = posts.map(p => ({id: p.id, title: p.title, theme: p.theme, content: p.content, user_id: p.user_id}));

    const users = readJSON(USERS_FILE);
    const postsWithUsernames = sanitized.map(post => {
        const user = users.find(u => u.id == post.user_id);
        return { ...post, username: user ? user.username : 'Usuário Desconhecido' };
    });

    res.json(postsWithUsernames);
});

// *******************************************************************************
// Editar Post
app.put('/posts/:id', (req, res) => {
    const posts = readJSON(POSTS_FILE);
    const { id } = req.params;
    const { title, theme, content } = req.body;
    const updates = {};
    
    // Criação do Index para pesquisar a Postagem.
    const postsIndex = posts.findIndex(p => p.id == id);
    if (postsIndex === -1) {
        return res.status(404).json({ error: 'Post não encontrado.' });
    }
    
    // Condicionais que evitam valores inválidos nos campos da database.
    if (title !== undefined && title === "") {
        return res.status(400).json({ error: "Título não pode ser vazio" });
    }
    if (theme !== undefined && theme === "") {
        return res.status(400).json({ error: "Tema não pode ser vazio" });
    }
    if (content !== undefined && content === "") {
        return res.status(400).json({ error: "Conteúdo não pode ser vazio" });
    }
    
    // Pesquisa de Title já existente.
    if (title !== undefined && posts.find(p => p.title === title && p.id != id)) {
        return res.status(400).json({ error: 'O título já está em uso.' });
    }
    
    // Condicionais que evitam que Undefined seja armazenado em Updates.
    if (title !== undefined) updates.title = title;
    if (theme !== undefined) updates.theme = theme;
    if (content !== undefined) updates.content = content;

    // Aplicação automatizada do filtro nos espaços da database, aplicando somente o que foi alterado.
    posts[postsIndex] = { ...posts[postsIndex], ...updates };
    writeJSON(POSTS_FILE, posts);
    res.json({ message: 'Post atualizado com sucesso.' });
});

// *******************************************************************************
// Deletar Posts
app.delete('/posts/:id', (req, res) => {
    const posts = readJSON(POSTS_FILE);
    const { id } = req.params;

    const index = posts.findIndex(p => p.id == id);
    if (index === -1) {
        return res.status(404).json({ error: 'Post não encontrado.' });
    }

    posts.splice(index, 1);
    writeJSON(POSTS_FILE, posts);

    res.json({message: "Post deletado com sucesso."});
});

// *******************************************************************************
// Comments CRUD
// Criar Comment

// *******************************************************************************
// Listar Comments

// *******************************************************************************
// Editar Comment

// *******************************************************************************
// Deletar Comments

// *******************************************************************************
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
