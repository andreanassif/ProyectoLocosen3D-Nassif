import mongoose from 'mongoose'

const usersCollection = 'users'

//mongoose.set('strictQuery', true)
mongoose.set('strictQuery', false);

const userSchema = new mongoose.Schema({
    name:String,
    username:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    }
})

export const UserModel = mongoose.model(usersCollection,userSchema)