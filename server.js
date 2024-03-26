const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const cors = require("cors")
const bcrypt = require("bcrypt")
const app= express()
const Port=5000
const saltRounds=10 //For bcrypt hashing

app.use(bodyParser.json())
app.use(cors())
//Database Connectioni
main().catch(err=>console.log(err))
async function main(){
    await mongoose.connect('mongodb://127.0.0.1:27017/blogsiteDB')
    
    //UserSchema
    const userSchema = new mongoose.Schema({
        username:String,
        password:String
    })
    const User= mongoose.model("User",userSchema)
    //User Registration
    app.post("/api/register",async(req,res)=>{
        let Username=req.body.username
        let Password =(req.body.password)
        let hashedPassword = await bcrypt.hash(Password,saltRounds)
        try {
            User.find({username:Username}).then(results=>{
                if(results.length===0)
                {
                    const user = new User({
                        username:Username,
                        password:hashedPassword
                    })
                    user.save()
                    res.json({stat:true,message:"User Registration Success"})
                }
                else
                {
                    res.json({stat:false,message:"User Alredy Registerd"})
                }
            })  
          } catch (error) {
            console.error(error);
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
            console.error(err)
            res.status(500).json({message:"Server Error"})
        }
    })

    //User Login
    app.post("/api/login",async(req,res)=>{
    var userName = req.body.username
    var userPassword = req.body.password
    //here find will try to serach if the user is registerd or not
    User.find({username:userName}).then(resul=>{
        if(resul.length===0)
        {
            res.json({stat:false,message:"User Not Registred"})
        }
        else{
            User.findOne({username:userName}).then(results=>{
                bcrypt.compare(userPassword, results.password).then(isValid=>{
                    if(isValid){
                        res.json({stat:true,message:"SuccessFully LoggedIn"})
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

    //Define Schema  -->Blog Posts
    const postSchema= new mongoose.Schema({
        name:String,
        content:String
    })
    const Post = mongoose.model("Post",postSchema)

    //POST Route -->Blog Posts
    app.post("/api/posts",async(req,res)=>{
        const{name,content}=req.body
        const post=new Post({
            name,content
        })

        try{
            await post.save()
            res.json(post)
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

    //Delete Route  -->Blog Posts
    app.delete("/api/posts/:id",async(req,res)=>{
        try{
            await Post.findByIdAndDelete(req.params.id)
            res.json({message:"Note Deleted Successfully"})
        }catch(err){
            res.status(500).json({message:"Server Error"})
        }
    })
}
//Server Listening PORT
app.listen(Port,()=>{
    console.log("Server Running SuccessFully on PORT: "+Port)
})