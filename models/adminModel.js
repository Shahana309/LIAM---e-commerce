const mongoose = require('mongoose')

const adminSchema = new mongoose.Schema({

    Name: {
        type: String,
        required: true

    },
    Password: {
        type: String,
        required: true
    }
  
});


module.exports = mongoose.model('Admin', adminSchema);