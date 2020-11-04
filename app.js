//config() so that it can access environment file
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
// const md5 = require('md5');
const bcrypt = require('bcrypt');

const port = 3000;
const app = express();
//amount of salt rounds == times the pw got hashed
const saltRounds = 10;

// console.log(process.env.TEST);
// console.log(md5(123456));

mongoose.connect('mongodb://localhost:27017/userDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String
});

// encrypt code before assigning it to mongoose.model(collection)
//key
//encrypt when save(), decrypt when find();
//remove environment variable to .env and replace with process.env
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password']});


const User = mongoose.model('User', userSchema);

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
  extended: true
}));


app.get('/', (req, res) => {
  res.render('home')
})


// routing using REST api logic

app.route('/register')
  .get((req, res) => {
    res.render('register')
  })
  .post((req, res) => {

    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
      const newUser = new User({
        username: req.body.username,
        password: hash
      })
      newUser.save(function (err) {
        if (err) {
          console.log(err);
        } else {
          res.render('secrets');
        }
      })
    })
  });


app.route('/login')
  .get((req, res) => {
    res.render('login')
  })
  .post((req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({
      username: username
    }, function (err, foundUser) {
      if (err) {
        console.log(err);
      }
      if (foundUser) {
        bcrypt.compare(password, foundUser.password, function (err, result) {
          console.log(result);
          if (result === true) {
            res.render('secrets')
          } else {
            res.render('login')
          }
        })
      }
    })

  })



app.listen(port, (req, res) => {
  console.log(`Server is running at port ${port}`);
})