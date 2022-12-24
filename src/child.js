import { random } from "./managers/operations.js";

process.on("message",(msj)=>{
    const {cantidad, obj}= msj
    const resultadoNumeros = random(cantidad,obj)
        
    process.send(resultadoNumeros);
})