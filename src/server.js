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



import path from "path";
import url from "url";
import { fileURLToPath } from "url";
import {dirname} from "path";
import {contenedorMsj} from "./managers/contenedorMsj.js"
import { UserModel } from './models/user.js';

const mensajes = new contenedorMsj(options.fileSystem.pathMensajes)


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Conecto base de datis
const mongoUrl = "mongodb+srv://nassif:benicio2022@locosen3d.4crkgqb.mongodb.net/AuthDB?retryWrites=true&w=majority"

mongoose.createConnection(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology:true
}, (err)=>{
    if(err) return console.log(`hubo un error: ${err}`);
    console.log('conexion a base de datos exitosa');
})


// configuro archivos json
const app = express()
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname,'/views')))


//motor plantilla
app.engine(".hbs", handlebars.engine({extname: '.hbs'}))

// defino directorio
app.set("views", path.join(__dirname,"/views"))

//defino motor express
app.set("view engine", ".hbs")

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
        mongoUrl:"mongodb+srv://nassif:benicio2022@locosen3d.4crkgqb.mongodb.net/sessionDB?retryWrites=true&w=majority"
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
    UserModel.findById(id,(error, userFound)=>{
        if(error) return done(error)
        return done(null,userFound)
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
const isValidPassword = (user, password)=>{
    return bcrypt.compareSync(password, user.password);
}

//passport strategy crear usuario
passport.use('signupStrategy', new LocalStrategy({
    passReqToCallback:true,
    usernameField: "email",
},
    (req,username,password,done)=>{
        console.log(username);
        UserModel.findOne({username:username}, (error,userFound)=>{
            console.log(userFound)
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
        console.log(username);
        UserModel.findOne({ username: username }, (err, user)=> {
            console.log(user);
            if (err) return done(err);
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
const PORT = process.env.PORT|| 8081

const server = app.listen(PORT,()=>console.log(`server ${PORT}`))

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

//rutas del sitio web

app.get("/", (req,res)=>{
    res.render("home")
})

app.get("/signup",(req,res)=>{
    const errorMessage = req.session.message ? req.session.message[0] : '';
    res.render("signup", {error: errorMessage})
});

app.get("/login", (req,res)=>{
    res.render("login")
})


app.get("/profile",(req,res)=>{
    if(req.session.user){
        res.render("profile");
    } else{
        res.send("<div>Debes <a href'/login'>inciar sesion</a> o <a href='/signup'>registrarte</a></div>")
    }
});

//let users = [];

//rutas de autenticacion

app.post("/signup",passport.authenticate('signupStrategy',{
    failureRedirect:"/signup",
    failureMessage:true
}),(req,res)=>{
    res.redirect("/profile")
})

app.post("/login",passport.authenticate('loginStrategy',{
    failureRedirect: "/login",
    failureMessage:true
}),
(req,res)=>{
    res.redirect("/profile")
})


app.get("/profile",async(req,res)=>{
    if(req.isAuthenticated()){
        let {name} = req.user
        res.render("form",{user:name})
    }else{
        res.send("<div>Debes <a href='/login'>inciar sesion</a> o <a href='/signup'>registrarte</a></div>")
    }
})

app.get("/logout",(req,res)=>{
    req.session.destroy()
    setTimeout(()=>{
            res.redirect("/login")
    },3000)
})


