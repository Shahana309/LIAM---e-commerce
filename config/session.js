const session = require('express-session')
require('dotenv').config()

const checkSession = session({
    secret : process.env.SECRET_KEY,
    resave :false,
    saveUninitialized:false,
    cookie :{
        expires :560000,
    },
})

// const accountSid = "AC212b035d4ffccc21ad06f2e8093d805a";
// const authToken = "2ce2f82c1010e25516564f7776bb1a28";


module.exports = checkSession ;
    // authToken,
    // accountSid
