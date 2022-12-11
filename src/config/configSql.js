import mongoose from 'mongoose';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export const options = {
    mariaDb:{
        client:'mysql',
        connection:{
            host: '127.0.0.1',
            user: 'root',
            password:'',
            database:'ecommerce'
        }
    },
    sqlite: {
        client:"sqlite",
        connection:{
            filename:path.join(__dirname, "../DB/chatDB.sqlite")
            
        },
        useNullAsDefault: true
    },
    fileSystem:{
        pathMensajes: path.join(__dirname , "../DB/mensajesChat.txt")
    }

    
    
}