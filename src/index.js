const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());

app.listen('3333');

const customers = [];

//Midleware
function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers;
  
  const customerStatement = customers.find(customer => customer.cpf === cpf);

  if(!customerStatement) {
    return response.json({error: "customer not found!"})
  }

  request.customerStatement = customerStatement

  return next()
};

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if(operation.type === 'credit') {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
};

app.get('/', (request, response) => {
  return response.send('Hello, dev!')
})

app.get('/accounts', (request, response) => {
  return response.json(customers)
});

app.post('/account', (request, response) => {
  const { cpf, name } = request.body;

  const customerAlredyExist = customers.some(customer => customer.cpf === cpf);
  if (customerAlredyExist) {
    return response.status(400).json({error: "Customer alredy exist!"})
  };

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  });

  return response.status(201).send("Usuário criado com sucesso!");
});

app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
  
  const { customerStatement } = request

  return response.json(customerStatement.statement)
});

app.post('/statement', verifyIfExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body;

  const { customerStatement } = request
  
  const statementOperation = {
    description,
    amount,
    type: "credit",
    createAt: new Date()
  }

  customerStatement.statement.push(statementOperation);

  return response.status(201).send('Depósito realizado com sucesso')
});

app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
  const { amount } = request.body;
  const { customerStatement } = request;

  const balance = getBalance(customerStatement.statement);

  if(balance < amount) {
    return response.status(400).json({error: 'saldo insuficiente!'})
  };

  const statementOperation = {
    amount,
    type: "debit",
    createAt: new Date()
  };

  customerStatement.statement.push(statementOperation);

  return response.status(201).send('saque realizado com sucesso!');
});

app.get('/statement/date', verifyIfExistsAccountCPF, (request, response) => {
  const { customerStatement } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = customerStatement.statement.filter((statement) => {
    return statement.createAt.toDateString() === new Date(dateFormat).toDateString()
  });

  return response.json(customerStatement.statement);
});

app.get('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { customerStatement } = request

  return response.json(customerStatement)
});

app.put('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { name } = request.body;
  const { customerStatement } = request;

  customerStatement.name = name;

  response.status(201).send('atualizado!');
})

app.delete('/account', verifyIfExistsAccountCPF, (request, response) => {
  const {customerStatement} = request;

  customers.splice(customerStatement, 1);

  return response.status(200).json(customers);
});

app.get('/balance', verifyIfExistsAccountCPF, (request, response) => {
  const {customerStatement} = request;

  const balance = getBalance(customerStatement.statement);

  return response.json({saldo: balance});
});