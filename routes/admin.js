const express = require("express");
const admin = express();
const hbs = require('express-handlebars');

const session = require("express-session");


const bodyParser = require("body-parser");
admin.use(bodyParser.json());
admin.use(bodyParser.urlencoded({ extended: true }));

admin.set('views', './views/admin')

const multer = require("multer");
const path = require("path");

admin.use(express.static('public'));

const productStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/User Assets/images/product'));
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name);
    }
})
const categoryStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/User Assets/images/category'));
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name);
    }
})

const checkFileType = function (file, cb) {
    //Allowed file extensions
    const fileTypes = /jpeg|jpg|png|gif|svg|webp/;
    
    //check extension names
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
    
    const mimeType = fileTypes.test(file.mimetype);
    if (mimeType && extName) {
    return cb(null, true);
    } else {
    cb("Error: You can Only Upload Images!!");
    }   
    };

const productUpload = multer({ storage: productStorage, limits:{fileSize:1000000}, fileFilter:(req,file,cb)=>{
    checkFileType(file,cb);
}});
const categoryUpload = multer({ storage: categoryStorage, limits:{fileSize:1000000}, fileFilter:(req,file,cb)=>{
    checkFileType(file,cb);
}});

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
admin.post('/add-products', productUpload.array('image', 5), adminController.Addproduct);
admin.get('/edit-products/:id', auth.isLogin, adminController.editProduct);
admin.post('/update-product', productUpload.array('image', 5), adminController.updateProduct);
admin.get('/delete-product/:id', adminController.deleteProduct);
admin.get('/product-details', adminController.productView);

admin.get('/category-list', auth.isLogin, adminController.categoryList);
admin.get('/add-category', auth.isLogin, adminController.addCategoryLoad);
admin.post('/add-category', categoryUpload.single('image'), adminController.addCategory);
admin.get('/edit-category/:id', adminController.editCategory);
admin.post('/update-category', categoryUpload.single('image'), adminController.updateCategory);
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