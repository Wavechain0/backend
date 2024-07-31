const express = require('express')
const app = express()
const PORT = 4000

const database = require('./database')
const Relations = require('./model/Relations')
const User = require('./model/User')
Relations()
database.sync()

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Product = require('./model/Product')
const SECRET = '1234@secret'
const { formidable } = require('formidable')

const cors = require('cors')
app.use(cors())
const fs = require('fs')
const path = require('path')
const { title } = require('process')


app.use(express.json())
app.use(express.urlencoded())

app.post('/register', async (req, res) =>{
    const {first_name, last_name, username, password } = req.body
    if(password.length < 6) return res.json({success: false, message: "password length is less than 6"})
    let hashed = bcrypt.hashSync(password, 10)
    await User.create({first_name, last_name, username, password: hashed})
    res.json({success: true})
})

app.post('/login', async (req, res) =>{
    const {username, password} = req.body
    const user = await User.findOne({where: {username}})
    console.log("login", user, username)
    if(!user) return res.json({success:false, message:'incorrect username or password'})
    if(bcrypt.compareSync(password, user.password)){
        let date = new Date()
        let token = jwt.sign( {id: user.id}, SECRET, {expiresIn: "1d"})
        res.json({success:true, token})
    }
   else return res.json({success:false, message:'incorrect username or password'})
})


// mon july 15 
app.get('/all-product', async (req, res) => {
    let products = await Product.findAll({ where: {sold: false} })
    res.json({ products })
})


app.use(async (req, res , next)=>{
    let header = req.headers['authorization']
    if(!header) return res.sendStatus(403)
    let token = header.split(' ')[1]
    if(!token) return res.sendStatus(403)
    try{
       let data = jwt.verify(token, SECRET)
       req.id = data.id
       next()
    }catch(e){
    return res.sendStatus(403)
    }

})

app.delete('/delete-product', async(req, res) =>{
    const { id } = req.body
    let product = await Product.findByPk(id)
    if(!product) return res.json({success:false, message:"not found"})
    console.log(product, id)
    if(product.userid !=req.id) return res.json({success:false, message:"user doesn't mach"})
    await product.destroy()
    res.json({ success:true })
})

app.post('/mark-as-sold', async(req, res) =>{
    const {id} =req.body
    let product = await Product.findByPk(id)
    if(!product) return res.json({success:false})
    product.sold = true
    await product.save()
    res.json({ success:true })
})

app.post('/add-product', async (req, res) =>{
    let form = formidable({uploadDir: './uploads'})
    form.parse(req, async(err , fields , files) => {
        console.log(fields, files)
        const image = files.image[0]
        const ext = image.mimetype.split('/')[1]
        fs.renameSync(image.filepath, image.filepath + '.' + ext)
        await Product.create({
            userid: req.id,
            title: fields.title[0],
            price: fields.price[0],
            company: fields.company[0],
            description: fields.description[0],
            image: '/uploads/' + image.newFilename + '.' + ext
        })
        res.json({success: true})
    })
   
})

// mon july 15 
app.get('/my-product', async (req, res) =>{
    let products = await Product.findAll({where: {userid: req.id}})
    res.json({ products })
})

app.patch('/update-product', async (req, res) => {
    const {id, title, price, company, description} = req.body
    // get the product
    let product = await Product.findByPk(id)
    // if the product does not exist end with false
    if(!product) return res.json({success:false})
    // edit every field
    product.title = title
    product.price = price
    product.company = company
    product.description = description
    // savethe change
    await product.save()
    res.json({success: true})

})




app.listen(PORT, () => console.log('service is running...'))
