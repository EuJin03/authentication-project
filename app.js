//config() so that it can access environment file
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook')
const findOrCreate = require('mongoose-findorcreate');
// const encrypt = require('mongoose-encryption');
// const md5 = require('md5');
// const bcrypt = require('bcrypt');

const port = 3000;
const app = express();
// amount of salt rounds == times the pw got hashed
const saltRounds = 10;

// console.log(process.env.TEST);
// console.log(md5(123456));

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
  extended: true
}));

//session & cookies
app.use(session({
  secret: "tosesce5259",
  resave: false,
  saveUninitialized: false
}))

//passport js
//authenticate
app.use(passport.initialize());
//use session in passport
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  googleId: String,
  facebookId: String,
  secret: String
});

// encrypt userSchema before assigning it to mongoose.model(collection)
//key
//encrypt when save(), decrypt when find();
//remove environment variable to .env and replace with process.env
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password']});

//passport local mongoose
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model('User', userSchema);

//create strategy for User
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

//google oauth initialize
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function (accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({
      googleId: profile.id
    }, function (err, user) {
      return cb(err, user);
    });
  }
));

//facebook oauth initialize
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_ID,
  clientSecret: process.env.FACEBOOK_SECRET,
  callbackURL: "http://localhost:3000/auth/facebook/secrets"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ facebookId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));


app.get('/', (req, res) => {
  res.render('home')
})

//oauth google route
app.get('/auth/google',
  passport.authenticate('google', {
    scope: ["profile"]
  }));

app.get('/auth/google/secrets',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

//oauth facebook route
app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

// routing using REST api logic

app.route('/register')
  .get((req, res) => {
    res.render('register')
  })
  .post((req, res) => {

    User.register({
      username: req.body.username
    }, req.body.password, function (err, user) {
      if (err) {
        console.log(err);
        res.redirect('/register');
      } else {
        passport.authenticate('local')(req, res, function () {
          res.redirect('/secrets')
        })
      }
    })

  });


app.route('/login')
  .get((req, res) => {
    res.render('login')
  })
  .post((req, res) => {

    const user = new User({
      username: req.body.username,
      password: req.body.password
    })
    //method from passport
    req.login(user, function (err) {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate('local')(req, res, function () {
          res.redirect('/secrets')
        })
      }
    })
  });

app.get('/secrets', function (req, res) {
  User.find({"secret": {$ne: null}}, function(err, foundUsers){
    if(err){
      console.log(err);
    } else {
      if (foundUsers) {
        res.render('secrets', {usersWithSecrets: foundUsers});
      }
    }
  })
})

app.get('/submit', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('submit');
  } else {
    res.redirect('/login')
  }
})

app.post('/submit', (req, res) => {
  const submittedSecret = req.body.secret;

  console.log(req.user.id);

  User.findById(req.user.id, function(err, foundUser){
    if(err){
      console.log(err);
    } else {
      if (foundUser)
        foundUser.secret = submittedSecret;
        foundUser.save(function(){
          res.redirect('/secrets')
        });
        console.log(foundUser.secret);
    }
  });
})

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
})



app.listen(port, (req, res) => {
  console.log(`Server is running at port ${port}`);
})