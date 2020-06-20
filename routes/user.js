const router = require('express').Router();
const sha256 = require('sha256');
const nodemailer = require("nodemailer");
var otpGenerator = require('otp-generator');
let User = require('../models/user.model');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'mindwebsmailer@gmail.com',
        pass: 'berskfmihfomvowk'
    }
});

router.route('/').get((req,res) => {
    User.find()
        .then(users => res.json(users))
        .catch(err => res.status(400).json('Error:' + err));
});

router.route('/login').post((req,res) => {
    const email = req.body.email;
    const password = req.body.password;
    const time = new Date();
    User.find({email: email, password: password})
        .then(users => {
            if(!users.length){
                res.status(206).json({"message":'Failure'});
            }
            else{
                users[0].sessionToken = sha256(email + time.toString());
                users[0].save()
                    .then(() => 
                    res.json(
                        {
                            "message":'Success',
                            "token": sha256(email + time.toString())
                        }
                        )
                    )
                    .catch(err => res.status(400).json('Error:' + err));    
            }
        })
        .catch(err => res.status(400).json('Error:' + err));
});

router.route('/get_session').post((req,res) => {
    const token = req.body.token;
    User.find({ sessionToken: token })
        .then(user => {
            // console.log(user);
            if(user.length === 0){
                res.status(204).json({'message': 'Failed'});
            }
            else{
                const lastLogin = user[0].lastLoggedIn;
                user[0].lastLoggedIn = new Date()
                user[0].save()
                    .then(() => {
                        res.json(
                            {
                                "userName": user[0].userName,
                                "profilePic": user[0].profilePic,
                                "lastLoggedIn": lastLogin
                            })
                    })
                    .catch(err => res.status(400).json('Error:' + err));
            }
        })
        .catch(err => res.status(400).json('Error:' + err));
});

router.route('/request_otp').post((req,res) => {
    const email = req.body.email;
    User.find({email: email})
        .then(users => {
            if(users.length){
                res.status(208).json({
                    "message": "failure"
                });
            }
            else{
                const otp = otpGenerator.generate(5, { alphabets: false, specialChars: false, upperCase: false });
        
                var mailOptions = {
                    from: 'mindwebsmailer@gmail.com',
                    to: email,
                    subject: 'StackHack OTP verification',
                    text: 'Your OTP for verification is ' + otp
                };
                    
                transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                        res.status(400).json('Error:' + error);
                    } else {
                        res.json({
                            "message": "success",
                            "otp": sha256(otp)
                        });
                    }
                });
            }
        })
        .catch(err => res.status(400).json('Error:' + err));
});

router.route('/forgot_password').post((req,res) => {
    const email = req.body.email;
    const time = new Date();
    const resetToken = sha256(email + time.toString());

    User.findOne({email : email})
        .then(user => {
            if(!user){
                res.status(204).json({"message" : "Failure"});
            }
            else{
                user.resetToken = resetToken;
                user.save()
                    .then(() => {
                        var mailOptions = {
                            from: 'mindwebsteam@gmail.com',
                            to: email,
                            subject: 'Reset Password Link',
                            html: "Go to the link below to reset your password <br><br><br>" + "<a href='http://localhost:4200/set-password/"+resetToken+"'>Click here</a>"
                        };
                            
                        transporter.sendMail(mailOptions, function(error, info){
                            if (error) {
                                res.status(400).json('Error:' + error);
                            } else {
                                res.json({"message" : "Success"});
                            }
                        });
                    })
                    .catch(err => res.status(400).json('Error:' + err));
            }
        })
        .catch(err => res.status(400).json('Error:' + err));
});

router.route('/reset_password').post((req,res) => {
    const resettoken = req.body.token;
    const newPassword = req.body.newPassword;
    User.findOne({resetToken: resettoken})
    .then(user => {
        if(!user){
            res.status(204).json({"message" : "Failure"});
        }
        else{
            user.password = newPassword;
            user.resetToken = 'NULL';
            user.save()
                .then(() => res.json('Password reset'))
                .catch(err => res.status(400).json('Error:' + err));
        }
    })
    .catch(err => res.status(400).json('Error:' + err));
});

router.route('/check_reset_token/:token').get((req,res) => {
    const resettoken = req.params.token;
    // console.log(resettoken);
    User.findOne({resetToken: resettoken})
    .then(user => {
        if(!user){
            res.status(204).json({"message" : "Failure"});
        }
        else{
            res.json({"message" : "Success"});
        }
    })
    .catch(err => res.status(400).json('Error:' + err));
});

module.exports = router;