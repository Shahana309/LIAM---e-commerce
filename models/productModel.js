const mongoose = require('mongoose')
// const Schema = mongoose.Schema,

// ObjectId =Schema.ObjectId;

const productSchema = new mongoose.Schema({

    productname: {
        type: String,

    },

    category: {
        type: String,
    },

    quantity: {
        type: Number,
        required: false
    },

    description: {
        type: String,
    },

    price: {
        type: String,
    },

    image: {
        type: Array,
    },
    status: {
        type: String,
    },
    is_delete: {
        type: Boolean,
        default: 0
    }
});

module.exports = mongoose.model('Product', productSchema);

