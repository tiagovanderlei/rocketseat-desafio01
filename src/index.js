const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  
  const {username} = request.headers;
  const user = users.find(user => user.username === username);

  request.user = user;

  if(!user)
    return response.status(404).json({error: 'User not found!'})

  return next();
}

app.post('/users', (request, response) => {
  const {name, username} = request.body;

  const userAlreadyExists = users.some((user) => user.username === username);

  if(userAlreadyExists)
    return response.status(400).json({error: 'User already exists!'});

  const newUser = { 
    id: uuidv4(), // precisa ser um uuid
    name, 
    username, 
    todos: []
  };
  
  users.push(newUser);
  response.status(201).json(newUser);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const {user} = request;
  return response.status(200).json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const {user} = request;
  const {title, deadline} = request.body;

  const todo = { 
    id: uuidv4(),
    title,
    done: false, 
    deadline: new Date(deadline), 
    created_at: new Date()
  };

  user.todos.push(todo);

  return response.status(201).json(todo);
});

function checkExistsTodo(request, response, next) {
  const {user} = request;
  const {id} = request.params;
  const todo = user.todos.filter(todo => todo.id === id);

  if(!todo.length)
    return response.status(404).json({error: 'Todo not found!'});

  request.todo = todo[0];

  return next();
}

app.put('/todos/:id', checksExistsUserAccount, checkExistsTodo, (request, response) => {
  const {title, deadline} = request.body;
  const {todo} = request;

  todo.title = title;
  todo.deadline = new Date(deadline);

  return response.status(200).json(todo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, checkExistsTodo, (request, response) => {
  const {todo} = request;
  todo.done = true;

  return response.status(200).json(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, checkExistsTodo, (request, response) => {
  const {user} = request;

  const {todo} = request;
  user.todos.splice(todo, 1);

  return response.status(204).send();
});

module.exports = app;