import { createServer } from "http";
import url from "url";
import pkg from "pg";

const { Pool } = pkg;

const conexion = new Pool({
  user: "postgres",
  database: "dvdrental",
  password: "postgres",
  host: "localhost",
  port: 5432,
});

const port = 3000;

createServer((req, res) => {
  const urlParsed = url.parse(req.url, true);
  const pathname = urlParsed.pathname;
  const method = req.method;

  res.setHeader("Content-Type", "application/json");

  if (method == "POST" && pathname == "/actor/asignar") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    return req.on("end", async () => {
      body = JSON.parse(body);
     try{
      await conexion.query("BEGIN")
      //Consulta para validar si actor o actriz existe
      const { rows: actors, rowCount: actorFind } = await conexion.query(
        "SELECT * FROM actor WHERE first_name ilike $1 AND last_name ilike $2",
        [body.first_name, body.last_name]
      );

      let actor;
      if (actorFind == 0) { //Sí el actor o actriz no existe, se registra
        let result = await conexion.query(
          "INSERT INTO actor(first_name, last_name) VALUES($1, $2) RETURNING * ",
          [body.first_name, body.last_name]
        );
        actor = result.rows[0]
      } else {
        actor = actors[0]
      }  
      console.log(actor)
      
      const { rows: films, rowCount: filmFind } = await conexion.query("SELECT * FROM1 film WHERE title ilike $1", [body.title])
      if(filmFind == 0){
        res.writeHead(422)
        throw "Película no existe"
      } else {
         const result =  await conexion.query("INSERT INTO film_actor(film_id, actor_id) VALUES($1, $2)", [films[0].film_id, actor.actor_id])
         await conexion.query("COMMIT")
         res.end(JSON.stringify({ message: "Actor asignado a la película de forma éxitosa", actor, film: films[0] }))
      }
     }catch(err){
       await conexion.query("ROLLBACK")
       res.writeHead(422)
       res.end(JSON.stringify({ message: err.message || "Error interno" }))
      }
    }); 
  }

  res.writeHead(404);
  res.end(JSON.stringify({ message: "Ruta no encontrada" }));
}).listen(port, () => {
  console.log(`Servidor escuchando desde el puerto ${port}`);
});
