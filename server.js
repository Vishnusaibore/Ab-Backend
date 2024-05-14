require('dotenv').config()
const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const cors = require("cors")
const bcrypt = require("bcrypt")
const app= express()
const Port=process.env.PORT
const saltRounds=process.env.SALT_ROUNDS //For bcrypt hashing
const jwt = require('jsonwebtoken') // Install 'jsonwebtoken' package
const secretKey = process.env.SECRET_KEY
const MongoDB_Atlas_URL= process.env.MONGODB_URL
const MongoDB_LocalURL=process.env.MONGODB_LOCAL_URL
app.use(bodyParser.json())
app.use(express.json())
app.use(cors())
//Database Connection
main().catch(err=>console.log(err))
async function main(){
    await mongoose.connect(MongoDB_LocalURL)
    
    //UserSchema
    const userSchema = new mongoose.Schema({
        firstName:String,
        lastName:String,
        email:String,
        password:String
    })
    const User= mongoose.model("User",userSchema)
    //User Registration
    app.post("/api/register",async(req,res)=>{
        let fName = req.body.firstNamers
        let lName = req.body.lastName
        let Username=req.body.email
        let Password =req.body.password
        let hashedPassword = await bcrypt.hash(Password,saltRounds)
        try {
            User.find({email:Username}).then(results=>{
                if(results.length===0)
                {
                    const user = new User({
                       firstName:fName,
                       lastName:lName,
                       email:Username,
                       password:hashedPassword
                    })
                    user.save()
                    res.json({stat:true,message:"User Registration Success"})
                }
                else
                {
                    res.json({stat:false,message:"Account Alredy Exists"})
                }
            })  
          } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Internal Server Error' });
          }
    })

    //user details fetching
    app.get("/api/users",async(req,res)=>{
        try{
            User.find().then(results=>{
                res.json(results)
            })
        }catch(err){
            console.log(err)
            res.status(500).json({message:"Server Error"})
        }
    })

    //User Login
    app.post("/api/login",async(req,res)=>{
    var userName = req.body.email
    var userPassword = req.body.password
    //here find will try to serach if the user is registerd or not
    User.find({email:userName}).then(resul=>{
        if(resul.length===0)
        {
            res.json({stat:false,message:"User Not Registred"})
        }
        else{
            User.findOne({email:userName}).then(results=>{
                bcrypt.compare(userPassword, results.password).then(isValid=>{
                    if(isValid){
                        // res.json({stat:true,message:"SuccessFully LoggedIn"})
                        const token = jwt.sign({ userId:userName}, secretKey);
                        res.json({token,stat:true,message:"SuccessFully Logged In"})
                    }
                    else{
                        res.json({stat:false,message:"Incorrect Password"})
                    } 
                }).catch(err=>{})   
            }).catch(err=>{})

        }
    })
    //
    })

    //Forgot password-- Password Reset
    app.patch("/api/forgotpassword",async(req,res)=>{
        let mailId = req.body.email
        let newPassword = req.body.password
        let newHashedPassword = await bcrypt.hash(newPassword,saltRounds)
        try{
        User.findOneAndUpdate({email:mailId},{password:newHashedPassword}).then(isUpdated=>{
            let mail=isUpdated.email
            res.json({username:mail,stat:true,message:" Your Password Changed Successfully"})
        }).catch(err=>console(err))
    }catch(err){
        console.log(err)
        res.status(500).json({message:"Server Error"})
    }
    })

    //Define Schema  -->Blog Posts
    const postSchema= new mongoose.Schema({
        name:String,
        blogImage:String,
        content:String
    })
    const Post = mongoose.model("Post",postSchema)

    //POST Route -->Blog Posts
    app.post("/api/posts",async(req,res)=>{
        const{name,blogImage,content}=req.body
        const post=new Post({
            name,blogImage,content
        })

        try{
            await post.save()
            res.json({stat:true,message:"Blog Published SuccessFully"})
        }catch(err){
            console.error(err)
            res.status(500).json({message:"server Error"})
        }
    })

    //GET Route  -->Blog Posts
    app.get("/api/posts",async(req,res)=>{
        try{
            Post.find().then(results=>{
                res.json(results)
            })
        }catch(err){
            console.error(err)
            res.status(500).json({message:"Server Error"})
        }
    })
    
    //getting a single post
    app.get("/api/post/:id",async(req,res)=>{
        try{
            Post.findById(req.params.id).then(result=>{
                res.json(result)
            })
            
        }catch(err){
            res.status(500).json({message:"Server Error"})
        }
    })

    //Delete Route  -->Blog Posts
    app.delete("/api/posts/:id",async(req,res)=>{
        try{
            await Post.findByIdAndDelete(req.params.id)
            res.json({stat:true,message:"Blog Deleted Successfully"})
        }catch(err){
            res.status(500).json({message:"Server Error"})
        }
    })
}
//Server Listening PORT
app.listen(Port,()=>{
    console.log("Server Running SuccessFully on PORT: "+Port)
})