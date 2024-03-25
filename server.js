const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const cors = require("cors")
const app= express()
const Port=5000

app.use(bodyParser.json())
app.use(cors())
//Database Connection
main().catch(err=>console.log(err))
async function main(){
    await mongoose.connect('mongodb://127.0.0.1:27017/blogsiteDB')
    
    //UserSchema
    const userSchema = new mongoose.Schema({
        username:String,
        password:String
    })
    const User= mongoose.model("User",userSchema)

    app.post("/api/users",async(req,res)=>{
        const{username,password}=req.body
        const user = new User({
            username,password
        })
        try{
            await user.save()
            res.json({message:"User Registration Successful"})
        }catch(err){
            console.error(err)
            res.status(500).json({message:"server Error"})
        }
    })

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