import mongoose, { mongo } from 'mongoose'

const productosCollection = "productos"
const carritosCollection = "carritos"

const productosSchema = new mongoose.Schema({
    nombre:String,
    precio:Number,
    timestamp:Number,
    stock:Number,
    url:String
})

const carritosSchema = new mongoose.Schema({
    timestamp:Number,
    productos:[{
        id:Number,
        nombre:String,
        precio:Number,
        cantidad:Number,
        url:String
    }]
})

export {productosSchema,productosCollection,carritosSchema,carritosCollection}