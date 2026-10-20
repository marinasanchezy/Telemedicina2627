// rest.get(url, callback)
// rest.post(url, body, callback)
// rest.put(url, body, callback)
// rest.delete(url, callback)
// function callback(estado, respuesta) {...}

var login = document.getElementById("login");
var registro = document.getElementById("registro");
var main = document.getElementById("main");
var detalleRecurso = document.getElementById("detalleRecurso");
var actual = login;
var anterior = login;
var id_gestor = null; //usar esta variable, es el gestor con el que estoy ahora
var id_recurso = null; //usar SON DEL LOGIN
var conexion = null;
var token = null; // lo devuelve el login; hay que pegarlo al final de cada URL (?token=...)

// Pega el token a una URL. Si ya tiene "?" (filtros) lo añade con & o directamente.
function conToken(url){
    var ultimo = url.charAt(url.length - 1);
    if (url.indexOf("?") == -1){
        return url + "?token=" + token;
    } else if (ultimo == "?" || ultimo == "&"){
        return url + "token=" + token;
    } else {
        return url + "&token=" + token;
    }
}

var categoriaArray = [
    "",
    "Ecógrafos",
    "Pulsioxímetros",
    "Bombas de infusión"
];

var modeloArray = [
    "",
    "Ecógrafo Doppler SonoScan v4",
    "Pulsioxímetro SatuMax 200",
    "Bomba de Infusión Continua FlowMaster",
    "Ecógrafo Portátil PocketView"
];

// modeloCategoriaArray[idModelo] = idCategoria, para poder pintar la
// categoría de un recurso a partir de su modelo
var modeloCategoriaArray = [
    "",
    1, // Ecógrafo Doppler SonoScan v4       -> Ecógrafos
    2, // Pulsioxímetro SatuMax 200          -> Pulsioxímetros
    3, // Bomba de Infusión Continua FlowMaster -> Bombas de infusión
    1  // Ecógrafo Portátil PocketView       -> Ecógrafos
];

var ubicacionArray = [
    "",
    "Sala de Urgencias",
    "Laboratorio Central",
    "Almacén Principal"
];


var estadoArray = [
    "Operativo",
    "De baja",
    "En mantenimiento"
];


var areaArray = [
    "",
    "Alergología", "Anestesiología", "Cardiología", "Cirugía General", "Dermatología",
    "Aparato Digestivo", "Endocrinología", "Ginecología", "Hematología", "Medicina Interna",
    "Neumología", "Neurología", "Oftalmología", "Oncología", "Pediatría", "Psiquiatría",
    "Traumatología", "Urología"
];











function cambiarVista(vistaNueva){
    actual.classList.remove("activa");
    actual.classList.add("inactiva");
    anterior = actual;
    actual = vistaNueva;
    actual.classList.remove("inactiva");
    actual.classList.add("activa");
}

function entrar(){
    var user = document.getElementById("user").value //para el login
    var contra = document.getElementById("contra").value

    console.log("Usuario:", user, "Contraseña:", contra);

    rest.post("/api/gestores/login", {user: user, contra: contra}, function(estado, respuesta){
        console.log("Estado:", estado, "Respuesta:", respuesta);
        if (estado != 200){
            alert(respuesta);
            return;
        } else {
            id_gestor = parseInt(respuesta.id);
            token = respuesta.token;
            rest.get(conToken("/api/gestores/" + id_gestor), function(estado, respuesta){
                if (estado != 200){
                    alert("Error cargando los datos del gestor");
                    return;
                }
                document.getElementById("nombreGestor").innerHTML = respuesta.nombre + " " + respuesta.apellidos;
                document.getElementById("user").value = "";
                document.getElementById("contra").value = "";
                actualizarRecursos(null);
                actualizarRanking();

                cambiarVista(main); // primero mostramos la vista, aunque el WebSocket falle

                try { // en la nube (https) ws://localhost no está permitido y daría error: el resto de la app debe seguir funcionando
                conexion = new WebSocket("ws://localhost:4444", "conexion");
                conexion.addEventListener("open", function () {
                    console.log("Conexión WebSocket abierta");
                    conexion.send(JSON.stringify({
                        operacion: "gestor",
                        id: id_gestor
                    }));
                });

                conexion.addEventListener("message", function (msg) {
                msg = JSON.parse(msg.data);
                switch (msg.operacion) {
                    case "resenyas": // 
                        var tablaAvisos = document.getElementById("avisosGestor");
                        tablaAvisos.getElementsByTagName("tbody")[0].innerHTML += 
                            "<tr style='background-color:" + msg.color + "'>" +
                            "<td>" + msg.fecha + "</td>" +
                            "<td>" + msg.origen + "</td>" +
                            "<td>" + msg.texto + "</td></tr>";
                        break;
                    
                }
            });
                } catch (error) {
                    console.log("WebSocket no disponible: " + error);
                }
            })

    }

    });

}

function registrar(){
    cambiarVista(registro);
}

function cancelarReg(){
    if (anterior == login){
        document.getElementById("user").value = "";
        document.getElementById("contra").value = "";
        cambiarVista(login);
    } else {
        cambiarVista(main);
    }
}

function cerrarSesion(){
    conexion.close();
    token = null;
    var tablaAvisos = document.getElementById("avisosGestor");
    tablaAvisos.getElementsByTagName("tbody")[0].innerHTML = "";
    cambiarVista(login);
}

function actualizarRecursos(filtros){
    var url = "/api/recursos";
    if (filtros != null){
        url += filtros;
    }

    rest.get(conToken(url), function(estado, respuesta){
        console.log("Estado:", estado, "Recursos:", respuesta);
        if (estado != 200){
            alert("Error cargando los recursos");
            return;
        }
        var tabla = document.getElementById("tablaRecursos");
        tabla.getElementsByTagName("tbody")[0].innerHTML = "";
        for (var i=0; i < respuesta.length; i++){
            var idCategoria = modeloCategoriaArray[respuesta[i].modelo];
            tabla.getElementsByTagName("tbody")[0].innerHTML += "<tr><td>" + respuesta[i].numero_serie + "</td><td>" + categoriaArray[idCategoria] + "</td><td>" + modeloArray[respuesta[i].modelo] + "</td><td>" + ubicacionArray[respuesta[i].ubicacion] + "</td><td>" + estadoArray[respuesta[i].estado] + "</td><td>" + "<button onclick='abrir(" + respuesta[i].id + ")'>Abrir</button> <button onclick='borrar(" + respuesta[i].id + ")'>X</button></td></tr>";
        }
    });
}

function buscar(){
    var cate = document.getElementById("categoriaSelect").value;
    var mod = document.getElementById("modeloSelect").value;
    var ubi = document.getElementById("ubicacionSelect").value;
    var est = document.getElementById("estadoSelect").value;

    var filtros = "?";
    if (cate != ""){
        filtros += "categoria=" + cate + "&";
    }
    if (mod != ""){
        filtros += "modelo=" + mod + "&";
    }
    if (ubi != ""){
        filtros += "ubicacion=" + ubi + "&";
    }
    if (est != ""){
        filtros += "estado=" + est + "&";
    }
    console.log("Filtros:", filtros);
    actualizarRecursos(filtros);
}

function guardar(){
    var datos = {
        nombre:    document.getElementById("name").value,
        apellidos: document.getElementById("ape").value,
        usuario:   document.getElementById("userNuevo").value,
        password:  document.getElementById("contraNueva").value
    };

    var entero = true;
    for (var clave in datos){
        if (datos[clave] == ""){
            entero = false;
            break;
        }
    }
    
    if (anterior == login && entero){
        rest.post("/api/gestores", datos, function(estado, respuesta){ //datos es el body, ver luego para el server
            alert(respuesta);
            if (estado == 201){
                document.getElementById("name").value = "";
                document.getElementById("ape").value = "";
                document.getElementById("userNuevo").value = "";
                document.getElementById("contraNueva").value = "";
                cambiarVista(login);
            }
        })
    } else if (anterior == login){
        alert("Por favor, rellena todos los campos");
    } else {
        rest.put(conToken("/api/gestores/" + id_gestor), datos, function(estado, respuesta){
            alert(respuesta);
            rest.get(conToken("/api/gestores/" + id_gestor), function(estado, respuesta){
                document.getElementById("nombreGestor").innerHTML = respuesta.nombre + " " + respuesta.apellidos;
            });
            document.getElementById("name").value = "";
            document.getElementById("ape").value = "";
            document.getElementById("userNuevo").value = "";
            document.getElementById("contraNueva").value = "";
            if (estado == 200){
                cambiarVista(main);
            }
        });
    }
}

function abrir(idRecurso){
    id_recurso = idRecurso;
    
    rest.get(conToken("/api/recursos/" + idRecurso), function(estado, respuestaRecurso){
        if (estado == 200) {
            actualizarSelectsRecurso(respuestaRecurso);            
            document.getElementById("detalleNumeroSerie").value = respuestaRecurso.numero_serie;
            document.getElementById("detalleEstado").value = respuestaRecurso.estado;
        }
    });

    actualizarReservas(idRecurso);
    actualizarResenyas(idRecurso);
    cambiarVista(detalleRecurso);
}

function borrar(id){
    conexion.send(JSON.stringify({
                    operacion: "borrarRecurso",
                    idRecurso: id,
                    idGestor: id_gestor
    }));
    rest.delete(conToken("/api/recursos/" + id), function(estado, respuesta){
        alert(respuesta);
    });
    actualizarRecursos(null);
}

function añadirRecurso(){
    document.getElementById("detalleCategoria").value = "";
    document.getElementById("detalleModelo").value = "";
    document.getElementById("detalleNumeroSerie").value = "";
    document.getElementById("detalleUbicacion").value = "";
    document.getElementById("detalleEstado").value = "";
    actualizarSelectsRecurso();
    cambiarVista(detalleRecurso);
}
function actualizarSelectsRecurso(datos){
    rest.get(conToken("/api/categorias"), function(estado, respuesta){
        if (estado == 200){
            var select = document.getElementById("detalleCategoria");
            select.innerHTML = "<option value=''>Selecciona una categoría</option>";
            for (var i=0; i < respuesta.length; i++){
                select.innerHTML += "<option value='" + respuesta[i].id + "'>" + respuesta[i].nombre + "</option>";
            }
            // datos si se llama desde abrir, null si desde añadirRecurso
            if(datos) select.value = datos.modelo;
        }
    });

    rest.get(conToken("/api/modelos"), function(estado, respuesta){
        if (estado == 200){
            var select = document.getElementById("detalleModelo");
            select.innerHTML = "<option value=''>Selecciona un modelo</option>";
            for (var i=0; i < respuesta.length; i++){
                select.innerHTML += "<option value='" + respuesta[i].id + "'>" + respuesta[i].nombre + "</option>";
            }
            if(datos) select.value = datos.modelo;
        }
    });

    rest.get(conToken("/api/ubicaciones"), function(estado, respuesta){
        if (estado == 200){
            var select = document.getElementById("detalleUbicacion");
            select.innerHTML = "<option value=''>Selecciona una ubicación</option>";
            for (var i=0; i < respuesta.length; i++){
                select.innerHTML += "<option value='" + respuesta[i].id + "'>" + respuesta[i].nombre + "</option>";
            }
            if(datos) select.value = datos.ubicacion;
        }
    });
}

function volverListado(){
    var tabla = document.getElementById("tablaReservas");
    tabla.getElementsByTagName("tbody")[0].innerHTML = "";

    var tabla = document.getElementById("tablaResenyas");
    tabla.getElementsByTagName("tbody")[0].innerHTML = "";

    id_recurso = null;
    console.log("Volviendo al listado. ID recurso:", id_recurso);
    cambiarVista(main);
}
function sumarPunto(idResenya){
    rest.put(conToken("/api/recursos/resenyas/" + idResenya), {puntos: 1}, function(estado, resp){
        if (estado == 200){
            actualizarResenyas(id_recurso); 
        } else {
            alert("Error al sumar punto");
        }
    });
}
function guardarRecurso(){
    var datos = {
        categoria: document.getElementById("detalleCategoria").value,
        modelo: document.getElementById("detalleModelo").value,
        numero_serie: document.getElementById("detalleNumeroSerie").value,
        ubicacion: document.getElementById("detalleUbicacion").value,
        estado: document.getElementById("detalleEstado").value
    };
    console.log("Datos del nuevo recurso:", datos);

    var entero = true;
    for (var clave in datos){
        if (datos[clave] == ""){
            entero = false;
            break;
        }
    }
    console.log("¿Datos completos?", entero, "ID recurso:", id_recurso);
    if (entero && id_recurso == null){
        rest.post(conToken("/api/recursos"), datos, function(estado, respuesta){ //los datos es el body q se envian al server; crear recurso
            alert(respuesta);
            if (estado == 201){
                conexion.send(JSON.stringify({
                    operacion: "recursos",
                    datos: datos,
                    idGestor: id_gestor
                }));
                actualizarRecursos(null);
                volverListado();
            }
        });
    } else {
        if (id_recurso == null){
            alert("Rellena todos los campos!");
            return;
        }
        rest.put(conToken("/api/recursos/" + id_recurso), datos, function(estado, respuesta){
            alert(respuesta);
        });
        id_recurso = null;
        actualizarRecursos(null);
        volverListado();
    }
}

function actualizarReservas(id_rec){
    rest.get(conToken("/api/recursos/"+id_rec+"/reservas"),function(estado, respuesta){
        var tabla = document.getElementById("tablaReservas");
        tabla.getElementsByTagName("tbody")[0].innerHTML = "";
        for (let i=0; i < respuesta.length; i++){
            let color = cogerColor(respuesta[i].horas_estimadas, respuesta[i].fecha_peticion, respuesta[i].fecha_inicio, respuesta[i].fecha_fin);
            let sanitario = respuesta[i].sanitario;
            let horas = respuesta[i].horas_estimadas;
            let fpet = respuesta[i].fecha_peticion ? new Date(respuesta[i].fecha_peticion).toLocaleString('es-ES') : "";
            let fi   = respuesta[i].fecha_inicio   ? new Date(respuesta[i].fecha_inicio).toLocaleString('es-ES')   : "";
            let ff   = respuesta[i].fecha_fin   ? new Date(respuesta[i].fecha_fin).toLocaleString('es-ES')    : "";

            rest.get(conToken("/api/sanitarios/" + sanitario), function(estado, respuestaSanitario){
                if (estado == 200){
                    var nombre_sanitario = respuestaSanitario.nombre + " " + respuestaSanitario.apellidos;
                } else {
                    console.log("Error cargando datos del sanitario con id " + sanitario);
                }
                
                tabla.getElementsByTagName("tbody")[0].innerHTML += '<tr class="' + color + '"><td>' + nombre_sanitario + '</td><td>' + horas + '</td><td>' + fpet + '</td><td>' + fi + '</td><td>' + ff + '</td></tr>';
            });

        }
    });
}

function actualizarResenyas(id_rec){
    rest.get(conToken("/api/recursos/"+id_rec+"/resenyas"),function(estado, respuesta){
        var tabla = document.getElementById("tablaResenyas");
        tabla.getElementsByTagName("tbody")[0].innerHTML = "";
        for (let i=0; i < respuesta.length; i++){
            let id_valoracion = respuesta[i].id;
            let sanitario = respuesta[i].sanitario;
            let valoracion = respuesta[i].valor;
            let comentario = respuesta[i].descripcion;
            let fecha = respuesta[i].fecha ? new Date(respuesta[i].fecha).toLocaleString('es-ES') : "";
            
            rest.get(conToken("/api/sanitarios/" + sanitario), function(estado, respuestaSanitario){
                if (estado == 200){
                    var nombre_sanitario = respuestaSanitario.nombre + " " + respuestaSanitario.apellidos;
                } else {
                    console.log("Error cargando datos del sanitario con id " + sanitario);
                }
                

                tabla.getElementsByTagName("tbody")[0].innerHTML += "<tr><td>" + fecha + "</td><td>" + nombre_sanitario + "</td><td>" + valoracion + "</td><td>" + comentario + "</td></tr>";
            });

        }
    });
}

    
function cogerColor(horas, fpet, fi, ff){
    const ahora = new Date();
    fpet = fpet ? new Date(fpet) : null;
    fi = fi ? new Date(fi) : null;
    ff = ff ? new Date(ff) : null;
    let horasUsando = ((ahora - fi) / (1000 * 60 * 60)).toFixed(0);
    console.log("ff:", ff);
    if (ff){ 
        console.log("blanco");
        return "blanco"
    } else if (!fi){
        console.log("verde");
        return "verde"
    } else if (horasUsando > horas){
        console.log("rojo");
        return "rojo"
    } else {
        console.log("azul");
        return "azul"
    }
}
var listaDatos = [];   // aquí se van guardando los objetos de cada reserva
var pendientes = 0;    // cuántas peticiones faltan por contestar

function enviarReservas() {
    listaDatos = [];                                   // empiezo de cero cada vez que pulsas el botón
    rest.get(conToken("/api/recursos"), function(estado, respuesta) {
        if (estado != 200) {
            alert("Error al cargar los recursos");
            return;
        }
        pendientes = respuesta.length;                 // voy a lanzar una petición de reservas por recurso
        for (var i = 0; i < respuesta.length; i++) {
            pedirReservas(respuesta[i]);
        }
    });
}

function pedirReservas(recurso) {
    rest.get(conToken("/api/recursos/" + recurso.id + "/reservas"), function(estado, reservas) {
        if (estado != 200) {
            alert("Error al cargar las reservas");
            return;
        }
        pendientes = pendientes + reservas.length;     // sumo las peticiones de sanitario que voy a lanzar
        for (var j = 0; j < reservas.length; j++) {
            pedirSanitario(reservas[j], recurso);
        }
        pendientes = pendientes - 1;                   // esta petición de reservas ya ha terminado
        terminar();
    });
}

function pedirSanitario(reserva, recurso) {
    rest.get(conToken("/api/sanitarios/" + reserva.sanitario), function(estado, sanitario) {
        if (estado != 200) {
            alert("Error al cargar el sanitario");
            return;
        }
        var entrada = {
            nombre: sanitario.nombre,
            apellidos: sanitario.apellidos,
            "categoría": categoriaArray[modeloCategoriaArray[recurso.modelo]],
            horas_estimadas: reserva.horas_estimadas,
            fec_pet: reserva.fecha_peticion,
            fec_ini: reserva.fecha_inicio,
            fecha_fin: reserva.fecha_fin
        };
        listaDatos.push(entrada);
        console.log(entrada);
        pendientes = pendientes - 1;                   // esta petición de sanitario ya ha terminado
        terminar();
    });
}

function terminar() {
    if (pendientes == 0) {
        console.log("Todo recibido: " + listaDatos.length + " reservas");
    }
}
function leerMinisterio() {
    rest.get("https://undefined.ua.es/telemedicina/api/datos", function(estado, respuesta) {
        console.log("Estado:", estado);
        console.log("Cuántos envíos hay:", respuesta.length);
        console.log(respuesta);
    });
}
function terminar() {
    if (pendientes == 0) {
        var envio = {
            id_area: 13,
            fecha: new Date().toISOString().slice(0, 10),
            datos: listaDatos
        };
        console.log(envio);
                rest.post("https://undefined.ua.es/telemedicina/api/datos", envio, function(estado, respuesta) {
            console.log("Estado del POST:", estado);
            console.log(respuesta);
            if (estado != 200 && estado != 201) {
                alert("Error al enviar las reservas al Ministerio");
                return;
            }
            actualizarRanking();
            alert("Reservas enviadas al Ministerio");
        });
    }
}
function actualizarRanking() {
    rest.get("https://undefined.ua.es/telemedicina/api/datos", function(estado, respuesta) {
        if (estado != 200) {
            alert("Error al cargar los datos del Ministerio");
            return;
        }

        // totales[idArea] = reservas de esa área; empiezan todas en 0
        var totales = [];
        for (var a = 0; a < areaArray.length; a++) {
            totales.push(0);
        }

        // cada envío trae su id_area y un array "datos" con una reserva por elemento
        for (var i = 0; i < respuesta.length; i++) {
            var area = respuesta[i].id_area;
            if (area >= 1 && area <= 18 && Array.isArray(respuesta[i].datos)) {
                totales[area] = totales[area] + respuesta[i].datos.length;
            }
        }

        // paso a una lista de objetos {area, reservas} para poder ordenarla
        var ranking = [];
        for (var b = 1; b < areaArray.length; b++) {
            ranking.push({ area: b, reservas: totales[b] });
        }
        ranking.sort(function(x, y) {
            return y.reservas - x.reservas;      // de más a menos reservas
        });

        // pinto la tabla
        var tabla = document.getElementById("tablaRanking");
        tabla.getElementsByTagName("tbody")[0].innerHTML = "";
        for (var k = 0; k < ranking.length; k++) {
            tabla.getElementsByTagName("tbody")[0].innerHTML +=
                "<tr><td>" + (k + 1) + "</td><td>" + areaArray[ranking[k].area] + "</td><td>" + ranking[k].reservas + "</td></tr>";
        }
    });
}