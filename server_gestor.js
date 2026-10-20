// rest.get(url, callback)
// rest.post(url, body, callback)
// rest.put(url, body, callback)
// rest.delete(url, callback)
// function callback(estado, respuesta) {...}

var express = require("express");
var app = express();

var jwt = require("jwt-simple");
var clave = "marina";

// 1. Importar el cliente de Supabase
const { createClient } = require('@supabase/supabase-js');

// 2. Configurar con tu URL y tu Public Key (anon key)
const supabaseUrl = 'https://mcfqchwmtlolufbmbbtr.supabase.co';
const supabaseKey = 'sb_publishable_m0lKEmUIMpjVen3d0xO3aQ_FNutSo3e';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use("/appClienteGestor", express.static("cliente_gestor")); 
app.use(express.json());

/*
Resumen códigos:
200: Éxito
201: recurso creado
301: token ausente, incorrecto o expirado
400: solicitud incorrecta --> faltan datos o formato erróneo
403: login incorrecto
404: recurso no encontrado
*/

// =====================================================
// RUTAS PÚBLICAS (no necesitan token)
// =====================================================

app.post("/api/gestores/login", async function(req, res){
    var user = req.body.user;
    var contra = req.body.contra;

    var { data, error } = await supabase
        .from("gestores")
        .select("id")
        .eq("usuario", user)
        .eq("password", contra);

    if (error){
        return res.status(500).json("Error de la BD");
    }

    if (data.length > 0){
        var contenido = {
            usuario: data[0].id,
            expira: Date.now() + 60 * 60 * 1000 // expira en 1 hora
        };
        var token = jwt.encode(contenido, clave);
        return res.status(200).json({id: data[0].id, token: token});
    }
    return res.status(403).json("Login incorrecto");
});


//Crear gestor 
app.post("/api/gestores", async function(req, res){
    var repetido = await supabase
        .from("gestores")
        .select("id")
        .eq("usuario", req.body.usuario);

    if (repetido.error){
        return res.status(500).json("Error en la base de datos");
    }

    if (repetido.data.length > 0){
        return res.status(403).json("Usuario repetido");
    }

    var { error } = await supabase.from("gestores").insert({
        nombre: req.body.nombre,
        apellidos: req.body.apellidos,
        usuario: req.body.usuario,
        password: req.body.password
    });

    if (error){
        return res.status(500).json("Error al registrar el usuario");
    }

    return res.status(201).json("Usuario registrado correctamente");
});

// =====================================================
// MIDDLEWARE JWT
// Todo lo que haya debajo de este use necesita token
// =====================================================

app.use("/api", function (req, res, next) {
    var token = req.query.token;
    if (!token) {
        return res.status(301).json("No se ha encontrado token");
    }

    try {
        var contenidoToken = jwt.decode(token, clave);
    } catch (error) {
        return res.status(301).json("El token es incorrecto");
    }

    if (!contenidoToken || !contenidoToken.expira || !contenidoToken.usuario) {
        return res.status(301).json("El formato del token no es adecuado");
    }

    if (contenidoToken.expira < Date.now()) {
        return res.status(301).json("El token ha expirado");
    }

    next();
});

// =====================================================
// RUTAS PRIVADAS (necesitan token)
// =====================================================

app.get("/api/ubicaciones", async function(req, res){
    var { data, error } = await supabase.from("ubicaciones").select("*");
    if (error) {
        return res.status(500).json(error);
    }
    return res.status(200).json(data);
});

app.get("/api/categorias", async function(req, res){
    var { data, error } = await supabase.from("categorias").select("*");
    if (error) {
        return res.status(500).json(error);
    }
    return res.status(200).json(data);
});

app.get("/api/modelos", async function(req, res){
    var { data, error } = await supabase.from("modelos").select("*");
    if (error) {
        return res.status(500).json(error);
    }
    return res.status(200).json(data);
});

//Actualizar gestor
app.put("/api/gestores/:id", async function(req, res){
    var id = parseInt(req.params.id);

    var existe = await supabase.from("gestores").select("id").eq("id", id);
    if (existe.error) {
        return res.status(500).json("Error en la base de datos");
    }

    if (existe.data.length == 0) {
        return res.status(404).json("Gestor no encontrado");
    }

    if (req.body.usuario) {
        var repetido = await supabase.from("gestores").select("id").eq("usuario", req.body.usuario);
        if (repetido.error) {
            return res.status(500).json("Error en la base de datos");
        }

        if (repetido.data.length > 0) {
            return res.status(403).json("Usuario repetido");
        }
    }

    var cambios = {};

    if (req.body.nombre) {
        cambios.nombre = req.body.nombre;
    }

    if (req.body.apellidos) {
        cambios.apellidos = req.body.apellidos;
    }

    if (req.body.usuario) {
        cambios.usuario = req.body.usuario;
    }

    if (req.body.password) {
        cambios.password = req.body.password;
    }

    var { error } = await supabase.from("gestores").update(cambios).eq("id", id);
    if (error) {
        return res.status(500).json("Error en la base de datos");
    }

    return res.status(200).json("Gestor actualizado correctamente");
});

app.get("/api/gestores/:id", async function(req, res){
    var id = parseInt(req.params.id);

    var { data, error } = await supabase.from("gestores").select("*").eq("id", id);
    if (error){
        return res.status(500).json("Error BD");
    }

    if (data.length == 0){
        return res.status(404).json("Gestor no encontrado");
    }

    return res.status(200).json({
        nombre: data[0].nombre,
        apellidos: data[0].apellidos,
        usuario: data[0].usuario
    });
});

app.get("/api/sanitarios/:id", async function(req, res){
    var id = parseInt(req.params.id);

    var { data, error } = await supabase.from("sanitarios").select("*").eq("id", id);
    if (error){
        return res.status(500).json("Error BD");
    }

    if (data.length == 0){
        return res.status(404).json("sanit no encontrado");
    }

    return res.status(200).json({
        nombre: data[0].nombre,
        apellidos: data[0].apellidos,
        usuario: data[0].usuario
    });
});

//     recursos {
//     id: number;
//     modelo: number;
//     ubicacion: number;
//     numero_serie: string;
//     estado: number;

app.get("/api/recursos", async function(req, res) {

    var filtros = req.query;

    // modelos!inner hace el JOIN con modelos para poder filtrar por su categoría
    var consulta = supabase.from("recursos").select("*, modelos!inner(categoria)");

    if (filtros.categoria) {
        consulta = consulta.eq("modelos.categoria", filtros.categoria);
    }

    if (filtros.modelo) {
        consulta = consulta.eq("modelo", filtros.modelo);
    }

    if (filtros.ubicacion) {
        consulta = consulta.eq("ubicacion", filtros.ubicacion);
    }

    if (filtros.estado) {
        consulta = consulta.eq("estado", filtros.estado);
    }

    var { data, error } = await consulta;

    if (error) {
        return res.status(500).json("Error en la base de datos");
    }

    // Quitamos el objeto "modelos" que añade el JOIN, para devolver solo las columnas de recursos
    var recursos = data.map(function(r){
        delete r.modelos;
        return r;
    });

    return res.status(200).json(recursos);
});

app.get("/api/recursos/:id", async function(req, res){
    var id = parseInt(req.params.id);

    var { data, error } = await supabase.from("recursos").select("*").eq("id", id);
    if (error){
        return res.status(500).json("Error BD");
    }

    if (data.length == 0){
        return res.status(404).json("Recurso no encontrado");
    }

    return res.status(200).json({
        numero_serie: data[0].numero_serie,
        estado: data[0].estado,
        modelo: data[0].modelo,
        id: data[0].id,
        ubicacion: data[0].ubicacion
    });
});

app.post("/api/recursos/", async function(req, res){
    var { error } = await supabase.from("recursos").insert({
        modelo: req.body.modelo,
        ubicacion: req.body.ubicacion,
        numero_serie: req.body.numero_serie,
        estado: req.body.estado
    });

    if (error) {
        return res.status(500).json("Error al registrar el recurso");
    }

    return res.status(201).json("Recurso registrado correctamente");
});

app.put("/api/recursos/:id", async function(req, res){
    var id = parseInt(req.params.id);

    var existe = await supabase.from("recursos").select("id").eq("id", id);
    if (existe.error){
        return res.status(500).json("error bd");
    }

    if (existe.data.length == 0){
        return res.status(404).json("recurso no encontrado");
    }

    var cambios = {};

    if (req.body.modelo) {
        cambios.modelo = req.body.modelo;
    }

    if (req.body.ubicacion) {
        cambios.ubicacion = req.body.ubicacion;
    }

    if (req.body.numero_serie) {
        cambios.numero_serie = req.body.numero_serie;
    }

    if (req.body.estado) {
        cambios.estado = req.body.estado;
    }

    var { error } = await supabase.from("recursos").update(cambios).eq("id", id);
    if (error) {
        return res.status(500).json("Error en la base de datos");
    }

    return res.status(200).json("Recurso actualizado correctamente");
});

app.delete("/api/recursos/:id", async function(req, res){
    var id = parseInt(req.params.id);

    // .select() al final devuelve las filas borradas, así sabemos si existía
    var { data, error } = await supabase.from("recursos").delete().eq("id", id).select();

    if (error){
        return res.status(500).json("Error en la base de datos");
    }

    if (data.length == 0){
        return res.status(404).json("Recurso no encontrado");
    }

    return res.status(200).json("Recurso eliminado correctamente");
});

app.get("/api/recursos/:id/reservas", async function(req, res){
    var id = parseInt(req.params.id);

    var { data, error } = await supabase.from("reservas").select("*").eq("recurso", id);
    if (error){
        return res.status(500).json("Error en la base de datos");
    }
    res.status(200).json(data);
});

app.get("/api/recursos/:id/resenyas", async function(req, res){
    var id = parseInt(req.params.id);

    var { data, error } = await supabase.from("resenyas").select("*").eq("recurso", id);
    if (error){
        return res.status(500).json("Error en la base de datos");
    }
    res.status(200).json(data);
});

app.listen(3000,function(){
    console.log("Servidor sanitario iniciado correctamente en el puerto 3000")
});
