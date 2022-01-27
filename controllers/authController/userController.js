const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login")
const validateResetInput = require("../../validation/resetpassword")
const bcrypt = require("bcryptjs");
const User = require("../../models/User");
const Resetpassword = require("../../models/Resetpassword");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
var nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');

const master_email = 'support@social-media-builder.com';
const master_password = '1234567890Aa@';
var transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 587,
  secure : false,
  auth: {
      user: `${master_email}`,
      pass: `${master_password}`
  }
});


exports.register = function(req, res) {
    // const { errors, isValid } = validateRegisterInput(req.body);
    // if (!isValid) { 
    //   return res.json({errors : errors});
    // }
    // var validateCode = Math.floor(100000 + Math.random() * 900000);
    // keys.validateCode = validateCode;
    // var mailOptions = {
    //   from: `${master_email}`,
    //   to: req.body.email,
    //   subject: 'Support',
    //   text: "Welcome to nardechain.io. In order to validate your email please copy this validate code "+validateCode+" Hope to have a fun!"
    // }

    // transporter.sendMail( mailOptions, function(err, info) {
    //   if(err) {
    //     res.json({ msg: "Email not sent" });
    //   } else {
    //     res.json({ msg: "Email sent" })
    //   }
    // } )
    User.findOne({ account: req.body.account })
      .then(user => {
        // user.membership = req.body.membership;
        user.username = req.body.username;
        user.name = req.body.name;
        user.birth = req.body.birth;
        // user.email = req.body.email;
        user.gender = req.body.gender;
        user.state = req.body.state;
        user.avatar = req.body.avatar;
        // user.code = req.body.code;
        user.save();
      })
      .catch(() => {
        const newUser = new User({
          account: req.body.account,
          // membership: req.body.membership,
          username: req.body.username,
          name: req.body.name,
          birth: req.body.birth,
          // email: req.body.email,
          gender: req.body.gender,
          state: req.body.state,
          avatar: req.body.avatar
          // code: req.body.code,
        })
        newUser.save();
      })
    res.json({ msg: "success"});
}

exports.validateRegister = function(req, res) {
  if(req.body.validateCode !== keys.validateCode) {
    res.json({ msg:"Wrong validate code" })
  } else {
    User.findOne({ email: req.body.email }).then(user => {
      if (user) {
        res.json({ msg: "Email already exists. Please try with other email" });
      } else {
        const newUser = new User({
          name: req.body.name,
          email: req.body.email,
          password: req.body.password
        });
        
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => res.json(user))
              .catch(err => console.log(err));
          });
        });
        res.json({ msg: "Successful register" })

      }
    });    
  }
}

exports.login = function(req, res) {
    const { errors, isValid } = validateLoginInput(req.body);
    
    if (!isValid) {
      return res.status(400).json(errors);
    }
    const email = req.body.email;
    const password = req.body.password;

    User.findOne({ email:email }).then(user => {

      if (!user) {
        return res.status(404).json({ Emailnotfound: "Email not found" });
      }
      
      bcrypt.compare(password, user.password).then(isMatch => {
        if (isMatch) {
          const payload = {
            id: user.id,
            name: user.name
          };
          jwt.sign(
            payload,
            keys.secretOrKey,
            {
              expiresIn: 12000 
            },
            (err, token) => {
              res.json({
                success: true,
                name:user.name,
                email:user.email,
                date:user.date,
                password:user.password,
                token: "Bearer " + token,
              });
            }
          );
          const data = {
            username: user.name,
            email: user.email,
            password: user.password
          };
          req.session.data = data; 
        } else {
          return res
            .status(400)
            .json({ passwordincorrect: "Password incorrect" });
        }
      });
    });
} 

exports.forgotpassword = function(req, res) {
  const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if(!emailRegexp.test(req.body.email)) {
    res.json({ msg: "Email is invalid" })
  } else{
    const payload = { email: req.body.email }
    const token = jwt.sign(payload, keys.secretOrKey);
    var mailOptions = {
      from: `${master_email}`,
      to: req.body.email,
      subject: 'Support',
      text: 'We have noticed that you have forgotten your password. You can redirect here.   http://localhost:3000/#/resetpassword/' + req.body.email + "/" + token + "   There you can reset your own password." 
    };
  
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        res.json({ msg: "Email not sent" });
        // console.log("email not sent");
  
      } else {
        res.json({ msg: "Email sent" })
      }
    });
    Resetpassword.findOne({ email: req.body.email }).then(reset => {
      if(reset) {
        const updatereset = {$set: {email: req.body.email, token: token}}
        Resetpassword.updateOne({email: req.body.email}, updatereset);
      } else {
        const newreset = new Resetpassword({ 
          email: req.body.email,
          token: token
        })
        newreset.save();
      }
    })
    res.json({ msg: "success" })
  }
}

exports.resetpassword = function(req, res) {
  const { errors, isValid } = validateResetInput(req.body);
  if( !isValid ) {
    res.json( { errors: errors } )
  } else {
    User.findOne({ email: req.body.email }).then(user => {
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(req.body.password, salt, (err, hash) => {
          if(err) throw err;
          user.password = hash;
          user.save();
        });
      });
    });
    res.json({ msg: "success" })
  }
}

exports.getToken = function(req, res) {
  Resetpassword.findOne({ email: req.params.email }).then(user => {
    if(user) {
      if(req.params.token === user.token)
        res.json({ msg: "success" });
      else
        res.json({msg: "invalid token"});
    } else {
      res.json({ msg: "No existing User" });
    }
  })
}