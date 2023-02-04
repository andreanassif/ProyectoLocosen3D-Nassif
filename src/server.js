//importaciones
import express from "express"; 
import cookieParser from 'cookie-parser';
import session from "express-session"; 
import MongoStore from 'connect-mongo';
import { options } from './config/configSql.js';
import router from "./router/route.js";
import handlebars from "express-handlebars";
import { Server } from "socket.io";
import { normalize, schema, denormalize} from "normalizr";
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import os from "os"
import {config} from './config/config.js'
import { random } from "./managers/operations.js"
import {fork} from "child_process"
import cluster from "cluster"
import compression from "compression";
import {createTransport} from "nodemailer";


import path from "path";
import url from "url";
import { fileURLToPath } from "url";
import {dirname} from "path";
import {contenedorMsj} from "./managers/contenedorMsj.js"
import { UserModel} from './models/user.js';

const mensajes = new contenedorMsj(options.fileSystem.pathMensajes)


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



//Conecto base de datis
const mongoUrl = config.MONGO_AUTENTICATION

mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology:true,
    
}, (err)=>{
    if(err) return console.log(`hubo un error: ${err}`);
    console.log('conexion a base de datos exitosa');
})


// configuro archivos json
const app = express()
app.use(express.json())
app.use(express.urlencoded({extended:true}))
//app.use(express.static(path.join(__dirname,'/views')))
app.use(express.static('public'))

//motor plantilla
app.engine(".hbs", handlebars.engine({extname: '.hbs'}))

// defino directorio
app.set("views", path.join(__dirname,"/views"))

//defino motor express
app.set("view engine", ".hbs")



/* const PORT = process.env.PORT || 8080;
app.listen(PORT,()=>console.log(`Server listening on port ${PORT}`));
 */



//normalizacion de datos

//autor
const autorSchema = new schema.Entity('autor')
//msj
const msjSchema = new schema.Entity('mensajes',{autor:autorSchema})
//esquema global
const chatSchema = new schema.Entity('chat',{
    mensajes:[msjSchema]
},{idAttribute:'id'})

//aplico normalizacion

const normalizarData = (data)=>{
    const normalizacion = normalize({id:'chatHistorico', mensajes:data},chatSchema)
    return normalizacion
}

const normalizarMsj = async()=>{
    const resultado = await mensajes.getAll()
    const mensajesNormalizados = normalizarData(resultado)
    
    //console.log(JSON.stringify(mensajesNormalizados, null,"\t"))
    
    return mensajesNormalizados
}

// defino rutas

app.use('/api', router);


//Cookies
app.use(cookieParser())

app.use(session({
    store: MongoStore.create({
        mongoUrl: config.MONGO_SESSION
    }),
    secret:"claveSecreta",
    resave:false,
    saveUninitialized:false,
    cookie:{
        maxAge:600000
    }
}))

// Configuro passport

app.use(passport.initialize()) //conecto passport con express
app.use(passport.session()) //vinculo passport y sesiones de usuarios

//serializar usuario
passport.serializeUser((user,done)=>{
    done(null, user.id)
})

//deserializar usuario
passport.deserializeUser((id, done)=>{
    UserModel.findById(id,(err, userFound)=>{
        return done(err,userFound)
    })
})

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
const createHash = (password)=>{
    const hash = bcrypt.hashSync(password,bcrypt.genSaltSync(10));
    return hash;
}

//Validar contraseña
//const isValidPassword = (user, password)=>{
//    return bcrypt.compareSync(password, user.password);
//}

//passport local strategy crear usuario
passport.use('signupStrategy', new LocalStrategy(
    {
        passReqToCallback:true,
        usernameField: "email",
    },
    (req,username,password,done)=>{
        
        UserModel.findOne({username:username}, (error,userFound)=>{
            
            if (error) return done(error,null,{message:'hubo un error'})
            if(userFound) return done(null,null,{message:'el usuario existe'}) 
            const newUser = {
                name: req.body.name,
                username:username,
                password:createHash(password)
            }
            console.log(newUser);
            UserModel.create(newUser, (error,userCreated)=>{
                if(error) return done(error,null, {message:'error al registrar'})
                return done(null, userCreated,{message:'usuario creado'})
            })
        })
    }
))

// passport strategy iniciar sesion
passport.use('loginStrategy', new LocalStrategy(
    (username, password, done) => {
        //console.log(username);
        UserModel.findOne({ username: username }, (err, user)=> {
            //console.log(user);
            if (err) return done(err, null, {message: "Hubo un error en el logueo"});
            if (!user) return done(null, false);
            if (!user.password) return done(null, false);
            if (!isValidPassword(user,password)){
                console.log('existen datos')
                return done(null,false,{message:'password invalida'})
            }
            return done(null, user);
        });
    }
    

));




//configuro el puerto
const MODO = config.MODO

if(MODO === "CLUSTER" && cluster.isPrimary){
    console.log("modo cluster")
    const numeroCPUs = os.cpus().length
     for(let i=0; i<numeroCPUs; i++){
        cluster.fork() //creacion de subprocesos
    }
    cluster.on("exit", (worker)=>{
        console.log(`El subproceso ${worker.process.pid} falló`)
        cluster.fork()
    })  
} else {
    const PORT = config.PORT
    const server = app.listen(8080,()=>console.log(`server ${PORT} process${process.pid} `))
    
    
    
    const io = new Server(server);
    
    io.on('connection', async(socket)=>{
        //console.log('nuevo usuario', socket.id)
    
        //io.sockets.emit('productos', productos);
        io.sockets.emit('chat', await normalizarMsj());
    
        socket.broadcast.emit('nuevoUsuario')
    
        /*socket.on('nuevoProducto', nuevoProducto=>{
            productos.push(nuevoProducto)
            fs.writeFileSync('./archivo.txt', JSON.stringify(productos))
            io.sockets.emit('lista', productos)
        })*/
    
        socket.on('nuevoMsj', async (nuevoMsj) =>{
            await mensajes.save(nuevoMsj)
            io.sockets.emit('chat', await normalizarMsj())
        })
    })
}



//rutas del sitio web

app.get("/", (req,res)=>{
    res.render("home")
})



app.get("/signup", (req,res)=>{
    const errorMessage = req.session.messages ? req.session.messages[0] : '';
    res.render("signup", {error: errorMessage})
    req.session.messages = []

})


app.get("/login", (req,res)=>{
    res.render("login")
})


app.get("/profile",(req,res)=>{
    console.log(req.session)
    if(req.isAuthenticated()){
        res.render("profile");
    } else{
        res.send("<div>Debes <button class='btn btn-success'><a href='/login'>inciar sesion</a></button> o <button class='btn btn-success'><a href='/signup'>registrarte</a></button></div>")
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

app.post("/login",passport.authenticate('loginStrategy',{
    failureRedirect: "/profile",
    failureMessage:true
}),(req,res)=>{
    res.redirect("/profile")
})



app.post("/signup",passport.authenticate('signupStrategy',{
    failureRedirect:"/signup",
    failureMessage:true //req.session.messages
}), (req,res)=>{
    res.redirect("/profile")

});





app.get("/profile",async(req,res)=>{
    if(req.isAuthenticated()){
        let {name} = req.user
        res.render("form",{user:name})
    }else{
        res.send("<div>Debes <a href='/login'>inciar sesion</a> o <a href='/signup'>registrarte</a></div>")
    }
})

app.get("/logout",(req,res)=>{
    req.logout(err=>{
        if(err) return res.send("hubo un error al cerrar sesion")
        req.session.destroy();
        res.redirect("/")
    });
});

//------------------desafio 14----------------------------

app.get("/info", (req,res)=>{
    let argumentosEntrada = process.argv
    let pathEjecucion = process.execPath
    let sistemaOperativo = process.platform
    let processId = process.pid
    let nodeVersion = process.version
    let carpetaProyecto = process.cwd()
    let usoMemoria = process.memoryUsage();
    let numeroCPUs = os.cpus().length
    const PORT = config.PORT

    res.json({
        message: `Respuesta desde el puerto ${PORT} en el proceso ${process.pid}`,
        response: 
            argumentosEntrada, //- Argumentos de entrada 
            pathEjecucion, //- Path de ejecución
            processId, //- Process id
            sistemaOperativo, //- Nombre de la plataforma (sistema operativo)
            nodeVersion, //- Versión de node.js
            carpetaProyecto, //- Carpeta del proyecto
            usoMemoria,//- Memoria total reservada (rss)
            numeroCPUs,
    })
})

//--------desafio 16-----------------------

app.get("/infoZip", compression(), (req,res)=>{
    let argumentosEntrada = process.argv
    let pathEjecucion = process.execPath
    let sistemaOperativo = process.platform
    let processId = process.pid
    let nodeVersion = process.version
    let carpetaProyecto = process.cwd()
    let usoMemoria = process.memoryUsage();
    let numeroCPUs = os.cpus().length
    const PORT = config.PORT

    res.json({
        message: `Respuesta desde el puerto ${PORT} en el proceso ${process.pid}`,
        response: 
            argumentosEntrada, //- Argumentos de entrada 
            pathEjecucion, //- Path de ejecución
            processId, //- Process id
            sistemaOperativo, //- Nombre de la plataforma (sistema operativo)
            nodeVersion, //- Versión de node.js
            carpetaProyecto, //- Carpeta del proyecto
            usoMemoria,//- Memoria total reservada (rss)
            numeroCPUs,
    })
})
//-----------------------------------


app.get("/random", (req,res)=>{
    const child = fork("src/child.js");
    const {cantidad} = req.query
    
    let obj = {};
    cantidad
            ? child.send({ cantidad, obj })
            : child.send({ cantidad: 500000000, obj });
            child.on('message', msg => res.json(msg))
})

//-------desafio  clase 18 3er entrega vista carrito y productos---------------

app.get("/cart", (req,res)=>{
    res.render("cart")
})

app.get("/productos", (req,res)=>{
    res.render("productos")
    req.body()
})

//-----------desafio 18 3er entrega proyecto - Add Nodemailer con gmail y Twilio ----------------
//variables externas
const TEST_EMAIL = config.TEST_EMAIL; //modificamos credenciales de acceso
const TEST_PASS = config.TEST_PASS;
//config nodemailer transporter
const transporter = createTransport({
    host: 'smtp.gmail.com', //modificamos el host de gmail
    port: 587,
    auth: {
        user: TEST_EMAIL,
        pass: TEST_PASS
    },
    secure: false, //cuando se use tiene que estar en true
    tls: {
        rejectUnauthorized: false //cuando se use tiene que estar en true
    }
});

const emailTemplate =`<div>
<h1>Un nuevo usuario se ha registrado correctamente!</h1>
</div>`

const mailOptions={
    from: "Servidor de NodeJS",
    to: TEST_EMAIL,
    subject:"Nuevo Registro de Usuario",
    html: emailTemplate
}


app.post("/signup", async(res,req)=>{

    try{
        const response = await transporter.sendMail(mailOptions);
        res.send(`El msj fue enviado ${response}`)       
        
    } catch (error) {
        res.send(error)
    }   
})


