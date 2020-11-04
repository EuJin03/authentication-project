//config() so that it can access environment file
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const port = 3000;
const app = express();

console.log(process.env.API_KEY);

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
userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password']});


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
    const newUser = new User({
      username: req.body.username,
      password: req.body.password
    })
    newUser.save(function (err) {
      if (err) {
        console.log(err);
      } else {
        res.render('secrets');
      }
    })
  });


app.route('/login')
  .get((req, res) => {
    res.render('login')
  })
  .post((req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({username: username}, function(err, foundUser) {
      if (err) {
        console.log(err);
      } if (foundUser) {
        if (foundUser.password === password) {
          res.render('secrets');
        } else {
          console.log(foundUser.password + ' is not equal to ' + password);
        }
      }
    })

  })



app.listen(port, (req, res) => {
  console.log(`Server is running at port ${port}`);
})
