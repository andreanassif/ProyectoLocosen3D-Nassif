import express, { application } from 'express'
import { productosTest } from '../test/testFaker.js'
import ContendorMariaDb from '../managers/mariaDB.js'
import ContenedorSqlite from '../managers/sqlite.js'
import  {contenedorMsj} from '../managers/contenedorMsj.js'
import { options } from '../config/configSql.js'
import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import bcrypt from 'bcrypt'
import session, { Cookie } from 'express-session'
import { UserModel } from '../models/user.js'
import os from "os"
import {config} from '../config/config.js'




const router = express.Router()
const productos = new ContendorMariaDb(options.mariaDb,'productos')
//const mensajes = new ContenedorSqlite(options.sqlite,'mensajes')
const mensajes = new contenedorMsj(options.fileSystem.pathMensajes)


let argumentosEntrada = process.argv
let pathEjecucion = process.execPath
let sistemaOperativo = process.platform
let processId = process.pid
let nodeVersion = process.version
let carpetaProyecto = process.cwd()
let usoMemoria = process.memoryUsage();
export let numeroCPUs = os.cpus().length
const PORT = config.PORT


router.get('/', async(req,res)=>{
    res.render("/home")
    
})

router.get('/productos', async (req,res)=>{
    const data = await productos.getAll()
    console.log(data);
    res.send(data)
})

router.get('/productos/:id', async (req,res)=>{
    const {id} = req.params
    const producto = await productos.getById(id)

    if(producto){
        res.send(producto)
    }else{
        return res.json({
            message:"el producto no existe"
        })
    }
})

router.post('/productos', async (req,res)=>{
    
    const newProd = (req.body)
    await productos.save(newProd)
    const data = await productos.getAll()
    
    res.send(data)

})

router.put('/productos/:id', async(req,res) =>{
    const {id} = req.params
    const modificacion = req.body
    
    const existe = await productos.getById(id)
        
        if (!existe){
            return res.status(404).send({ message: 'Error el producto no existe' })
        } else{
            const prod = await productos.putById(id,modificacion)
            return res.send(prod)
        }
    
})

router.delete('/productos/:id', async(req,res)=>{
    const {id} = req.params

    
        const existe = await productos.getById(id)
        
        if (!existe){
            return res.status(404).send({ message: 'Error el producto no existe' })
        } else{
            const prod = productos.deleteById(id)
        res.send(prod)
        }
    
    
})

// rutas del chat
router.get('/chat', async(req,res)=>{
    const data = await mensajes.getAll()
    res.render('chat',{data})
})

router.post('/chat', async (req,res)=>{
    const newMsj = (req.body)
    const msj = await mensajes.save(newMsj)
    res.send(msj)

})

//ruta de testeo con faker

router.get('/productos-test', async(req,res)=>{
    res.send(productosTest)
})

//desafio 14 
router.get('/info', async(req,res)=>{
    
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

router.get('/random', async(req,res)=>{
    
    res.send()



})




export default router