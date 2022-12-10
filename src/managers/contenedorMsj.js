import fs, { fdatasync } from "fs"
import path from "path"
import url from "url"

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export class contenedorMsj {
    constructor (filename){
        this.filename = path.join(__dirname,"..",`/files/${filename}`)
    }
    
    async getAll(){
        try{
            const data = await this.readData(this.data)
            return data
        } catch(err){
            console.log(err);
        }
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
}  }    