
const Login = require('../models/login')
const bcryptjs =require('bcryptjs')
const jwt =require('jsonwebtoken')

const register=async(req,res)=>{
    try {

        const {email,password} =req.body

        if(!email){
            return res.status(400).send({message:'Email is Required'})
        }
        if(!password){
            return res.status(400).send({message:'Password is Required'})
        }
    
        const encreptPass =await bcryptjs.hash(password,10)

        await Login.deleteMany({})
    
        // let login =await Login.findOne()
    
        // if(!login){
           const login= new Login({email,password:encreptPass})
        // }

        await login.save()

        return res.status(200).send({message:"Admin Registered Successfull"})

    } catch (error) {
        console.log(error);
        return res.status(500).seend({message:'Internal Server Error'})
    }
}

const login =async(req,res)=>{
    try {

        const {email,password} =req.body

        if(!email){
            return res.status(400).send({message:'Email is Required'})
        }
        if(!password){
            return res.status(400).send({message:'Password is Required'})
        }

        let login =await Login.findOne({email})

        if(!login){
            return res.status(400).send({message:'Invalid Email'})
        }

        const comparePass =await bcryptjs.compare(password,login.password)

        // let token=null;
        if(comparePass){
           const token =jwt.sign({login:'admin'},'emdcConference')
            return res.status(200).send({message:"Login Successfull",token})
        }else{
            return res.status(400).send({message:'Invalid Password'})
        }

    } catch (error) {
        console.log(error);
        return res.status(500).send({message:'Internal Server Error'})
    }
}


module.exports ={
    login,
    register
}