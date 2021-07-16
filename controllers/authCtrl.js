const Users = require('../models/userModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')


const authCtrl = {
    register: async (req, res) =>{
        try {
            const{fullname, username, email, password, gender} = req.body

           
            
            let newUserName = username.toLowerCase().replace(/ /g, '')
            console.log(newUserName)
            
            const user_name = await Users.findOne({username: newUserName})
            if(user_name) return res.status(404).json({msg: "this user name already exists"})

            const user_email = await Users.findOne({email})

            if(user_email) return res.status(404).json({msg: "this user name already exists"})

            if(password.lenght < 6)
            return res.status(400).json({msg: "password must be at least 6"}
            )

            const passwordHash = await bcrypt.hash(password, 12)

            const newUser = new Users({
                fullname, username: newUserName, email, password: passwordHash, gender
            })
 
          
            const access_token = createAccessToken({id: newUser._id})
            const refresh_token = createRefreshToken({id: newUser._id})
            
            res.cookie('refreshtoken', refresh_token, {
                httpOnly: true,
                path: '/api/refresh_token',
                maxAge: 30*24*60*60*1000 // 30 days
            })

            await newUser.save()


            res.json({
                msg: "reggister sucess!",
                access_token,
                user: {
                    ...newUser._doc,
                    password: ''
                }
            })



        } catch (error) {
            return res.status(500).json({msg: error.message})
            
        }
    },
    login: async (req, res) => {
        try {
            const { email, password} = req.body

            const user = await Users.findOne({email})
            .populate("followers following", "-password")

            if(!user) return res.status(400).json({msg: "This email does not exist."})

            const isMatch = await bcrypt.compare(password, user.password)
            if(!isMatch) return res.status(400).json({msg: "Password is incorrect."})

            const access_token = createAccessToken({id: user._id})
            const refresh_token = createRefreshToken({id: user._id})
            
            res.cookie('refreshtoken', refresh_token, {
                httpOnly: true,
                path: '/api/refresh_token',
                maxAge: 30*24*60*60*1000 // 30 days
            })
            

            
            res.json({
                msg: "Login Sucess!",
                access_token,
                user: {
                    ...user._doc,
                    password: ''
                }
            })

            
        } catch (error) {
            return res.status(500).json({msg: error.message})
            
        }
    },
    logout: async (req, res) => {
        try {
            res.clearCookie('refreshtoken', { path: '/api/refresh_token'})
            return res.json({msg: "Logged out!"})
            
        } catch (error) {
            return res.status(500).json({msg: error.message})
            
            
        }
    },
    generateAccessToken: async (req, res) => {
        try {
            const rf_token = req.cookies.refreshtoken
            if(!rf_token) return res.status(400).json({msg:"Please login now"})

            jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, async(err, result) => {
                if(err) return res.status(400).json({msg:"Please login now"})
            

                const user = await Users.findById(result.id).select("-password")
                .populate('followers following', '-password')

                if(!user) return res.status(400).json({msg:"This does not exists."})

                const access_token = createAccessToken({id: result.id})

                res.json({
                    access_token,
                    user
                })
            })
          
            
        } catch (error) {
            return res.status(500).json({msg: error.message})
            
        }
    }
}

const createAccessToken = (payload) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1d'} )

}

const createRefreshToken = (payload) =>{
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '30d'} )

}

module.exports = authCtrl