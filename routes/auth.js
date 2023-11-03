
const express = require("express");
const router = express.Router();
const { userCollection } = require("../Schemas/userSchema");
const { forgetPasswordCollection } = require("../Schemas/forgetPassword");
const bcrypt = require("bcrypt");
const joi = require("joi");
const myCustomJoi = joi.extend(require("joi-phone-number"));
const CryptoJS = require("crypto-js");
const {send} = require("../utilities/sendEmail");
const {generateOTP} = require("../utilities/generateOTP");
const jwt = require('jsonwebtoken');
require('dotenv').config();

router.post('/register', async (req, res) => {
    const {username, phoneNumber, password, email} = req.body;

    const registerValidationSchema = joi.object({
        username: joi.string().required(),
        password: joi.string().required().min(6),
        email: joi.string().email().required(),
        phoneNumber: myCustomJoi.string().phoneNumber({defaultCountry: 'NG'})
    });
    
    const {error: registerValidationError} = registerValidationSchema.validate({username, phoneNumber, password, email})
    if (!registerValidationSchema) return res.send(registerValidationError);
        
    const salt = bcrypt.genSaltSync(10)

    const hashedPassword = bcrypt.hashSync(password, salt);

    await userCollection.create({
        username,
        phoneNumber,
        password: hashedPassword,        
        email        
    });

    res.status(201).send("User Successfully Created");
});


router.post("/login", async (req, res) => {
   const {username, password} = req.body;

    const loginValidationSchema = joi.object({
        username: joi.string().required(),
        password: joi.string().required().min(6).max(12)
    });

    const {error: loginValidationError} = loginValidationSchema.validate({username, password});
    if (!loginValidationSchema) return res.send(loginValidationError);

    const userDetail = await userCollection.findOne({username});

    if (!userDetail) return res.status(404).send("user not found");

    const doesPasswordMatch = bcrypt.compareSync(password, userDetail.password);

    if (!doesPasswordMatch) return res.status(400).send("Invalid Credentials");

    const {username: newUsername, _id, phoneNumber, email} = userDetail;
    const token = jwt.sign({
        username: newUsername,
        userId: _id,
        phoneNumber,
        email
    }, process.env.secret);

    res.status(200).send({
        message: "User successfully Login",
        token
    });

});

router.post("/forget-password", async (req, res) => {

    try {
        const {email} = req.body;

        const validateEmail = joi.string().email().required().messages({
            "string.email": "Your email is not valid",
            "any.required": "email 'field' is required"
        });
    
        if (!email) return await validateEmail.validateAsync(email);
    
        const user =  await userCollection.findOne({email});
    
        if (!user) return res.status(404).send("User not found");
           
        const OTP = generateOTP();
        
        
        let encrypted = CryptoJS.AES.encrypt(JSON.stringify({userId: user._id, OTP}), process.env.secretPhrase).toString();
        
    
        await forgetPasswordCollection.create({
            userId: user._id,
            OTP,
            token: encrypted
        });
    
        await send.sendMail({
            to: email,
            subject: "Password Reset",
            html: `
                <div>
                    <h1>Password Reset</h1>
                    <div>Click <a href="#">here</a> to reset your password</div>
                    <div>or this token ${encrypted} and this OTP ${OTP}</div>
                    <div>Your token and OTP expires in 15 minutes</div>
                </div>
            `
        });

        res.status(201).send("message successfully sent");

    } catch (error) {
        console.log(res.status(error.status || 500).send(error.message || "internal server error"));
    }
});

router.put("/reset-password", async (req, res) => {
    try {
        const {OTP, reqToken, newPassword} = req.body;    

        let decrypted = JSON.parse(CryptoJS.AES.decrypt(reqToken, process.env.secretPhrase).toString(CryptoJS.enc.Utf8));
        console.log(decrypted.userId);
        const derivedToken = await forgetPasswordCollection.findOne({userId: decrypted.userId, OTP});
        console.log("derived id " + derivedToken.userId);

        if (!derivedToken) return res.send("Invalid token");
        
        const newHashedPassword = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));

        await userCollection.findByIdAndUpdate(decrypted.userId, {
            password: newHashedPassword
        }, {new: true});

        await forgetPasswordCollection.findOneAndDelete({userId: decrypted.userId, OTP});

        res.send({
            message: "Password changed Successfully"
        });
        
    } catch (err) {
        console.log(res.status(err.status || 500).send(err.message || "internal server error"));
    }
})

module.exports = router;