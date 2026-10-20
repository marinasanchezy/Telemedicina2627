// rest.get(url, callback)
// rest.post(url, body, callback)
// rest.put(url, body, callback)
// rest.delete(url, callback)
// function callback(estado, respuesta) {...}
 
require("dotenv").config(); // lee el fichero .env y lo mete en process.env
var express = require("express");
var jwt = require("jwt-simple");
var clave = process.env.JWT_CLAVE; // la clave NO está escrita aquí: viene del .env (en local) o de Render (en la nube)
if (!clave){
    console.error("Falta JWT_CLAVE en el .env / variables de entorno");
    process.exit();
}
var app = express();
 
var bd = require('./conexion_pg.js'); // antes: conexion_mysql.js (ahora la BD es PostgreSQL en Supabase)
 
app.use("/appClienteGestor", express.static("cliente_gestor"));
app.use(express.json()); // sin esto, req.body llega undefined en POST/PUT
 
/*
Resumen códigos:
200: Éxito
201: recurso creado
400: solicitud incorrecta --> faltan datos o formato erróneo
403: login incorrecto
404: recurso no encontrado
*/
 
// ---- Login y registro NO necesitan token (van antes del app.use) ----
app.post("/api/gestores/login", function(req, res){
    // req.body = lo que mandas en el cuerpo del POST (JSON)
    var user = req.body.user;
    var contra = req.body.contra;
 
    bd.query("SELECT id FROM gestores WHERE usuario = ? AND password = ?", [user, contra], function(err, gestor){
        if (err){
            return res.status(500).json("Error de la BD");
        }
 
        if (gestor.length > 0){
            // Creo el token con el id del gestor y una caducidad de 1 hora
            var contenido = {
                usuario: gestor[0].id,
                expira: Date.now() + 60 * 60 * 1000
            };
            var token = jwt.encode(contenido, clave);
            return res.status(200).json({ id: gestor[0].id, token: token }); // el cliente recibe id y token
        }
        return res.status(403).json("Login incorrecto");
    });
});
 
//Crear gestor
app.post("/api/gestores", function(req, res){
    // FIX: esta ruta no tiene ":usuario" en la URL, así que req.params.usuario
    // no existía -> tenía que ser req.body.usuario (el dato viene en el body del POST).
    bd.query("SELECT id FROM gestores WHERE usuario = ?", [req.body.usuario], function(err, gestor){
        if (err) {
            // FIX: faltaba comprobar el error de esta consulta.
            return res.status(500).json("Error en la base de datos");
        }
 
        if (gestor.length > 0){
            return res.status(403).json("Usuario repetido");
        }
        //vienen del body -> main -> datos
        var valores = [req.body.nombre, req.body.apellidos, req.body.usuario, req.body.password]; // esto se hace para los post; para las ?-> array (para todas)
        bd.query("INSERT INTO gestores (nombre, apellidos, usuario, password) VALUES (?, ?, ?, ?)", valores, function(err, result){
            if (err) {
                return res.status(500).json("Error al registrar el usuario");
            }
            // INSERT -> result es un objeto {insertId, affectedRows}, no un array
            return res.status(201).json("Usuario registrado correctamente");
        });
    });
});
 
// ---- A partir de aquí, todas las rutas /api exigen token (?token=XXXX en la URL) ----
app.use("/api", function(req, res, next){
    var token = req.query.token;
    if (!token){
        res.status(403).json("No se ha encontrado token");
        return;
    }

    var contenidoToken;
    try {
        contenidoToken = jwt.decode(token, clave); // si el token no es válido, decode lanza un error
    } catch (error) {
        res.status(403).json("El token es incorrecto");
        return;
    }

    if (!contenidoToken || !contenidoToken.expira || !contenidoToken.usuario){
        res.status(403).json("El formato del token no es adecuado");
        return;
    }

    if (contenidoToken.expira < Date.now()){
        res.status(403).json("El token ha expirado");
        return;
    }

    next(); // token correcto: sigue con la ruta que se pedía
});

app.get("/api/ubicaciones", function(req, res){
    bd.query("SELECT * FROM ubicaciones", function(err, ubicaciones){
        if (err) {
            res.status(500).json(err);
        } else {
            res.status(200).json(ubicaciones); // SELECT -> array de filas, se devuelve entero
        }
    });
});
 
app.get("/api/categorias", function(req, res){
    bd.query("SELECT * FROM categorias", function(err, categorias){
        if (err) { res.status(500).json(err); } else { res.status(200).json(categorias); }
    });
});
 
app.get("/api/modelos", function(req, res){
    bd.query("SELECT * FROM modelos", function(err, modelos){
        if (err) { res.status(500).json(err); } else { res.status(200).json(modelos); }
    });
});
 
//Actualizar gestor
app.put("/api/gestores/:id", function(req, res){
    // req.params = variables de la URL (aquí, :id)
    var id = parseInt(req.params.id); //se extrae aquí
    bd.query("SELECT * FROM gestores WHERE id = ?", [id], function(err, gestor){
        if (err) {
            return res.status(500).json("Error en la base de datos");
        }
 
        if (gestor.length == 0) {
            return res.status(404).json("Gestor no encontrado");
        }
 
        // FIX: "AND id != ?" para excluir tu propio id de la comprobación.
        // Sin esto, si reenvías tu mismo usuario sin cambiarlo, te lo rechazaría
        // como "usuario repetido" aunque sea el tuyo.
        bd.query("SELECT id FROM gestores WHERE usuario = ? AND id != ?", [req.body.usuario, id], function(err, result){
            if (err) {
                return res.status(500).json("Error en la base de datos");
            }
 
            if (result.length > 0) {
                return res.status(403).json("Usuario repetido");
            }
 
            // Actualización parcial: solo se añade al UPDATE lo que SÍ llega en req.body
            var campos = []; //para hacer la consulta
            var valores = []; //
            // esto es xk se pueden mandar algunas
            if (req.body.nombre) { campos.push("nombre = ?"); valores.push(req.body.nombre); }
            if (req.body.apellidos) { campos.push("apellidos = ?"); valores.push(req.body.apellidos); }
            if (req.body.usuario) { campos.push("usuario = ?"); valores.push(req.body.usuario); }
            if (req.body.password) { campos.push("password = ?"); valores.push(req.body.password); }
 
            // FIX: si no hay ningún campo que cambiar, cortar aquí. Si no, "SET"
            // se quedaría vacío y MySQL daría un error de sintaxis.
            if (campos.length == 0) {
                return res.status(200).json("Datos actualizados correctamente");
            }
 
            valores.push(id); // el id siempre va el último valor, porque es el WHERE final
 
            bd.query(
                "UPDATE gestores SET " + campos.join(", ") + " WHERE id = ?",
                valores,
                function(err, resultado) {
                    if (err) {
                        return res.status(500).json("Error en la base de datos");
                    }
 
                    return res.status(200).json("Gestor actualizado correctamente");
                }
            );
        });
    });
});
//se devuelven todos los datos del gestor MENOS la contra
app.get("/api/gestores/:id", function(req, res){
    var id = parseInt(req.params.id);
    //siempre pasas un array como 2 arg por esos las llaves [id]
    bd.query("SELECT * FROM gestores WHERE id = ?", [id], function(err, gestor){
        if (err){
            return res.status(500).json("Error BD");
        }
 
        if (gestor.length == 0){
            return res.status(404).json("Gestor no encontrado");
        }
 
        // se reconstruye el objeto a mano para NO devolver la password al cliente
        return res.status(200).json({
            nombre: gestor[0].nombre,
            apellidos: gestor[0].apellidos,
            usuario: gestor[0].usuario
        });
    });
});

app.get("/api/sanitarios/:id", function(req, res){
    var id = parseInt(req.params.id);
 
    bd.query("SELECT * FROM sanitarios WHERE id = ?", [id], function(err, sanit){
        if (err){
            return res.status(500).json("Error BD");
        }
 
        if (sanit.length == 0){
            return res.status(404).json("Sanitario no encontrado");
        }
 
        return res.status(200).json({
            nombre: sanit[0].nombre,
            apellidos: sanit[0].apellidos,
            usuario: sanit[0].usuario
        });
    });
});
 
//     recursos {
//     id: number;
//     modelo: number;
//     ubicacion: number;
//     numero_serie: string;
//     estado: number;
 
app.get("/api/recursos", function(req, res) { //ESTA ME DA TODS LOS RECURSOS
    // req.query = lo que va después de "?" en la URL (?categoria=2&estado=0...)
    var filtros = req.query; //array; req es lo que llega del cliente y res lo que le mando al cliente
 
    var sql = `
        SELECT recursos.*
        FROM recursos
        JOIN modelos ON recursos.modelo = modelos.id
        WHERE 1=1
    `;
    // "categoria" no está en recursos (depende del modelo) -> hace falta el JOIN.
    // "WHERE 1=1" permite ir añadiendo "AND ..." sin preocuparse de si es el primero.
 
    var valores = [];
 
    if (filtros.categoria) {
        sql += " AND modelos.categoria = ?";
        valores.push(filtros.categoria);
    }
 
    if (filtros.modelo) {
        sql += " AND recursos.modelo = ?";
        valores.push(filtros.modelo);
    }
 
    if (filtros.ubicacion) {
        sql += " AND recursos.ubicacion = ?";
        valores.push(filtros.ubicacion);
    }
 
    if (filtros.estado) {
        sql += " AND recursos.estado = ?";
        valores.push(filtros.estado);
    }
 
    bd.query(sql, valores, function(err, resultado) {//lo primero es la consulta, lo segundo los valores de los ? y lo tercero la funcion callback
        if (err) {
            return res.status(500).json("Error en la base de datos");
        }
 
        return res.status(200).json(resultado);//resultado es lo que me devuelve a la hora de hacer la consulta, es un array de objetos 
    });
});
 
app.get("/api/recursos/:id", function(req, res){//
    var id = parseInt(req.params.id);
 
    bd.query("SELECT * FROM recursos WHERE id = ?", [id], function(err, recurso){
        if (err){
            return res.status(500).json("Error BD");
        }
 
        if (recurso.length == 0){
            return res.status(404).json("Recurso no encontrado");
        }
 
        return res.status(200).json({
            numero_serie: recurso[0].numero_serie,
            estado: recurso[0].estado,
            modelo: recurso[0].modelo,
            id: recurso[0].id,
            ubicacion: recurso[0].ubicacion
        });
    });
});

//Post normal, crear recurso
app.post("/api/recursos/", function(req, res){
    var valores = [req.body.modelo, req.body.ubicacion, req.body.numero_serie, req.body.estado];
    bd.query("INSERT INTO recursos (modelo, ubicacion, numero_serie, estado) VALUES (?, ?, ?, ?)", valores, function(err, result){
        if (err) {
            return res.status(500).json("Error al registrar el recurso");
        }
 
        return res.status(201).json("Recurso registrado correctamente");
    });
});

//Actualiar recursos, todoas van juntas
app.put("/api/recursos/:id", function(req, res){
    var id = parseInt(req.params.id);
 
    bd.query("SELECT * FROM recursos WHERE id = ?", [id], function(err, rec){
        if (err){
            // FIX: faltaba el "return" -> sin él, el código seguía ejecutándose
            // después de responder, y podía acabar respondiendo dos veces.
            return res.status(500).json("Error BD");
        }
 
        // FIX: "rec" es un array de filas (SELECT), no un número -> rec.length == 0
        // (antes ponía "rec == 0", que "colaba" por una rareza de JS, pero es confuso).
        if (rec.length == 0){
            return res.status(404).json("Recurso no encontrado");
        }
 
        var campos = [];
        var valores = [];
 
        if (req.body.modelo) { campos.push("modelo = ?"); valores.push(req.body.modelo); }
        if (req.body.ubicacion) { campos.push("ubicacion = ?"); valores.push(req.body.ubicacion); }
        if (req.body.numero_serie) { campos.push("numero_serie = ?"); valores.push(req.body.numero_serie); }
        if (req.body.estado) { campos.push("estado = ?"); valores.push(req.body.estado); }
 
        // FIX: mismo caso límite que en gestores, por si no llega ningún campo.
        if (campos.length == 0) {
            return res.status(200).json("Datos actualizados correctamente");
        }
 
        valores.push(id);
 
        bd.query(
            "UPDATE recursos SET " + campos.join(", ") + " WHERE id = ?",
            valores,
            function(err, resultado) {
                if (err) {
                    return res.status(500).json("Error en la base de datos");
                }
 
                return res.status(200).json("Recurso actualizado correctamente");
            }
        );
    });
});
 
app.delete("/api/recursos/:id", function(req, res){
    var id = parseInt(req.params.id);
 
    bd.query("DELETE FROM recursos WHERE id = ?", [id], function(err, resultado){
        if (err){
            return res.status(500).json("Error en la base de datos");
        }
 
        // DELETE -> resultado es un objeto {affectedRows}, no un array de filas
        if (resultado.affectedRows == 0){
            return res.status(404).json("Recurso no encontrado");
        }
 
        return res.status(200).json("Recurso eliminado correctamente");
    });
});
// dar todas las reservas de un recurso
app.get("/api/recursos/:id/reservas", function(req, res){ // para sacar las reservas necesito el id del recurso (práctica 3)
    var id = parseInt(req.params.id);
    bd.query("SELECT * FROM reservas WHERE recurso = ?", [id], function(err, reservas){
        if (err){
            return res.status(500).json("Error en la base de datos");
        }
        res.status(200).json(reservas);
    });
});

app.get("/api/recursos/:id/resenyas", function(req, res){
    var id = parseInt(req.params.id);
    bd.query("SELECT * FROM resenyas WHERE recurso = ?", [id], function(err, resenyas){
        if (err){
            return res.status(500).json("Error en la base de datos");
        }
        res.status(200).json(resenyas);
    });
});





var puerto = process.env.PORT || 3000; // Render te dice el puerto en PORT; en tu Mac, 3000
app.listen(puerto, function(){
    console.log("Servidor gestor iniciado correctamente en el puerto " + puerto); // FIX: decía "sanitario" por error
});