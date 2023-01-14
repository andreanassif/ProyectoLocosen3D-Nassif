"use strict";

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _cookieParser = require("cookie-parser");

var _cookieParser2 = _interopRequireDefault(_cookieParser);

var _expressSession = require("express-session");

var _expressSession2 = _interopRequireDefault(_expressSession);

var _connectMongo = require("connect-mongo");

var _connectMongo2 = _interopRequireDefault(_connectMongo);

var _configSql = require("./config/configSql.js");

var _route = require("./router/route.js");

var _route2 = _interopRequireDefault(_route);

var _expressHandlebars = require("express-handlebars");

var _expressHandlebars2 = _interopRequireDefault(_expressHandlebars);

var _socket = require("socket.io");

var _normalizr = require("normalizr");

var _passport = require("passport");

var _passport2 = _interopRequireDefault(_passport);

var _passportLocal = require("passport-local");

var _bcrypt = require("bcrypt");

var _bcrypt2 = _interopRequireDefault(_bcrypt);

var _mongoose = require("mongoose");

var _mongoose2 = _interopRequireDefault(_mongoose);

var _os = require("os");

var _os2 = _interopRequireDefault(_os);

var _config = require("./config/config.js");

var _operations = require("./managers/operations.js");

var _child_process = require("child_process");

var _cluster = require("cluster");

var _cluster2 = _interopRequireDefault(_cluster);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _url = require("url");

var _url2 = _interopRequireDefault(_url);

var _contenedorMsj = require("./managers/contenedorMsj.js");

var _user = require("./models/user.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; } //importaciones


var mensajes = new _contenedorMsj.contenedorMsj(_configSql.options.fileSystem.pathMensajes);

//const __filename = fileURLToPath(import.meta.url);
var __dirname = _path2.default.dirname(__filename);

//Conecto base de datis
var mongoUrl = _config.config.MONGO_AUTENTICATION;

_mongoose2.default.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, function (err) {
    if (err) return console.log("hubo un error: " + err);
    console.log('conexion a base de datos exitosa');
});

// configuro archivos json
var app = (0, _express2.default)();
app.use(_express2.default.json());
app.use(_express2.default.urlencoded({ extended: true }));
//app.use(express.static(path.join(__dirname,'/views')))
app.use(_express2.default.static('public'));

//motor plantilla
app.engine(".hbs", _expressHandlebars2.default.engine({ extname: '.hbs' }));

// defino directorio
app.set("views", _path2.default.join(__dirname, "/views"));

//defino motor express
app.set("view engine", ".hbs");

//normalizacion de datos

//autor
var autorSchema = new _normalizr.schema.Entity('autor');
//msj
var msjSchema = new _normalizr.schema.Entity('mensajes', { autor: autorSchema });
//esquema global
var chatSchema = new _normalizr.schema.Entity('chat', {
    mensajes: [msjSchema]
}, { idAttribute: 'id' });

//aplico normalizacion

var normalizarData = function normalizarData(data) {
    var normalizacion = (0, _normalizr.normalize)({ id: 'chatHistorico', mensajes: data }, chatSchema);
    return normalizacion;
};

var normalizarMsj = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var resultado, mensajesNormalizados;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        _context.next = 2;
                        return mensajes.getAll();

                    case 2:
                        resultado = _context.sent;
                        mensajesNormalizados = normalizarData(resultado);

                        //console.log(JSON.stringify(mensajesNormalizados, null,"\t"))

                        return _context.abrupt("return", mensajesNormalizados);

                    case 5:
                    case "end":
                        return _context.stop();
                }
            }
        }, _callee, undefined);
    }));

    return function normalizarMsj() {
        return _ref.apply(this, arguments);
    };
}();

// defino rutas

app.use('/api', _route2.default);

//Cookies
app.use((0, _cookieParser2.default)());

app.use((0, _expressSession2.default)({
    store: _connectMongo2.default.create({
        mongoUrl: _config.config.MONGO_SESSION
    }),
    secret: "claveSecreta",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 600000
    }
}));

// Configuro passport

app.use(_passport2.default.initialize()); //conecto passport con express
app.use(_passport2.default.session()); //vinculo passport y sesiones de usuarios

//serializar usuario
_passport2.default.serializeUser(function (user, done) {
    done(null, user.id);
});

//deserializar usuario
_passport2.default.deserializeUser(function (id, done) {
    _user.UserModel.findById(id, function (err, userFound) {
        return done(err, userFound);
    });
});

//middleware p/validar sesion

//const checkSession = (req,res,next) => {
//    //validamos si la sesion esta activa
//    if(req.session.user){
//        res.redirect("/perfil");
//    }else{
//        next()
//    }
//}

//crear una funcion para encriptar la contraseñas;
var createHash = function createHash(password) {
    var hash = _bcrypt2.default.hashSync(password, _bcrypt2.default.genSaltSync(10));
    return hash;
};

//Validar contraseña
//const isValidPassword = (user, password)=>{
//    return bcrypt.compareSync(password, user.password);
//}

//passport local strategy crear usuario
_passport2.default.use('signupStrategy', new _passportLocal.Strategy({
    passReqToCallback: true,
    usernameField: "email"
}, function (req, username, password, done) {

    _user.UserModel.findOne({ username: username }, function (error, userFound) {

        if (error) return done(error, null, { message: 'hubo un error' });
        if (userFound) return done(null, null, { message: 'el usuario existe' });
        var newUser = {
            name: req.body.name,
            username: username,
            password: createHash(password)
        };
        console.log(newUser);
        _user.UserModel.create(newUser, function (error, userCreated) {
            if (error) return done(error, null, { message: 'error al registrar' });
            return done(null, userCreated, { message: 'usuario creado' });
        });
    });
}));

// passport strategy iniciar sesion
_passport2.default.use('loginStrategy', new _passportLocal.Strategy(function (username, password, done) {
    //console.log(username);
    _user.UserModel.findOne({ username: username }, function (err, user) {
        //console.log(user);
        if (err) return done(err, null, { message: "Hubo un error en el logueo" });
        if (!user) return done(null, false);
        if (!user.password) return done(null, false);
        if (!isValidPassword(user, password)) {
            console.log('existen datos');
            return done(null, false, { message: 'password invalida' });
        }
        return done(null, user);
    });
}));

//configuro el puerto
var MODO = _config.config.MODO;

if (MODO === "CLUSTER" && _cluster2.default.isPrimary) {
    console.log("modo cluster");
    var numeroCPUs = _os2.default.cpus().length;
    for (var i = 0; i < numeroCPUs; i++) {
        _cluster2.default.fork(); //creacion de subprocesos
    }
    _cluster2.default.on("exit", function (worker) {
        console.log("El subproceso " + worker.process.pid + " fall\xF3");
        _cluster2.default.fork();
    });
} else {
    var PORT = _config.config.PORT;
    var server = app.listen(PORT, function () {
        return console.log("server " + PORT + " process" + process.pid + " ");
    });

    var io = new _socket.Server(server);

    io.on('connection', function () {
        var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(socket) {
            return regeneratorRuntime.wrap(function _callee3$(_context3) {
                while (1) {
                    switch (_context3.prev = _context3.next) {
                        case 0:
                            _context3.t0 = io.sockets;
                            _context3.next = 3;
                            return normalizarMsj();

                        case 3:
                            _context3.t1 = _context3.sent;

                            _context3.t0.emit.call(_context3.t0, 'chat', _context3.t1);

                            socket.broadcast.emit('nuevoUsuario');

                            /*socket.on('nuevoProducto', nuevoProducto=>{
                                productos.push(nuevoProducto)
                                fs.writeFileSync('./archivo.txt', JSON.stringify(productos))
                                io.sockets.emit('lista', productos)
                            })*/

                            socket.on('nuevoMsj', function () {
                                var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(nuevoMsj) {
                                    return regeneratorRuntime.wrap(function _callee2$(_context2) {
                                        while (1) {
                                            switch (_context2.prev = _context2.next) {
                                                case 0:
                                                    _context2.next = 2;
                                                    return mensajes.save(nuevoMsj);

                                                case 2:
                                                    _context2.t0 = io.sockets;
                                                    _context2.next = 5;
                                                    return normalizarMsj();

                                                case 5:
                                                    _context2.t1 = _context2.sent;

                                                    _context2.t0.emit.call(_context2.t0, 'chat', _context2.t1);

                                                case 7:
                                                case "end":
                                                    return _context2.stop();
                                            }
                                        }
                                    }, _callee2, undefined);
                                }));

                                return function (_x2) {
                                    return _ref3.apply(this, arguments);
                                };
                            }());

                        case 7:
                        case "end":
                            return _context3.stop();
                    }
                }
            }, _callee3, undefined);
        }));

        return function (_x) {
            return _ref2.apply(this, arguments);
        };
    }());
}

//rutas del sitio web

app.get("/", function (req, res) {
    res.render("home");
});

app.get("/signup", function (req, res) {
    var errorMessage = req.session.messages ? req.session.messages[0] : '';
    res.render("signup", { error: errorMessage });
    req.session.messages = [];
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/profile", function (req, res) {
    console.log(req.session);
    if (req.isAuthenticated()) {
        res.render("profile");
    } else {
        res.send("<div>Debes <a href='/login'>inciar sesion</a> o <a href='/signup'>registrarte</a></div>");
    }
});

//let users = [];

//rutas de autenticacion

//app.post("/login",(req,res)=>{
//    const users = req.body;
//    //el usuario existe
//    const userExists = users.find(elm=>elm.email === users.email);
//    if(userExists){
//        //validar la contraseña
//        if(userExists.password === user.password){
//            req.session.user = user;
//            res.redirect("/profile")
//        } else{
//            res.redirect("/login")
//        }
//    } else{
//        res.redirect("/signup");
//    }
//});

app.post("/login", _passport2.default.authenticate('loginStrategy', {
    failureRedirect: "/profile",
    failureMessage: true
}), function (req, res) {
    res.redirect("/profile");
});

app.post("/signup", _passport2.default.authenticate('signupStrategy', {
    failureRedirect: "/signup",
    failureMessage: true //req.session.messages
}), function (req, res) {
    res.redirect("/profile");
});

app.get("/profile", function () {
    var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(req, res) {
        var name;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
            while (1) {
                switch (_context4.prev = _context4.next) {
                    case 0:
                        if (req.isAuthenticated()) {
                            name = req.user.name;

                            res.render("form", { user: name });
                        } else {
                            res.send("<div>Debes <a href='/login'>inciar sesion</a> o <a href='/signup'>registrarte</a></div>");
                        }

                    case 1:
                    case "end":
                        return _context4.stop();
                }
            }
        }, _callee4, undefined);
    }));

    return function (_x3, _x4) {
        return _ref4.apply(this, arguments);
    };
}());

app.get("/logout", function (req, res) {
    req.logout(function (err) {
        if (err) return res.send("hubo un error al cerrar sesion");
        req.session.destroy();
        res.redirect("/");
    });
});

//------------------desafio 14----------------------------

app.get("/info", function (req, res) {
    var argumentosEntrada = process.argv;
    var pathEjecucion = process.execPath;
    var sistemaOperativo = process.platform;
    var processId = process.pid;
    var nodeVersion = process.version;
    var carpetaProyecto = process.cwd();
    var usoMemoria = process.memoryUsage();
    var numeroCPUs = _os2.default.cpus().length;
    var PORT = _config.config.PORT;

    res.json({
        message: "Respuesta desde el puerto " + PORT + " en el proceso " + process.pid,
        response: argumentosEntrada, //- Argumentos de entrada 
        pathEjecucion: pathEjecucion, //- Path de ejecución
        processId: processId, //- Process id
        sistemaOperativo: sistemaOperativo, //- Nombre de la plataforma (sistema operativo)
        nodeVersion: nodeVersion, //- Versión de node.js
        carpetaProyecto: carpetaProyecto, //- Carpeta del proyecto
        usoMemoria: usoMemoria, //- Memoria total reservada (rss)
        numeroCPUs: numeroCPUs
    });
});

app.get("/random", function (req, res) {
    var child = (0, _child_process.fork)("src/child.js");
    var cantidad = req.query.cantidad;


    var obj = {};
    cantidad ? child.send({ cantidad: cantidad, obj: obj }) : child.send({ cantidad: 500000000, obj: obj });
    child.on('message', function (msg) {
        return res.json(msg);
    });
});
