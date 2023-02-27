const express = require('express')
const user = express();
const bodyParser = require('body-parser');
const multer = require("multer");
const path = require("path");
const bcrypt = require('bcrypt')
const hbs = require('express-handlebars');
const userController = require('../controller/userController');
const auth = require('../middleware/auth');

user.use(bodyParser.json());
user.use(bodyParser.urlencoded({ extended: true }));

user.use(express.static(path.join(__dirname, 'public')));
user.set('views', path.join(__dirname, 'views'));

user.set('views', './views/users')

user.engine('hbs', hbs.engine({
  extname: 'hbs',
  defaultLayout: 'layouts',
  usersDir: __dirname + '/views/users/'
}
));


user.get('/register',auth.isLogout,userController.loadRegister);
user.post('/register',userController.insertUser);
user.get('/',userController.loadHome);
user.get('/login',auth.isLogout,userController.loadLogin);
user.post('/login',userController.verifyLogin);

user.get('/forgetpassword',auth.isLogout ,userController.forgetPassword);
user.post('/forgetpassword',userController.resetPassword);
user.get('/forget',auth.isLogout ,userController.forgetLoad);
user.post('/forget',userController.forgetVerify);

user.get('/verify',userController.verifymail);
user.get('/home',auth.isLogin,userController.loadHome);
user.get('/logout',auth.isLogin,userController.userLogout);
user.get('/viewAll/:name',userController.loadProducts);  
user.get('/viewAll',userController.loadAllProducts)                               
user.get('/product-details/:id',userController.productView);

user.get('/profile',auth.isLogin,userController.profile);
user.get('/add-address',auth.isLogin,userController.LoadAddAddress);
user.get('/Edit-Address/:id',auth.isLogin,userController.EditAddress);
user.post('/update-address',auth.isLogin,userController.updateAddress);
user.post('/Update-profile',auth.isLogin,userController.UpdateProfile);
user.post('/deleteAddress',auth.isLogin,userController.DeleteAddress);
user.post('/submit-address',auth.isLogin,userController.AddAddress);


user.get('/cart',auth.isLogin,userController.LoadCart);
user.get('/add-to-cart/:id',auth.isLogin,userController.AddToCart);
user.delete('/cart-delete/:id',auth.isLogin,userController.removeCartProduct);
user.post('/proceed-checkout',auth.isLogin,userController.Loadcheckout);
user.get('/paypal-checkout/:userId/:total/:address',auth.isLogin ,userController.paypalCheckout)
user.post('/paypal/place/order',auth.isLogin ,userController.paypalSummary);

user.post('/place-order',auth.isLogin,userController.placeorder);
user.delete('/cancel-order/:id',auth.isLogin ,userController.cancelOrder);
user.get('/order-details/:id',auth.isLogin,userController.orderDetails);

user.put('/redeem-coupon',auth.isLogin,userController.redeemCoupon);
user.get('/logout',auth.isLogin,userController.userLogout);
user.post('/searchProduct',userController.searchProduct)



module.exports = user;
