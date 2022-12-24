import * as dotenv from "dotenv";
import parsedArgs from "minimist";

dotenv.config();

// Llama librería minimist y definir variables defaul
const options = {default: {puerto:8081, modo: "fork"}}

const objArguments = parsedArgs(process.argv.slice(2), options)

//creamos la configuracion de nuestra aplicacion

export const config = {
    MODO: objArguments.modo,
    PORT: objArguments.puerto,
    MARIADB_HOST: process.env.MARIADB_HOST,
    SQLITE_DB: process.env.SQLITE_DB,
    FILE_DB: process.env.FILE_DB,
    MONGO_AUTENTICATION:process.env.MONGO_AUTENTICATION,
    MONGO_SESSION:process.env.MONGO_SESSION
};