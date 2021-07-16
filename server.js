require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const cors = require('cors')


const app = express()

app.use(express.json())
app.use(cors())
app.use(cookieParser())

//Routers
app.use('/api', require('./routes/authRouter'))

app.get('/', (req, res) => {
    res.json({msg: "hiii"})
})

const URI = process.env.MONGODB_URL
mongoose.connect(URI, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology:true,

}, err =>{
    if(err) throw err;
    console.log('connected to mongodb')
})

const port = process.env.PORT || 5000
app.listen(port, ()=> {
    console.log('server is running on port', port)
})