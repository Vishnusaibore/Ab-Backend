require('dotenv').config()
const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const cors = require("cors")
const bcrypt = require("bcrypt")
const nodemailer = require('nodemailer')
const app= express()
const Port=process.env.PORT
const saltRounds=10 //For bcrypt hashing
const jwt = require('jsonwebtoken') // Install 'jsonwebtoken' package
const secretKey = process.env.SECRET_KEY
const MongoDB_AtlasURL= process.env.MONGODB_URI
const MongoDB_LocalURL=process.env.MONGODB_LOCAL_URL
app.use(bodyParser.json())
app.use(express.json())
app.use(cors())

//Database Connection
main().catch(err=>console.log(err))
async function main(){
    await mongoose.connect(MongoDB_AtlasURL)
    
    //UserSchema
    const userSchema = new mongoose.Schema({
        firstName:String,
        lastName:String,
        email:String,
        password:String
    })
    const User= mongoose.model("User",userSchema)

    // Configure Nodemailer transporter
    const App_password = process.env.APP_PASSWORD
    const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'bsai42358@gmail.com', // replace with your email
      pass: App_password   // replace with your generated App Password
    }
    })
    //User Registration
    app.post("/api/register",async(req,res)=>{
        let fName = req.body.firstName
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

                    // Send registration email
                    const mailOptions = {
                        from: 'bsai42358@gmail.com',
                        to: Username,
                        subject: 'Anime Blogger Registration Successful 🎉',
                        html: `
                          <h2>Welcome To Anime Blogger 🎆</h2>
                          <h4>Hello ${fName},</h4>
                          <p>We are absolutely thrilled to have you as part of our community! Thank you for registering on our blog site.</p>
                          <p>Here's what you can look forward to:</p>
                    <ul>
                    <li>📚 Engaging and insightful blog posts</li>
                    <li>🌟 Exclusive content and updates</li>
                    <li>🗨️ Community discussions and comments</li>
                    </ul>
                          <p>We hope you enjoy your time here and find the content enriching and enjoyable. If you have any questions or need assistance, feel free to reach out to us at any time.</p>
                        
                          <p>Thank You 🤩<br>Best regards 🙌<br>Anime Blogger Team 💥</p>
                          <img src="https://img.freepik.com/free-photo/mythical-dragon-beast-anime-style_23-2151112842.jpg?t=st=1716664493~exp=1716668093~hmac=b34d930aea7f09a69bcb7e9915ea6038c25e075869ee3735cd762e878f1aa7f5&w=500" height="110"alt="App Logo" />
                        <footer>
                        <p>If you did not register for this site, please ignore this email.</p>
                        <p>© 2024 Anime Blogger Hyderabad, Telangana 505526</p> </footer>
                        `
                      };

                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                          return console.log(error);
                        }
                      });
                    res.json({stat:true,message:"Welcome To Anime Blogger. Registration Successful"})
                }
                else
                {
                    res.json({stat:false,message:"Account Alredy Exists!. Please SignIn"})
                }
            })  
          } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Internal Server Error' });
          }
    })

    //Fetch User Data
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
            res.json({stat:false,message:"User Not Registred! Please Sign Up"})
        }
        else{
            User.findOne({email:userName}).then(results=>{
                bcrypt.compare(userPassword, results.password).then(isValid=>{
                    if(isValid){
                        // res.json({stat:true,message:"SuccessFully LoggedIn"})
                        const token = jwt.sign({ userId:userName}, secretKey);
                        res.json({token,User:userName,stat:true,message:"SuccessFully Logged In"})
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

        //Sending Password Reset Mail
        const mailOptions = {
            from: 'bsai42358@gmail.com',
            to: mailId,
            subject: 'Anime Blogger!Password Reset Successful 🎉',
            html: `
              <h4>Hello ${mailId}</h4>
              <p> Your Anime Blogger Account Password Changed SuccessFully ☑ <br>
              SignIn to Your Account With New Credentials </p>
              <p>Hope You doing Well 🤩</p>
              <p>Thank You 😊<br>Best regards 🙌<br>Anime Blogger Team 💥</p>
              <img src="https://img.freepik.com/free-photo/mythical-dragon-beast-anime-style_23-2151112842.jpg?t=st=1716664493~exp=1716668093~hmac=b34d930aea7f09a69bcb7e9915ea6038c25e075869ee3735cd762e878f1aa7f5&w=500" height="110"alt="App Logo" />
              <footer>
              <h5>‼ If this was you, you don’t need to do anything. If not, we’ll help you secure your account.</h5>
              <p>© 2024 Anime Blogger Hyderabad, Telangana 505526</p> </footer>
            `
          };
        //
        
        try{
        User.findOneAndUpdate({email:mailId},{password:newHashedPassword}).then(isUpdated=>{
            let mail=isUpdated.email
            transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
            return console.log(error);
            }
            res.json({username:mail,stat:true,message:" Your Password Changed Successfully"})
            });

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
        const LoggedUser = req.headers['header-1']

        // Mail Options for Congratulations Message
        const mailOptions = {
            from: 'bsai42358@gmail.com',
            to: LoggedUser,
            subject: 'Anime Blogger!Congratulations on Your New Post! 🌟',
            html: `
              <h2>Congratulations on Your New Post! 🎆</h2>
              <h4>Hello ${LoggedUser},</h4>
              <p>We are thrilled to see your new post on Anime Blogger.Your contributions are what make our community vibrant and engaging.</p>
              <p>Here are a few things you can do to maximize the impact of your post:</p>
            <ul>
                <li>📣 Share it on social media to reach a wider audience</li>
                <li>💬 Engage with readers by responding to comments</li>
                <li>🔗 Link to related posts to provide more value</li>
                <li>🌟 Update your post with new information as it becomes available</li>
            </ul>
            <p>Thank you for your valuable contribution! We look forward to seeing more of your insightful posts and engaging content.</p>
            <p>If you have any questions or need assistance, feel free to reach out to us at any time.</p>
            <p>Happy blogging 🥳</p>
            <p>Best regards 🙌<br>Anime Blogger Team 💥</p>
            <img src="https://img.freepik.com/free-photo/mythical-dragon-beast-anime-style_23-2151112842.jpg?t=st=1716664493~exp=1716668093~hmac=b34d930aea7f09a69bcb7e9915ea6038c25e075869ee3735cd762e878f1aa7f5&w=500" height="110"alt="App Logo" />
            <footer>
            <p>If you did not write this post, please contact us immediately.</p>
            <p>© 2024 Anime Blogger Hyderabad, Telangana 505526</p> </footer>
            `
          };

        //
        const post=new Post({
            name,blogImage,content
        })
        try{
            await post.save()
            //Sending Mail
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                return console.log(error);
                }
                res.json({stat:true,message:"Blog Published SuccessFully"})
                });

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
    
    //GET--> single post
    app.get("/api/post/:id",async(req,res)=>{
        try{
            Post.findById(req.params.id).then(result=>{
                res.json(result)
            })
            
        }catch(err){
            res.status(500).json({message:"Server Error"})
        }
    })
    
    //Patch Route -->BlogPosts
    app.patch("/api/edit-post/:id",async(req,res)=>{
        let Pid=req.params.id
        let PName=req.body.name
        let imgURL=req.body.blogImage
        let PContent=req.body.content
        try{
            if((PName==="")&&(imgURL==="")){
                Post.findOneAndUpdate({_id:Pid},{content:PContent}).then(r=>{
                    res.json({message:"Blog Content Updated"})
                }).catch(err=>console(err))

            }else if((PName==="")&&(PContent===""))
                {
                Post.findOneAndUpdate({_id:Pid},{blogImage:imgURL}).then(re=>{
                    res.json({message:"Blog Image Updated"})
                }).catch(err=>console(err))

            }else if((imgURL==="")&&(PContent==="")){
                Post.findOneAndUpdate({_id:Pid},{name:PName}).then(re=>{
                    res.json({message:"Blog Post Name Updated"})
                }).catch(err=>console(err))
            }
            else{
                Post.findOneAndUpdate({_id:Pid},{name:PName,blogImage:imgURL,content:PContent}).then(reslt=>{
                    res.json({message:"Blog Updated SuccessFully"})
                    }
                ).catch(err=>console(err))
            }
        }catch(err){
            console.error(err)
            res.status(500).json({message:"Server Error"})
        }
    })


    //Delete Route  -->Blog Posts
    app.delete("/api/delete-post/:id",async(req,res)=>{
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