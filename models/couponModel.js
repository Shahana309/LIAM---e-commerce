const mongoose = require('mongoose')
const Schema = mongoose.Schema;

ObjectId = Schema.ObjectId
const couponSchema = new Schema({

    couponCode: {
        type: String,
        required: true

    },
    couponOffer: {
        type: Number,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    user: [
        { userId: { type: ObjectId }, _id: false }
    ],

    is_valid: {
        type: Boolean,
        default: true
    }
});


module.exports = mongoose.model('Coupon', couponSchema);

