import fs, { fdatasync } from "fs"
import path from "path"
import url from "url"

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export class contenedorMsj {
    constructor (filename){
        this.filename = path.join(__dirname,"..",`/files/${filename}`)
    }
    
    async save(obj){
        try{
            if(fs.existsSync(this.filename)){
                const messages = await this.getAll();
                if(messages.length>0){
                    const newId = messages[messages.length-1].id + 1;
                    const newMsj = {
                        id: newId,
                        ...obj,
                    };
                    messages.push(newMsj);
                    console.log("messages", messages)
                    await fs.promises.writeFile(this.filename, JSON.stringify(messages,null,2));

                } else {
                    const newMsj = {
                        id: 1,
                        ...obj,
                    };
                    await fs.promises.writeFile(this.filename,JSON.stringify([newMsj],null,2));
                }
            } else {
                const newMsj = {
                    id:1,
                    ...obj
                }
                await fs.promises.writeFile(this.filename,JSON.stringify([newMsj],null,2));

            }
        

    } catch (error) {
        return "no se pudo guardar el mensaje"
    } 
}  

    async getAll(){
        try{
            if(fs.existsSync(this.filename)){
                const contenido = await fs.promises.readFile(this.filename, "utf-8");
                if(contenido){
                    const messagesHistory = JSON.parse(contenido);
                    return messagesHistory;
                } else{
                    await fs.promises.writeFile(this.filename, JSON.stringify([]));
                    return [];
                }
            } else{
                await fs.promises.writeFile(this.filename, JSON.stringify([]));
                return [];
            }
        } catch(err){
            return "El archivo no existe";
        }
    }
}    