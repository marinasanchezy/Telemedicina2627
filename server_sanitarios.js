
var rpc = require("./rpc.js");
var bd = require("./conexion_mysql.js");

// categorias/modelos/ubicaciones: sin parámetros de entrada, solo callback.
// bd.query en un SELECT siempre devuelve un ARRAY de filas (vacío si no hay ninguna).
function obtenerCategorias(callback){
    bd.query("SELECT * FROM categorias", function(err, categorias){
        if (err){
            return callback(null);
        }
        return callback(categorias); // se devuelve el array entero
    })
}
 
function obtenerModelos(callback){
    bd.query("SELECT * FROM modelos", function(err, modelos){
        if (err){
            return callback(null);
        }
        return callback(modelos);
    });
}
 
function obtenerUbicaciones(callback){
    bd.query("SELECT * FROM ubicaciones", function(err, ubicaciones){
        if (err){
            return callback(null);
        }
        return callback(ubicaciones);
    });
}
 
// usuario y password llegan como dos parámetros SUELTOS (no un objeto), en ese
// orden -> van al array de valores en ese mismo orden, casando con los dos "?".
function loginSanitario(usuario, password, callback){
    bd.query("SELECT id FROM sanitarios WHERE usuario = ? AND password = ?", [usuario, password], function(err, sanitario){
        if (err || sanitario.length == 0){ //si no existe
            return callback(null);
        }
        return callback(sanitario[0].id); // sanitario[0] = única fila (id es clave); .id = el número, no el objeto
    })
}
 
// datosSanitario llega como un OBJETO con propiedades nombre/apellidos/usuario/password
// (no como parámetros sueltos) -> siempre se coge con datosSanitario.xxx.
function crearSanitario(datosSanitario, callback){
    if (!datosSanitario.nombre || !datosSanitario.apellidos || !datosSanitario.usuario || !datosSanitario.password){
        return callback(null);
    }
 
    bd.query("SELECT id FROM sanitarios WHERE usuario = ?", [datosSanitario.usuario], function(err, id){
        if(err || id.length > 0){ //si ya existe el usuario, me da un array solo de los ids
            return callback(null);
        }
 
        // valores: array en el MISMO ORDEN que las columnas del INSERT de abajo
        var valores = [datosSanitario.nombre, datosSanitario.apellidos, datosSanitario.usuario, datosSanitario.password];
 
        bd.query("INSERT INTO sanitarios (nombre, apellidos, usuario, password) VALUES (?,?,?,?)", valores , function(err, result){
            if (err){
                // FIX: faltaba comprobar el error aquí. Sin esto, si el INSERT fallaba,
                // "result" era undefined y result.insertId petaba el servidor entero.
                return callback(null);
            }
            // en un INSERT, "result" NO es un array de filas (como en un SELECT):
            // es un objeto {insertId, affectedRows}. insertId = id que ha puesto MySQL solo.
            return callback(result.insertId);
        })
    })
}
 
// idSanitario = número (para el WHERE). datosSanitario = objeto (para el SET).
// Son dos cosas distintas, no las mezcles: el id nunca sale de datosSanitario.
function actualizarSanitario(idSanitario, datosSanitario, callback){
    bd.query("SELECT * FROM sanitarios WHERE id = ?", [idSanitario], function(err, sanitario){
        if (err) {
            return callback(null);
        }
 
        if (sanitario.length == 0) {
            return callback(null);
        }
 
        // "AND id != ?" excluye TU PROPIO id de la comprobación: si reenvías tu
        // mismo usuario sin cambiarlo, no te lo debe rechazar como "repetido".
        bd.query("SELECT * FROM sanitarios WHERE usuario = ? AND id != ?", [datosSanitario.usuario, idSanitario], function(err, result){
            if (err) {
                return callback(null);
            }
 
            if (result.length > 0) {
                return callback(null); //el usuario ya lo tiene otro sanitario
            }
 
            // campos/valores en paralelo: solo se añade lo que SÍ viene en datosSanitario
            // (actualización parcial, no hace falta mandar todos los campos)
            var campos = [];
            var valores = [];
 
            if (datosSanitario.nombre) {
                campos.push("nombre = ?");
                valores.push(datosSanitario.nombre);
            }
 
            if (datosSanitario.apellidos) {
                campos.push("apellidos = ?");
                valores.push(datosSanitario.apellidos);
            }
 
            if (datosSanitario.usuario) {
                campos.push("usuario = ?");
                valores.push(datosSanitario.usuario);
            }
 
            if (datosSanitario.password) {
                campos.push("password = ?");
                valores.push(datosSanitario.password);
            }
 
            valores.push(idSanitario); // el id SIEMPRE va el último, porque es el último "?" (el del WHERE)
 
            bd.query(
                "UPDATE sanitarios SET " + campos.join(", ") + " WHERE id = ?",
                valores,
                function(err, resultado) {
                    if (err) {
                        return callback(null);
                    }
 
                    return callback(idSanitario);
                }
            );
        });
    });
}
 
function obtenerSanitario(idSanitario, callback){
    bd.query("SELECT * FROM sanitarios WHERE id = ?", [idSanitario], function(err, sanitario){
        if (err || sanitario.length == 0){
            return callback(null);
        }
 
        // se reconstruye el objeto a mano para NO devolver la password al cliente
        var devolver = {
            "id": sanitario[0].id,
            "nombre": sanitario[0].nombre,
            "apellidos": sanitario[0].apellidos,
            "usuario": sanitario[0].usuario
        }
 
        return callback(devolver);
    })
}
 
function obtenerRecursos(idModelo, callback){ //para mostrar recursos operativos
    bd.query("SELECT * FROM recursos WHERE modelo = ? AND estado = 0", [idModelo], function(err, recursos){
        if (err || recursos.length == 0){
            return callback(null);
        }
        return callback(recursos) // array de filas, se devuelve entero
    })
}
 
function tiempoPendiente(idRecurso, callback){
    bd.query("SELECT * FROM reservas WHERE recurso = ? AND fecha_fin IS NULL", [idRecurso], function(err, reservasId){
        if (err){
            return callback(null);
        }
        var tiempo = 0;
        // reservasId es un array de filas; cada fila (reservasId[i]) es un objeto,
        // se coge el campo horas_estimadas de cada una y se suma.
        for (var i=0; i<reservasId.length; i++){
            tiempo += reservasId[i].horas_estimadas;
        }
        return callback(tiempo); // se devuelve un número, no el array
    })
}
 
function obtenerReservas(idSanitario, callback){
    bd.query("SELECT * FROM reservas WHERE sanitario = ?", [idSanitario], function(err, reservas){
        if (err){
            return callback(null);
        }
        return callback(reservas);
    })
}
 
function obtenerResenyas(idRecurso, callback){
    bd.query("SELECT * FROM resenyas WHERE recurso = ?", [idRecurso], function(err, resenyas){
        if (err){
            return callback(null);
        }
        return callback(resenyas);
    })
}
 
// 4 parámetros sueltos, en este orden exacto -> el array valores respeta ese
// mismo orden para que cada "?" reciba el dato correcto.
function crearResenya(idRecurso, idSanitario, valoracion, descripcion, callback){
    if (!idRecurso || !idSanitario || !valoracion){
        return callback(null);
    }
 
    var valores = [idRecurso, idSanitario, new Date(), valoracion, descripcion];
 
    bd.query("INSERT INTO resenyas (recurso, sanitario, fecha, valor, descripcion) VALUES (?,?,?,?,?)", valores , function(err, result){
        if (err){
            return callback(null);
        }
        return callback(result.insertId); // INSERT -> result es objeto {insertId,...}, no array
    })
 
}
 
function reservarRecurso(idRecurso, idSanitario, horasEstimadas, callback){ //crear reserva POST
    if (!idRecurso || !idSanitario || !horasEstimadas){
        return callback(null);
    }
 
    var valores = [idRecurso, idSanitario, horasEstimadas, new Date(), null, null];
 
    bd.query("INSERT INTO reservas (recurso, sanitario, horas_estimadas, fecha_peticion, fecha_inicio, fecha_fin) VALUES (?,?,?,?,?,?)", valores , function(err, result){
        if (err){
            return callback(null);
        }
        return callback(result.insertId); //devuelve el ID de la reserva nueva (idReserva)
    })
}
 
function cancelarReserva(idReserva, callback){
    bd.query(
        "DELETE FROM reservas WHERE id = ?",
        [idReserva],
        function(err, result){
            if (err){
                return callback(false);
            }
            // DELETE/UPDATE -> result es objeto {affectedRows}, NO un array de filas
            // (por eso aquí no se usa result.length como harías con un SELECT).
            if (result.affectedRows == 0){
                return callback(false); // no existía esa reserva
            }
            return callback(true);
        }
    );
}
function iniciarReserva(idReserva, callback) { //dar fecha inicio a la reserva creada
    bd.query("UPDATE reservas SET fecha_inicio = ? WHERE id = ?", [new Date(), idReserva], function(err, result){
        if (err){
            return callback(false);
        }
 
        if (result.affectedRows == 0){
            return callback(false);
        }
 
        return callback(true); // aquí se devuelve un booleano, no el id ni la fila
    })
}
 
function finalizarReserva(idReserva, callback){ //dar fecha fin
    bd.query("UPDATE reservas SET fecha_fin = ? WHERE id = ?", [new Date(), idReserva], function(err, result){
        if (err){
            return callback(false);
        }
 
        if (result.affectedRows == 0){
            return callback(false);
        }
 
        return callback(true);
    })
}
 
function obtenerRecurso(idRecurso, callback){
    bd.query("SELECT * FROM recursos WHERE id = ?", [idRecurso], function(err, recu){
        if (err || recu.length == 0){
            return callback(null);
        }
        return callback(recu[0]); // una sola fila (objeto), no el array
    })
}


function obtenerReservaNFC(idRecurso,sanitActual,callback){
    bd.query("SELECT * FROM reservas WHERE recurso = ? AND sanitario = ? AND fecha_fin IS NULL", [idRecurso,sanitActual],function(err,reserva){
        if (reserva.length == 0){
            reservarRecurso(idRecurso,sanitActual,2,function(cb){
                if (cb == null){
                    return callback ("error")
                }
                    return callback ("Recurso reservado")
            })
        }
        else{
            if(reserva[0].fecha_inicio != null){
                finalizarReserva(reserva[0].id, function(cb){
                    if (cb == true){
                        return callback("Recurso devuelto")
                    }
                        return callback("error")
                })
            }
            if(reserva[0].fecha_inicio == null){
                iniciarReserva(reserva[0].id, function(cb){
                    if (cb == true){
                        return callback("Recurso retirado")
                    }
                        return callback("error")
                })
            
            }
        }   
    })
}


function loguinisito(loguinsillo,callback){
    var loguincito = loguinsillo.split("$");
    var usuario = loguincito[0];
    var contri = loguincito[1];
    loginSanitario(usuario,contri,function(cb){
        if(cb==null){
            return callback(null)
        }
        else{
            return callback(cb)
        }
    })
}

var rpc = require("./rpc.js");
var bd = require("./conexion_mysql.js");

// categorias/modelos/ubicaciones: sin parámetros de entrada, solo callback.
// bd.query en un SELECT siempre devuelve un ARRAY de filas (vacío si no hay ninguna).
function obtenerCategorias(callback){
    bd.query("SELECT * FROM categorias", function(err, categorias){
        if (err){
            return callback(null);
        }
        return callback(categorias); // se devuelve el array entero
    })
}
 
function obtenerModelos(callback){
    bd.query("SELECT * FROM modelos", function(err, modelos){
        if (err){
            return callback(null);
        }
        return callback(modelos);
    });
}
 
function obtenerUbicaciones(callback){
    bd.query("SELECT * FROM ubicaciones", function(err, ubicaciones){
        if (err){
            return callback(null);
        }
        return callback(ubicaciones);
    });
}
 
// usuario y password llegan como dos parámetros SUELTOS (no un objeto), en ese
// orden -> van al array de valores en ese mismo orden, casando con los dos "?".
function loginSanitario(usuario, password, callback){
    bd.query("SELECT id FROM sanitarios WHERE usuario = ? AND password = ?", [usuario, password], function(err, sanitario){
        if (err || sanitario.length == 0){ //si no existe
            return callback(null);
        }
        return callback(sanitario[0].id); // sanitario[0] = única fila (id es clave); .id = el número, no el objeto
    })
}
 
// datosSanitario llega como un OBJETO con propiedades nombre/apellidos/usuario/password
// (no como parámetros sueltos) -> siempre se coge con datosSanitario.xxx.
function crearSanitario(datosSanitario, callback){
    if (!datosSanitario.nombre || !datosSanitario.apellidos || !datosSanitario.usuario || !datosSanitario.password){
        return callback(null);
    }
 
    bd.query("SELECT id FROM sanitarios WHERE usuario = ?", [datosSanitario.usuario], function(err, id){
        if(err || id.length > 0){ //si ya existe el usuario, me da un array solo de los ids
            return callback(null);
        }
 
        // valores: array en el MISMO ORDEN que las columnas del INSERT de abajo
        var valores = [datosSanitario.nombre, datosSanitario.apellidos, datosSanitario.usuario, datosSanitario.password];
 
        bd.query("INSERT INTO sanitarios (nombre, apellidos, usuario, password) VALUES (?,?,?,?)", valores , function(err, result){
            if (err){
                // FIX: faltaba comprobar el error aquí. Sin esto, si el INSERT fallaba,
                // "result" era undefined y result.insertId petaba el servidor entero.
                return callback(null);
            }
            // en un INSERT, "result" NO es un array de filas (como en un SELECT):
            // es un objeto {insertId, affectedRows}. insertId = id que ha puesto MySQL solo.
            return callback(result.insertId);
        })
    })
}
 
// idSanitario = número (para el WHERE). datosSanitario = objeto (para el SET).
// Son dos cosas distintas, no las mezcles: el id nunca sale de datosSanitario.
function actualizarSanitario(idSanitario, datosSanitario, callback){
    bd.query("SELECT * FROM sanitarios WHERE id = ?", [idSanitario], function(err, sanitario){
        if (err) {
            return callback(null);
        }
 
        if (sanitario.length == 0) {
            return callback(null);
        }
 
        // "AND id != ?" excluye TU PROPIO id de la comprobación: si reenvías tu
        // mismo usuario sin cambiarlo, no te lo debe rechazar como "repetido".
        bd.query("SELECT * FROM sanitarios WHERE usuario = ? AND id != ?", [datosSanitario.usuario, idSanitario], function(err, result){
            if (err) {
                return callback(null);
            }
 
            if (result.length > 0) {
                return callback(null); //el usuario ya lo tiene otro sanitario
            }
 
            // campos/valores en paralelo: solo se añade lo que SÍ viene en datosSanitario
            // (actualización parcial, no hace falta mandar todos los campos)
            var campos = [];
            var valores = [];
 
            if (datosSanitario.nombre) {
                campos.push("nombre = ?");
                valores.push(datosSanitario.nombre);
            }
 
            if (datosSanitario.apellidos) {
                campos.push("apellidos = ?");
                valores.push(datosSanitario.apellidos);
            }
 
            if (datosSanitario.usuario) {
                campos.push("usuario = ?");
                valores.push(datosSanitario.usuario);
            }
 
            if (datosSanitario.password) {
                campos.push("password = ?");
                valores.push(datosSanitario.password);
            }
 
            valores.push(idSanitario); // el id SIEMPRE va el último, porque es el último "?" (el del WHERE)
 
            bd.query(
                "UPDATE sanitarios SET " + campos.join(", ") + " WHERE id = ?",
                valores,
                function(err, resultado) {
                    if (err) {
                        return callback(null);
                    }
 
                    return callback(idSanitario);
                }
            );
        });
    });
}
 
function obtenerSanitario(idSanitario, callback){
    bd.query("SELECT * FROM sanitarios WHERE id = ?", [idSanitario], function(err, sanitario){
        if (err || sanitario.length == 0){
            return callback(null);
        }
 
        // se reconstruye el objeto a mano para NO devolver la password al cliente
        var devolver = {
            "id": sanitario[0].id,
            "nombre": sanitario[0].nombre,
            "apellidos": sanitario[0].apellidos,
            "usuario": sanitario[0].usuario
        }
 
        return callback(devolver);
    })
}
 
function obtenerRecursos(idModelo, callback){ //para mostrar recursos operativos
    bd.query("SELECT * FROM recursos WHERE modelo = ? AND estado = 0", [idModelo], function(err, recursos){
        if (err || recursos.length == 0){
            return callback(null);
        }
        return callback(recursos) // array de filas, se devuelve entero
    })
}
 
function tiempoPendiente(idRecurso, callback){
    bd.query("SELECT * FROM reservas WHERE recurso = ? AND fecha_fin IS NULL", [idRecurso], function(err, reservasId){
        if (err){
            return callback(null);
        }
        var tiempo = 0;
        // reservasId es un array de filas; cada fila (reservasId[i]) es un objeto,
        // se coge el campo horas_estimadas de cada una y se suma.
        for (var i=0; i<reservasId.length; i++){
            tiempo += reservasId[i].horas_estimadas;
        }
        return callback(tiempo); // se devuelve un número, no el array
    })
}
 
function obtenerReservas(idSanitario, callback){
    bd.query("SELECT * FROM reservas WHERE sanitario = ?", [idSanitario], function(err, reservas){
        if (err){
            return callback(null);
        }
        return callback(reservas);
    })
}
 
function obtenerResenyas(idRecurso, callback){
    bd.query("SELECT * FROM resenyas WHERE recurso = ?", [idRecurso], function(err, resenyas){
        if (err){
            return callback(null);
        }
        return callback(resenyas);
    })
}
 
// 4 parámetros sueltos, en este orden exacto -> el array valores respeta ese
// mismo orden para que cada "?" reciba el dato correcto.
function crearResenya(idRecurso, idSanitario, valoracion, descripcion, callback){
    if (!idRecurso || !idSanitario || !valoracion){
        return callback(null);
    }
 
    var valores = [idRecurso, idSanitario, new Date(), valoracion, descripcion];
 
    bd.query("INSERT INTO resenyas (recurso, sanitario, fecha, valor, descripcion) VALUES (?,?,?,?,?)", valores , function(err, result){
        if (err){
            return callback(null);
        }
        return callback(result.insertId); // INSERT -> result es objeto {insertId,...}, no array
    })
 
}
 
function reservarRecurso(idRecurso, idSanitario, horasEstimadas, callback){ //crear reserva POST
    if (!idRecurso || !idSanitario || !horasEstimadas){
        return callback(null);
    }
 
    var valores = [idRecurso, idSanitario, horasEstimadas, new Date(), null, null];
 
    bd.query("INSERT INTO reservas (recurso, sanitario, horas_estimadas, fecha_peticion, fecha_inicio, fecha_fin) VALUES (?,?,?,?,?,?)", valores , function(err, result){
        if (err){
            return callback(null);
        }
        return callback(result.insertId);
    })
}
 
function cancelarReserva(idReserva, callback){
    bd.query(
        "DELETE FROM reservas WHERE id = ?",
        [idReserva],
        function(err, result){
            if (err){
                return callback(false);
            }
            // DELETE/UPDATE -> result es objeto {affectedRows}, NO un array de filas
            // (por eso aquí no se usa result.length como harías con un SELECT).
            if (result.affectedRows == 0){
                return callback(false); // no existía esa reserva
            }
            return callback(true);
        }
    );
}

function iniciarReserva(idReserva, callback) { //dar fecha inicio a la reserva creada
    bd.query("UPDATE reservas SET fecha_inicio = ? WHERE id = ?", [new Date(), idReserva], function(err, result){
        if (err){
            return callback(false);
        }
 
        if (result.affectedRows == 0){
            return callback(false);
        }
 
        return callback(true); // aquí se devuelve un booleano, no el id ni la fila
    })
}
 
function finalizarReserva(idReserva, callback){ //dar fecha fin
    bd.query("UPDATE reservas SET fecha_fin = ? WHERE id = ?", [new Date(), idReserva], function(err, result){
        if (err){
            return callback(false);
        }
 
        if (result.affectedRows == 0){
            return callback(false);
        }
 
        return callback(true);
    })
}
 
function obtenerRecurso(idRecurso, callback){
    bd.query("SELECT * FROM recursos WHERE id = ?", [idRecurso], function(err, recu){
        if (err || recu.length == 0){
            return callback(null);
        }
        return callback(recu[0]); // una sola fila (objeto), no el array
    })
}


function obtenerReservaNFC(idRecurso,sanitActual,callback){
    bd.query("SELECT * FROM reservas WHERE recurso = ? AND sanitario = ? AND fecha_fin IS NULL", [idRecurso,sanitActual],function(err,reserva){
        if (err){
        return callback("error");
        }  
        if (reserva.length == 0){
            reservarRecurso(idRecurso,sanitActual,2,function(cb){ //el cb es el idReserva
                if (cb == null){
                    return callback ("error")
                }
                iniciarReserva(cb,function(cb){ // el segundo cb es lo que devuelve la de iniciar reserva q es true o false  
                    if (cb==false){
                        return callback("error")
                    }
                    else{
                        return callback ("Recurso creado y retirado")
                    }
                })
                    
            })
        }
        else{
            if(reserva[0].fecha_inicio != null){
                finalizarReserva(reserva[0].id, function(cb){
                    if (cb == true){
                        return callback("Recurso devuelto")
                    }
                        return callback("error")
                })
            }
            if(reserva[0].fecha_inicio == null){
                iniciarReserva(reserva[0].id, function(cb){
                    if (cb == true){
                        return callback("Recurso retirado")
                    }
                        return callback("error")
                })
            
            }
        }   
    })
}





function loguinisito(loguinsillo,callback){
    var loguincito = loguinsillo.split("$");
    var usuario = loguincito[0];
    var contri = loguincito[1];
    loginSanitario(usuario,contri,function(cb){
        if(cb==null){
            return callback(null)
        }
        else{
            return callback(cb)
        }
    })
}
var servidor = rpc.server(); // crear el servidor RPC
var app = servidor.createApp("gestion_pacientes"); // crear aplicación de RPC

//Registramos los procedimientos
app.registerAsync(obtenerCategorias);
app.registerAsync(obtenerModelos);
app.registerAsync(obtenerUbicaciones);
app.registerAsync(loginSanitario);
app.registerAsync(crearSanitario);
app.registerAsync(actualizarSanitario);
app.registerAsync(obtenerSanitario);
app.registerAsync(obtenerRecursos);
app.registerAsync(tiempoPendiente);
app.registerAsync(obtenerReservas);
app.registerAsync(obtenerResenyas);
app.registerAsync(crearResenya);
app.registerAsync(reservarRecurso); //crear Rerserva
app.registerAsync(cancelarReserva);
app.registerAsync(iniciarReserva);
app.registerAsync(finalizarReserva);
app.registerAsync(obtenerRecurso);
app.registerAsync(obtenerReservaNFC);
app.registerAsync(loguinisito);




