const router = require('express').Router();
const sha256 = require('sha256');
const nodemailer = require("nodemailer");
var otpGenerator = require('otp-generator');
var cloudinary = require('cloudinary').v2;
let User = require('../models/user.model');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'project.demo.react.2020@gmail.com',
        pass: 'yfopjjwdbarsrztn'
    }
});

cloudinary.config({
    cloud_name: 'chatify',
    api_key: '283817198312558',
    api_secret: 'rXixvCEAWNJsb7ZmRAEUwGuhJS0'
})

router.route('/').get((req,res) => {
    User.find()
        .then(users => res.json(users))
        .catch(err => res.status(400).json('Error:' + err));
});
// For user login and to generate user token
router.route('/login').post((req,res) => {
    // Get email and password from frontend
    const email = req.body.email;
    const password = req.body.password;
    const time = new Date();

    // Find the user with the email id in mongodb
    User.find({email: email, password: password})
        .then(users => {
            if(!users.length){
                // If not found in db, notify frontend
                res.status(206).json({"message":'Failure'});
            }
            else{
                // Else generate new token for user for token authentication and send token to frontend
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

// To get user session token for seamless login
router.route('/get_session').post((req,res) => {
    const token = req.body.token;
    User.find({ sessionToken: token }, 'userName profilePic lastLoggedIn picVersion email')
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
                                "lastLoggedIn": lastLogin,
                                "picVersion": user[0].picVersion,
                                "email": user[0].email
                            })
                    })
                    .catch(err => res.status(400).json('Error:' + err));
            }
        })
        .catch(err => res.status(400).json('Error:' + err));
});

// To get user session details for seamless login
router.route('/get_user_details').post((req,res) => {
    const token = req.body.token;
    User.find({ sessionToken: token }, 'userName mobile status profilePic picVersion lastLoggedIn')
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
                                "username": user[0].userName,
                                "mobile": user[0].mobile,
                                "status": user[0].status,
                                "profilepic": user[0].profilePic,
                                "picVersion": user[0].picVersion
                            })
                    })
                    .catch(err => res.status(400).json('Error:' + err));
            }
        })
        .catch(err => res.status(400).json('Error:' + err));
});

// To check the locally stored session token in the Mongo DB
router.route('/check_session').post((req,res) => {
    const token = req.body.token;
    User.findOne({ sessionToken: token })
        .then(user => {
            if(!user){
                res.json({'message': 'Failed'});
            }
            else{
                user.lastLoggedIn = new Date();
                user.save()
                    .then(() => {
                        res.json({"message": "Success"});
                    })
                    .catch(err => res.status(400).json('Error:' + err));
            }
        })
        .catch(err => res.status(400).json('Error:' + err));
});

// To request OTP for registering
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
                    subject: 'Demo OTP verification',
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

// To register an user
router.route('/register').post((req,res) => {
    const userName = req.body.username;
    const password = req.body.password;
    const email = req.body.email;
    const profilePic = "default/default";
    const picVersion = "1592771519";
    const sessionToken = 'NULL';
    const lastLoggedIn = new Date();
    const resetToken = 'NULL';
    const mobile = req.body.mobile;
    const status = req.body.status;
    const role = "user";
    const newUser = new User({ userName, password, email, profilePic, sessionToken, lastLoggedIn, resetToken, picVersion, mobile, status, role });

    // console.log(newUser);
    newUser.save()
        .then(() => res.status(201).json({
            "message": "Success"
        }))
        .catch(err => res.status(400).json('Error:' + err));
});

// Update Profile Pic of the user
router.route('/update_picture').post((req,res) => {
    const token = req.body.token;
    const file = req.files.pic;

    console.log(token);

    User.findOne({sessionToken: token}, 'email profilePic picVersion')
        .then((user) => {
            console.log(user.email);
            cloudinary.uploader.upload(file.tempFilePath, {upload_preset: 'profile_pic', public_id: sha256(user.email)})
                .then((cloud) => {
                    console.log(cloud.version);
                    user.profilePic = "profile/" + sha256(user.email);
                    user.picVersion = cloud.version;
                    user.save()
                        .then(() => res.json({"message":"User Details updated"}))
                        .catch(err => res.status(400).json('Error:' + err));
                })
                .catch((err) => res.status(400).json('Error:' + err));
        })
        .catch(err => res.status(400).json('Error:' + err));
});

// Update Details of the user
router.route('/update_details').post((req,res) => {
    const token = req.body.token;
    User.findOne({sessionToken: token})
    .then(user => {
        user.userName = req.body.username;
        user.mobile = req.body.mobile;
        user.status = req.body.status;
        user.save()
            .then(() => res.json('User Details updated'))
            .catch(err => res.status(400).json('Error:' + err));
    })
    .catch(err => res.status(400).json('Error:' + err));
});

// Change password for the user
router.route('/change_password').post((req,res) => {
    const token = req.body.token;
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    User.findOne({sessionToken: token, password: oldPassword})
    .then(user => {
        if(!user){
            res.json({"message" : "Failure"});
        }
        else{
            user.password = newPassword;
            user.save()
                .then(() => res.json('Password updated'))
                .catch(err => res.status(400).json('Error:' + err));
        }
    })
    .catch(err => res.status(400).json('Error:' + err));
});

// Generate link for user to reset password and send to email
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
                            from: 'project.demo.react.2020@gmail.com',
                            to: email,
                            subject: 'Reset Password Link',
                            html: "Go to the link below to reset your password <br><br><br>" + "<a href='https://relaxed-lamarr-bc6151.netlify.app/set_pass/"+resetToken+"'>Click here to reset password</a>"
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

// Reset the actual password from the email link
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
                .then(() => res.json({"message":'Password reset'}))
                .catch(err => res.status(400).json('Error:' + err));
        }
    })
    .catch(err => res.status(400).json('Error:' + err));
});

// Verify the token for reset such that it cannot be done multiple times
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

// Verify the token for reset such that it cannot be done multiple times
router.route('/get_contacts').get((req,res) => {
    User.find({}, 'userName email profilePic picVersion role')
    .then(user => {
        if(!user.length){
            res.status(204).json({"message" : "Failure"});
        }
        else{
            res.json(user);
        }
    })
    .catch(err => res.status(400).json('Error:' + err));
});

// To get contact info of a user
router.route('/get_contact_info').post((req,res) => {
    const email = req.body.email;
    User.find({ email: email }, 'status lastLoggedIn')
        .then(user => {
            if(user.length === 0){
                res.status(204).json({'message': 'Failed'});
            }
            else{
                res.json(
                    {
                        "status": user[0].status,
                        "lastLogin": user[0].lastLoggedIn
                    })
            }
        })
        .catch(err => res.status(400).json('Error:' + err));
});

module.exports = router;