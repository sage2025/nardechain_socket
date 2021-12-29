const express = require("express");
const router = express.Router();
// const nodemailer = require('nodemailer');
// const { google } = require("googleapis");
// const "OAuthunks"th2 = google.auth.OAuth2;
const User = require("../../models/User");
const userController = require("../../controllers/authController/userController");
router.post("/signup", userController.register);
router.post("/validateRegister", userController.validateRegister);
router.post("/login", userController.login);
router.post("/forgotpassword", userController.forgotpassword);
router.post("/resetpassword", userController.resetpassword);
router.get("/getToken/:email/:token", userController.getToken)
router.get("/data", (req, res) => {
  User.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        count: { $sum: 1}
      }
    }
  ], (err, data) => {
    if(err) {
      console.error(err);
    } else {
      console.log(data);
      res.send(data);
    }
  })
})
// send all users for datatable
router.get("/userdata", (req, res) => {
  User.find().then( user => {
    if(user) {
      console.log(user)
      return res.json({data1: user});
    }
  })
})
// delete user in datatable
router.delete("/userfromid/:userId", (req, res) => {

  User.findByIdAndDelete(req.params.userId).then( user => {
    if(user) {
      console.log(user);
      return res.json({deletedusers: user});
    }
  })
})
router.put("/update", (req, res) => {
  User.findByIdAndUpdate(
    {_id: req.body.id},
    {name: req.body.name,
    email: req.body.email}
  )
  .then( x => {
    if(x) {
      return res.json({res: x});
    }
  })
})
module.exports = router;