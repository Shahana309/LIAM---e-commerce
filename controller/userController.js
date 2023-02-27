const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const user = require('../routes/user');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const category = require('../models/categoryModel');
const coupon = require('../models/couponModel');
const { ObjectId } = require('mongodb');
const randomstring = require('randomstring');
const moment = require('moment');


// const client = require('twilio')(config.accountSid, config.authToken, {
//     lazyLoading: true
// });

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash;

    } catch (error) {
        console.log(error.message);
    }
}

//otp generator
// function generateOTP() {
//     return Math.floor(100000 + Math.random() * 900000);
// }
// const OTP = generateOTP();


//for send mail 
const sendverifyMail = async (name, email, User) => {
    try {
        console.log(User);
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: 'nagmasayyid@gmail.com',
                pass: 'rjrtwivkrkcuxixe'
            }
        })
        const mailOptions = {
            from: 'nagmasayyid@gmail.com',
            to: email,
            subject: 'for verification mail',
            html: '<p>Hii' + name + ',please click here to <a href= "http://localhost:3000/verify?id= ' + User + '"> verify </a> your email.</p>'
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            }
            else {
                console.log("Email has been sent : -", info.response);
            }
        })
    } catch (error) {
        console.log(error.message);
    }
}


const loadRegister = async (req, res) => {
    try {
        res.render('registration');
    } catch (error) {
        console.log(error.message);
    }
}

const insertUser = async (req, res) => {
    try {
        const secretPassword = await securePassword(req.body.password)
        const checkUser = await User.findOne({ email: req.body.email })
        if (checkUser == null) {
            const user = new User({
                name: req.body.name,
                email: req.body.email,
                mobile: req.body.mobile,
                password: secretPassword,
                is_admin: 0,
                // is_verified: 1,
                // token :OTP
            })
            const userData = await user.save();
            if (userData) {
                // twilio code
                // client.messages.create({
                //     body: 'Hello from Node',
                //     to: '+12345678901',
                //     from: '+12345678901'
                //  }).then(message => console.log(message))
                //    // here you can implement your fallback code
                //    .catch(error => console.log(error))
                sendverifyMail(req.body.name, req.body.email, userData._id);
                res.render('registration', { message: "Your registartion Completed. Please verify your email." })

            } else {
                res.render('registartion', { error: "Your registration failed." })
            }
        }
        else {
            res.render('registration', { error: 'Email already taken' })
        }
    } catch (error) {
        console.log(error.message);

    }
}

const verifymail = async (req, res) => {
    try {
        const updateInfo = await User.updateOne({ email: req.query.id }, { $set: { is_verified: 1 } })
        console.log(updateInfo);
        res.render('verified')
    } catch (error) {
        console.log(error.message);
    }
}

//verify otp

const loadLogin = async (req, res) => {
    try {
        res.render('Login')
    } catch (error) {
        console.log(error.message);
    }
}

const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const userData = await User.findOne({ email: email });
        console.log(userData);
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {
                if (userData.is_verified === 0) {
                    res.render('login', { error: "Please verify your mail" });
                } else {
                    req.session.user = userData._id;
                    res.redirect('/home');
                }
            } else {
                res.render('login', { error: "Email or Password incorrect" });
            }
        }
        else {
            res.render('login', { error: "Email or Password incorrect" });
        }
    } catch (error) {
        console.log(error.message);
    }
}

let orderItems = []

//reset link 
const resetPasswordMail = async (name, email, token) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: 'nagmasayyid@gmail.com',
                pass: 'rjrtwivkrkcuxixe'
            }
        });

        const mailOptions = {
            from: 'nagmasayyid@gmail.com',
            to: email,
            subject: 'For Reset password',
            html: '<p>Hii ' + name + ' please click here to <a href="http://localhost:3000/forgetpassword?token=' + token + '"> Reset </a> your password.</p>'
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            }
            else {
                console.log("Email has been sent:-", info.response);

            }
        })
    } catch (error) {
        console.log(error.message);
    }
}

const forgetLoad = async (req, res) => {

    try {
        res.render('forget-password');
    } catch (error) {
        console.log(error.message);
    }
}

const forgetVerify = async (req, res) => {
    try {
        const email = req.body.email;
        const userData = await User.findOne({ email: email });

        if (userData) {
            if (userData.is_verified === 0) {
                res.render('forget-password', { message: "Please verify your mail id" })
            } else {
                const randomString = randomstring.generate();
                const updatedData = await User.updateOne({ email: email }, { $set: { token: randomString } });
                resetPasswordMail(userData.name, userData.email, randomString);
                res.render('forget-password', { message: "reset password link has been sent to your registered mail id " })
            }
        } else {
            res.render('forget-password', { message: "User email is incorrect" })
        }
    } catch (error) {
        console.log(error.message);
    }
}

const forgetPassword = async (req, res) => {
    try {
        const user = req.session.user
        const token = req.query.token;
        const tokenData = await User.findOne({ token: token });

        if (tokenData) {
            res.render('mail-forgetPassword', { email: tokenData.email });
        } else {
            res.render('404', { message: "Invalid token" });
        }

    } catch (error) {
        console.log(error.message);
    }
}

const resetPassword = async (req, res) => {
    try {
        const password = req.body.password;
        const email = req.body.email;

        const secure_Password = await securePassword(password);
        const updatedData = await User.updateOne({ email: email }, { $set: { password: secure_Password, token: '' } });
        res.redirect('/login');
    } catch (error) {
        console.log(error.message);
    }
}


const loadHome = async (req, res) => {
    try {
        const product = await Product.find().lean()
        const Category = await category.find().lean()
        res.render('home', { product, Category, userData: req.session.user })
    } catch (error) {
        console.log(error.message);
    }
}

const loadProducts = async (req, res) => {
    try {
        const product = await Product.find({ category: req.params.name }).lean()
        const Category = await category.find().lean()
        console.log(product);
        res.render('viewAll', { product, Category })
    } catch (error) {
        console.log(error.message);
    }
}

const loadAllProducts = async (req, res) => {
    try {
        const product = await Product.find().lean()
        const Category = await category.find().lean()
        res.render('viewAll', { product, Category })
    } catch (error) {
        console.log(error.message);
    }
}

//user profile
const profile = async (req, res) => {
    try {

        const userData = await User.find({ _id: req.session.user }).lean()

        const order = await Order.aggregate([
            {
                $match: { userId: ObjectId(req.session.user) },
            }
        ])
        // const orderData = await Order.aggregate([
        //     {
        //         $match: { userId: ObjectId(req.session.user) }
        //     }, {
        //         $lookup: {
        //             from: 'products',
        //             localField: 'Products',
        //             foreignField: '_id',
        //             as: 'products'
        //         },
        //     }, {
        //         $lookup: {
        //             from: 'users',
        //             let:{"addresses" : '$addressId'},
        //             pipeline:[{
        //                 '$match':{
        //                     '$expr':{
        //                         '$eq':['$Address._id','$$addresses'],
        //                     },
        //                 },
        //             },
        //         ],
        //             as:'address'
        //             // localField: 'addressId',
        //             // foreignField: 'Address._id',
        //             // as: 'address'
        //         },
        //     }])
        // console.log(orderData);

        const orderData = await Promise.all(order.map(async (item) => {
            const Address = await User.findOne({ _id: ObjectId(req.session.user) }, {
                Address: {
                    $elemMatch: { _id: item.addressId }
                },
                _id: 0
            }).lean()
            return {
                orderId: item.orderId,
                date: moment(item.date).format('MMMM Do YYYY'),
                payment_method: item.payment_method,
                status: item.status,
                Address: Address.Address,
                _id: item._id
            }
        }))
        res.render('profile', { user: userData[0], Address: userData[0].Address, userData, orderData })
    } catch (error) {
        console.log(error.message);
    }
}


const UpdateProfile = async (req, res) => {
    try {
        const { name, email, mobile } = req.body
        console.log(req.body);
        const userData = await User.updateOne({ _id: req.session.user }, {
            $set: {
                name: name,
                email: email,
                mobile: mobile
            }
        })
        res.redirect('/profile');
    } catch (error) {
        console.log(error.message);
    }
}


const DeleteAddress = async (req, res) => {
    try {
        console.log(req.body);
        const userData = await User.findByIdAndUpdate({ _id: ObjectId(req.session.user) }, {
            $pull: {
                Address: { _id: ObjectId(req.body.addressId) }
            }
        })
        res.json("response")
    } catch (error) {
        console.log(error.message);
    }
}


const LoadAddAddress = async (req, res) => {
    try {
        res.render('add-address')
    } catch (error) {
        console.log(error.message);
    }
}

const AddAddress = async (req, res) => {
    try {
        const Address = await User.findByIdAndUpdate({ _id: req.session.user },
            {
                $addToSet: {
                    Address: req.body
                }
            })
        res.redirect('/profile')
    } catch (error) {
        console.log(error.message);
    }
}

const EditAddress = async (req, res) => {
    try {
        console.log(ObjectId(req.params.id));
        const AddressData = await User.find({ _id: req.session.user }).lean()
        console.log(AddressData);
        const address = AddressData[0].Address.filter((x) => {
            if (x._id == req.params.id) { return x }
        })
        console.log(address);
        res.render('Edit-address', { Address: AddressData[0].Address[0], userData: address[0] })
    } catch (error) {
        console.log(error.message);
    }
}

const updateAddress = async (req, res) => {
    try {
        console.log(req.body);
        const AddressData = await User.updateOne({ _id: req.session.user }
            , {
                $set: {
                    "Address": { Name: req.body.Name, Number: req.body.Number, City: req.body.City, State: req.body.State, Country: req.body.Country, Pincode: req.body.Pincode, address: req.body.Address }
                }
            }
        )
        console.log(AddressData);
        res.redirect('/profile')
    } catch (error) {
        console.log(error.message);
    }
}

const productView = async (req, res) => {
    try {
        const ProductData = await Product.findById(req.params.id).lean()
        console.log(ProductData);
        res.render('product-view', { ProductData, userData: req.session.user })
    } catch (error) {
        console.log(error.message);
    }
}

const AddToCart = async (req, res) => {
    try {
        const Cart = await User.updateOne({ _id: req.session.user }, {
            $addToSet: {
                Cart: ObjectId(req.params.id)
            }
        })
        if(Cart.matchedCount){
            res.json('success')
        }else{
            res.json('error')
        }

    } catch (error) {
        console.log(error.message);
    }
}

const LoadCart = async (req, res) => {
    try {
        const cartData = await User.aggregate([
            {
                $match: { _id: ObjectId(req.session.user) },
            },
            {
                $lookup: {
                    from: 'products',
                    let: { products: '$Cart' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ['$_id', '$$products']
                                }
                            }
                        }
                    ],
                    as: 'CartItems'
                }
            }
        ])
        const CartItems = cartData[0].CartItems
        let subtotal = 0;
        CartItems.forEach((item) => {
            subtotal = subtotal + Number(item.price);
        });
        console.log(CartItems);
        res.render('cart', {
            cartData: CartItems,
            subtotal: subtotal,
            userData: req.session.user
        })
    } catch (error) {
        console.log(error.message);
    }
}


const removeCartProduct = async (req, res) => {
    try {
        const result = await User.findByIdAndUpdate({ _id: ObjectId(req.session.user) }, {
            $pull: {
                Cart: ObjectId(req.params.id)
            }
        })
        res.json('Success')
    } catch (error) {
        res.json("Something went wrong");
        console.log(error.message);
    }
}


const Loadcheckout = async (req, res) => {
    try {
        orderItems = []
        const checkout = await User.find({ _id: req.session.user }).lean()
        const cartData = await User.aggregate([
            {
                $match: { _id: ObjectId(req.session.user) },
            },
            {
                $lookup: {
                    from: 'products',
                    let: { products: '$Cart' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ['$_id', '$$products']
                                }
                            }
                        }
                    ],
                    as: 'CartItems'
                }
            }
        ])
        let subtotal = 0;
        const CartItems = cartData[0].CartItems
        CartItems.map((item, i) => {
            item.quantity = req.body.quantity[i];
            subtotal = subtotal + item.price * req.body.quantity[i];
        });

        for (let i = 0; i < CartItems.length; i++) {
            CartItems[i].sum = CartItems[i].price * CartItems[i].quantity;
        }
        orderItems = CartItems
        res.render('checkout',
            {
                CartItems,
                Address: checkout[0].Address,
                subtotal,
                User: req.session.user,
                userData: req.session.user,
            })
    } catch (error) {
        console.log(error.message);
    }
}

const placeorder = async (req, res) => {
    try {

        const userId = req.body.userId;
        const selectedMethod = req.body.selectedMethod;
        const selectedAdress = req.body.selectedAdress;
        const total = req.body.total;
        console.log(selectedAdress);
        if (req.body.selectedMethod == 1) {
            res.json({
                method: "paypal",
                total: req.body.total,
                userId: userId,
                address: selectedAdress

            });
        } else {
            const checkout = await checkoutFunc(
                userId,
                selectedMethod,
                selectedAdress,
                total
            );
            if (checkout == "success") res.json("success");
            else res.json("error");
        }
    } catch (error) {
        console.log(error);
    }
};

//Cancel Order
const cancelOrder = async (req, res) => {
    const cancelOrder = await Order.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { status: "Cancelled" } }
    );
    if (cancelOrder) {
        cancelOrder.Products.forEach(async (item) => {

            const incrementStockCount = await Product.updateOne(
                { _id: item._id },
                { $inc: { quantity: item.quantity } }
            );
        })

        res.json("success");
    } else
        res.json("error");
};

//Order Details

// const orderDetails = async (req, res) => {
//     try {
//         res.render('order-details');
//     } catch (error) {
//         console.log(error.message);
//     }
// }

const orderDetails = async (req, res) => {
    try {
        const orderData = await Order.aggregate([{ $match: { orderId: req.params.id } },
        {
            $lookup: {
                from: 'products',
                localField: 'Products._id',
                foreignField: '_id',
                as: 'NewOrders'
            }
        }, {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user'
            }
        }
        ])
        console.log(orderData);
        res.render("order-details", {
            orderDetails: orderData
        });
    } catch (error) {
        console.log(error);
    }
};



//Paypal Integration
const paypalCheckout = async (req, res) => {
    const user = await req.session.user;
    const userId = req.params.userId;
    const address = req.params.address;

    res.render("payment-integration", {
        totalAmount: req.params.total,
        userId: userId,
        address: address,
    });
};

//Paypal Checkout
const paypalSummary = async (req, res) => {
    try {
        const selectedMethod = 1;
        const userId = req.body.userId;
        const selectedAdress = req.body.address;
        // console.log(selectedAdress);
        const checkout = await checkoutFunc(userId, selectedMethod, selectedAdress);
        if (checkout == "success") res.json("success");
        else res.json("error");
    } catch (error) {
        console.log(error);
    }
};

//Checkout function
const checkoutFunc = async (userId, selectedMethod, selectedAdress, total) => {
    const userCartDetails = await User.find({ _id: userId });
    const cart = userCartDetails[0].Cart;
    //Order Id
    const result = Math.random().toString(36).substring(2, 7);
    const id = Math.floor(100000 + Math.random() * 900000);
    const orderId = result + id;
    const date = new Date().toDateString();
    let method = "";

    const createCart = cart.map(async (item, i) => {
        return (
            {
                productId: item._id
            }
        )
    });
    const UserData = await User.find({ _id: userId }).lean()
    const productDetails = orderItems.map((item) => {
        return {
            _id: item._id,
            quantity: item.quantity
        }
    });
    if (selectedMethod == 1) {
        method = "paypal";
    } else if (selectedMethod == 3) {
        method = "Cash on delivery";
    }
    const data = {
        userId: userId,
        Products: productDetails,
        orderId: orderId,
        date: date,
        status: "Pending",
        payment_method: method,
        addressId: selectedAdress,
        total: total
    };
    try {
        const response = await Order.insertMany(data);

        orderItems.forEach(async (item) => {
            const decrementCount = await Product.updateOne(
                { _id: item._id },
                { $inc: { quantity: -item.quantity } }
            );
        })
    } catch (error) {
        console.log(error);
    }
    const clearAll = await User.updateOne(
        { _id: userId },
        { $set: { Cart: [] } }
    );
    return "success";
};

const redeemCoupon = async (req, res) => {
    const Coupon = await coupon.findOne({ couponCode: req.body.coupon });
    const validate = await coupon.updateOne(
        { couponCode: req.body.coupon, expiryDate: { $gte: new Date() } },
        {
            $addToSet: {
                user: { userId: req.session.user },
            },
        }
    );

    if (validate.modifiedCount)
        res.json({ success: "success", amount: Coupon.couponOffer, message: "Coupon Applied" });
    else res.json({ error: "Invalid Coupon" });
};

const userLogout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/');
    } catch (error) {
        console.log(error.message);
    }
}

const searchProduct = async (req, res, next) => {
    try {
        console.log(req.body.search);
        const search = req.body.search
        const product = await Product.find({
            $and: [
                {
                    $or: [
                        { productname: { $regex: search, $options: 'i' } },
                        { category: { $regex: search, $options: 'i' } },
                        // {price:{$regex:parseInt(search)}}
                    ]
                },
                { is_delete: false }]
        }).lean()
        console.log(product);
        const Category = await category.find({ is_delete: false }).lean()
        console.log(Category);
        //   const userdata = await User.find().lean()
        res.render('viewAll', { product, Category })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    loadRegister,
    loadLogin,
    insertUser,
    verifymail,
    verifyLogin,
    forgetLoad,
    forgetVerify,
    forgetPassword,
    resetPassword,
    loadHome,
    profile,
    UpdateProfile,
    DeleteAddress,
    LoadAddAddress,
    AddAddress,
    EditAddress,
    updateAddress,
    productView,
    AddToCart,
    LoadCart,
    removeCartProduct,
    Loadcheckout,
    placeorder,
    cancelOrder,
    orderDetails,
    paypalCheckout,
    paypalSummary,
    redeemCoupon,
    loadProducts,
    loadAllProducts,
    userLogout,
    searchProduct
}