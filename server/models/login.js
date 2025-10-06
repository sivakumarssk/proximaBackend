
const mongoose =require('mongoose')

const LoginSchema = new mongoose.Schema({
    email:{
        type:String
    },
    password:{
        type:String
    }
})

module.exports = mongoose.model('Login',LoginSchema)