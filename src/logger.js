import log4js from "log4js";
import { envConfig } from "./envConfig.js";

log4js.configure({
    appenders: {
        //definimos la salida de datos (terminal, achivo, base de datos, email, etc)
        consola: {type: "console"},
        archivoErrores: {type: "file", filename: "./src/logs/errores.log" },
        archivoWarning: {type: "file", filename: "./src/logs/warn.log" },
        //salidas con niveles definidos
        loggerConsola: {type: "logLevelFilter", appenders: 'consola', level: 'info'},
        loggerErrores: {type: "logLevelFilter", appender: 'archivoErrores', level: 'error'},
        loggerWarning: {type: "logLevelFilter", appender: 'archivoWarning', level: 'warn'},
      },
      categories: {
        default: {appenders: ['loggerConsola'], level: 'all'},
        produccion: {appenders: ['loggerErrores', 'loggerWarning'], level: 'all'},
      }
     
})

const logger = null;

if(envConfig.NODE_ENV === "prod"){
    logger = log4js.getLogger("produccion")
}else{
    logger = log4js.getLogger()
};

export {logger}

