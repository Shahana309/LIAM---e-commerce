const express = require("express");
const admin = express();
const hbs = require('express-handlebars');
const multer = require('../config/multer')
const session = require("express-session");


const bodyParser = require("body-parser");
admin.use(bodyParser.json());
admin.use(bodyParser.urlencoded({ extended: true }));

admin.set('views', './views/admin')

admin.use(express.static('public'));



const auth = require("../middleware/adminAuth")

const adminController = require("../controller/adminController")

admin.get('/', auth.isLogout, adminController.loadLogin);
admin.post('/', adminController.verifyLogin);
admin.get('/home', auth.isLogin, adminController.loadDashboard);
admin.get('/sales-report', auth.isLogin, adminController.salesReport);
admin.get('/revenue/report', adminController.revenueReport);
admin.get('/logout', auth.isLogin, adminController.logout);

admin.get('/products', adminController.products);
admin.get('/add-products', auth.isLogin, adminController.Addproductsload);
admin.post('/add-products', multer.productUpload.array('image', 5), adminController.Addproduct);
admin.get('/edit-products/:id', auth.isLogin, adminController.editProduct);
admin.post('/update-product', multer.productUpload.array('image', 5), adminController.updateProduct);
admin.get('/delete-product/:id', adminController.deleteProduct);
admin.get('/product-details', adminController.productView);

admin.get('/category-list', auth.isLogin, adminController.categoryList);
admin.get('/add-category', auth.isLogin, adminController.addCategoryLoad);
admin.post('/add-category', multer.categoryUpload.single('image'), adminController.addCategory);
admin.get('/edit-category/:id', adminController.editCategory);
admin.post('/update-category', multer.categoryUpload.single('image'), adminController.updateCategory);
admin.get('/delete-category/:id', adminController.deleteCategory);

admin.get('/all-users', auth.isLogin, adminController.LoadAllUsers);
admin.get('/Block-User/:id', adminController.blockUser);
admin.get('/unblock-User/:id', adminController.unblockUser);

admin.get('/orders',auth.isLogin,adminController.orderlist);
admin.get('/orderDetails/:id',auth.isLogin,adminController.orderDetails);
admin.put('/order-status/:id',adminController.orderStatus);
admin.get('/coupon',auth.isLogin,adminController.couponList);
admin.get('/add-coupon',adminController.loadAddCoupon);
admin.post('/add-coupon',auth.isLogin,adminController.addCoupon);
admin.get('/activate-coupon/:id', adminController.activateCoupon);
admin.get('/deactivate-coupon/:id', adminController.deactivateCoupon);
admin.post('/timeSearch',auth.isLogin,adminController.timeSearch)

admin.get('*', function (req, res) {
    res.redirect('/admin');
});

module.exports = admin;