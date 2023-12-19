import cors from "cors";
import express from "express";

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'nurscare'
});
 
connection.connect(function(err: { stack: string; }) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
  console.log('connected as id ' + connection.threadId);
});

const query = async (query: string): Promise<any> =>
  new Promise((resolve, reject) => {
    connection.query(query, (error: any, results: unknown, fields: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });

// on créé une instance d'une application Express
const app = express();

// on précise à l'application qu'elle doit parser le body des requêtes en JSON (utilisation d'un middleware)
app.use(express.json());
app.use(cors()); // Ajoutez cette ligne pour activer CORS

// on peut utiliser app.get, app.post, app.put, app.delete, etc.. ()

// on définit une route GET /todos, et la fonction qui s'exécute lorsque le serveur reçoit une requête qui matche
app.get("/nurscare", async (request: express.Request, result: express.Response) => {
  let todos = await query("Select * from test");
  console.log(`route "/nurscare" called`);
  return result.status(200).json(todos);
});

// une autre route pour récupérer 1 TODO
app.get("/todos/:id", async (request: express.Request, result: express.Response) => {
  console.log(`route "/todos/:id" called`);
  console.log(`params of the request : ${JSON.stringify(request.params)}`);
  let todos = await query("Select * from test")
  return result
    .status(200)
    .json(
      todos.find((todo:any) => todo.todo.id === Number(request.params.id)) || null,
    );
});

// une autre route pour en modifier
app.put("/todos/:id", async (request: express.Request, response: express.Response) => {
  console.log(`route "/todos/:id" called`);

  const { text, done, description_todo, date_todo_deadline } = request.body;
  const id = Number(request.params.id);

  // Utilisez une requête SQL UPDATE pour mettre à jour le todo dans la base de données
  await query(`UPDATE todo SET text='${text}', done=${done}, date_todo_deadline='${date_todo_deadline}' WHERE id=${id}`);
  // Répondez avec le todo mis à jour
  response.status(200).json({
    id,
    text,
    done,
    description_todo,
    date_todo_deadline,
  });
});

app.put("/todos/desc/:id", async (request: express.Request, response: express.Response) => {
  console.log(`route "/todos/desc/:id" appelée`);

  const { description_todo } = request.body;
  const id = Number(request.params.id);

  // Utilisez une requête SQL UPDATE avec une clause WHERE pour mettre à jour le todo dans la base de données
  await query(`UPDATE todo SET description_todo='${description_todo}' WHERE id=${id}`);

  // Répondez avec le todo mis à jour
  response.status(200).json({
    id,
    description_todo,
  });
});

app.put("/todos/priorite/:id", async (request: express.Request, response: express.Response) => {
  console.log(`route "/todos/priorite/:id" appelée`);

  const { id_priorite } = request.body;
  const id = Number(request.params.id);

  // Utilisez une requête SQL UPDATE avec une clause WHERE pour mettre à jour le todo dans la base de données
  await query(`UPDATE todo SET id_priorite='${id_priorite}' WHERE id=${id}`);

  // Répondez avec le todo mis à jour
  response.status(200).json({
    id,
    id_priorite,
  });
});

// une autre route pour en ajouter
app.post("/todos", async (request: express.Request, response: express.Response) => {
  console.log(`route "/todos" called for creating a new todo`);

  const { text, done, date_todo, date_todo_deadline } = request.body;

  const newTodo = {
    text,
    date_todo,
    done,
    date_todo_deadline,
  };

  const queryString = `INSERT INTO todo (TEXT, DONE, DATE_TODO_DEADLINE) VALUES ('${text}', ${done}, '${date_todo_deadline}')`;

  try {
    await query(queryString);

    response.status(200).json(newTodo);
  } catch (error) {
    console.error("Error inserting new todo:", error);
    response.status(500).json({ error: "Internal Server Error" });
  }
});



// une autre route pour en delete
app.delete("/todos/:id", async (request: express.Request, response: express.Response) => {
  console.log(`route "/todos" called for deleting a todo`);

  const todoId = Number(request.params.id);

  await query(`DELETE FROM todo WHERE id = ${todoId}`);

  response.status(200).json({ message: "Todo deleted successfully" });
});


app.listen(8080, () => console.log("server started, listening on port 8080"));
