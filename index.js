const express = require("express");
const port = process.env.PORT || 3000;
const mongoose = require("mongoose");
require('dotenv').config();
const authRouter = require("./routes/auth");

const app = express();
const connect = mongoose.connect(process.env.mongodbUrl);

connect.then(() => {
    console.log("Connected Successfully to the database");
})
.catch((err) => {
    console.log("Error Connecting to the database" + err);
})


app.use(express.json());
app.use(express.urlencoded({extended: false}));


app.use("/v1/auth", authRouter);


app.listen(port, () => {
    console.log(`App listening on port ${port}`);
})







