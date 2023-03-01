const user = require("../models/userModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const order = require("../models/orderModel");
const coupon = require("../models/couponModel");
const admin = require('../models/adminModel');
const { ObjectId } = require("mongodb");
const moment = require('moment');
const { ConnectionStates } = require("mongoose");

const loadLogin = async (req, res) => {
    try {

        res.render('login');

    } catch (error) {
        console.log(error.message);
    }
}

const verifyLogin = async (req, res) => {
    try {
        const AdminData = await admin.find({ Name: req.body.Name })
        if (AdminData) {
            if (req.body.Password == AdminData[0].Password) {
                req.session.admin = AdminData[0].Name
                res.redirect('/admin/home')
            } else {
                res.render('login')
            }
        } else {
            res.render('login')
        }

    } catch (error) {
        console.log(error.message);
    }
}

const loadDashboard = async (req, res) => {
    try {
        const adminData = await admin.findOne({ Name: req.session.admin });
        const totalOrders = await order.find().count();
        const totalProducts = await Product.find().count();
        const totalUsers = await user.find().count();
        const revenue = await order.aggregate([{ $match: { status: 'Delivered' } },
        {
            $group: {
                _id: '',
                "total": { $sum: '$total' }
            }
        }, {
            $project: {
                _id: 0,
                "TotalAmount": '$total'
            }
        }]);

        const totalRevenue = revenue.length >= 1 ? revenue[0].TotalAmount : 0
        res.render("home", { adminData, totalOrders, totalProducts, totalUsers, totalRevenue });
    } catch (error) {
        console.log(error.message);
    }
}

const salesReport = async (req, res) => {
    try {
        const orderDetails = await order.find().lean();
        const ProductData = await order.aggregate([{
            $lookup: {
                from: "products",
                localField: "Products._id",
                foreignField: "_id",
                as: "product_details"
            }
        }])
        for (let i = 0; i < ProductData.length; i++) {
            ProductData[i].date = moment(ProductData[i].date).format('MMMM Do YYYY')
        }
        res.render("salesReport", { ProductData, adminData: req.session.admin })
    } catch (error) {
        console.log(error.message);
    }
}

const revenueReport = async (req, res) => {
    try {
        const monthWiseRevenue = await order.aggregate([
            { $match: { status: "Delivered" } },
            {
                $group: {
                    _id: { $month: "$date" },
                    count: { $sum: 1 },
                    total: { $sum: "$total" },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        const categoryRevenue = await order.aggregate([
            { $unwind: "$Products" },
            {
                $lookup: {
                    from: "products",
                    localField: "Products._id",
                    foreignField: "_id",
                    as: "productCategory",
                },
            },
            {
                $group: {
                    _id: "$productCategory.category",
                    total: { $sum: "$total" },
                },
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "_id",
                    foreignField: "categoryName",
                    as: "categories",
                },
            },
            { $project: { _id: 1, total: 1 } },
            { $sort: { _id: -1 } },
        ]);
        const data = categoryRevenue.map((item) => {
            return {
                name: item._id[0],
                total: item.total
            }
        })
        res.json({
            monthWiseRevenue: monthWiseRevenue,
            categoryRevenue: data,
        });
    } catch (error) {
        console.log(error);
    }
};

const timeSearch = async (req, res, next) => {
    try {
        const from = req.body.from
        const to = req.body.to
        const timestamp = Date.parse(from);
        const fromdate = new Date(timestamp);
        const toTime = Date.parse(to)
        const todate = new Date(toTime)
        let totalArray = []
        let orderData = await order.find().lean()

        orderData = orderData.filter((obj) => {
            return (new Date(obj.date) >= fromdate && new Date(obj.date) <= todate)
        })
        const categoryRevenue = await order.aggregate([
            { $unwind: "$Products" },
            {
                $lookup: {
                    from: "products",
                    localField: "Products._id",
                    foreignField: "_id",
                    as: "productCategory",
                },
            },
            {
                $group: {
                    _id: "$productCategory.category",
                    total: { $sum: "$total" },
                },
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "_id",
                    foreignField: "categoryName",
                    as: "categories",
                },
            },
            { $project: { _id: 1, total: 1 } },
            { $sort: { _id: -1 } },
        ]);
        const categoryData = categoryRevenue.map((el) => {
            return el._id[0]
        })
        totalArray = categoryRevenue.map((item) => {
            return item.total
        })
        const data = {
            category: categoryData,
            count: totalArray,
        }

        res.json(data)
    } catch (error) {
        next(error)
    }
}

const logout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/admin');

    } catch (error) {
        console.log(error.message);
    }
}

//Products list
const products = async (req, res) => {
    try {
        const productData = await Product.find({ is_delete: 0 }).lean()

        res.render('products', { productData, adminData: req.session.admin })
    } catch (error) {
        console.log(error.message);
    }
}

// const products = async (req, res) => {
//     try {
//         const productData = await Product.aggregate([
//             { $match: { status: true } },
//             {
//                 $lookup: {
//                     from: "categories", localField: "category_id", foreignField: "_id", as: "category"
//                 }
//             },
//         ])
//         res.render('products', { productData })
//     } catch (error) {
//         console.log(error.message);
//     }
// }

// Add new user

const Addproductsload = async (req, res) => {
    try {
        const categoryData = await Category.find({ is_delete: 0 }).lean()

        res.render("add-products", { categoryData, adminData: req.session.admin })
    }
    catch (error) { console.log(error.messasge) }
}

//add new product

const Addproduct = async (req, res) => {
    try {
        const { productname, category, quantity, description, price, status } = req.body;

        let image = req.files.map(function (obj) {
            return obj.filename;
        });
        const product = new Product({
            productname: productname,
            category: category,
            quantity: quantity,
            description: description,
            price: price,
            image: image,
            status: status
        });
        const productData = await product.save();
        if (productData) {
            res.redirect('/admin/products');
        }
        else { res.render('add-products', { message: 'Something went Wrong !!' }); }
    }

    catch (error) { console.log(error.message) }
}


//edit user 
// const editProduct = async (req, res) => {
//     try {
//         const productData = await Product.find({ _id: ObjectId(req.params.id) }).lean()
//         if (productData) {
//             res.render('edit-products', { productData, categoryData })
//         }
//         else {
//             res.redirect('/admin/product');
//         }
//     }
//     catch (error) { console.log(error.message) }
// }

const editProduct = async (req, res) => {
    try {
        const productData = await Product.find({ _id: ObjectId(req.params.id) }).lean()
        const categoryData = await Category.find().lean()
        res.render('edit-products', { productData, categoryData, adminData: req.session.admin })
    }
    catch (error) { console.log(error.message) }
}

//update product
const updateProduct = async (req, res) => {
    try {
        const { productname, category, brand, quantity, description, price, status } = req.body
        console.log(req.body);
        const images = req.files.map((obj) => {
            return obj.filename;
        })

        if (images.length >= 1) {
            const productData = await Product.updateOne({ _id: ObjectId(req.body.id) }, {
                $set: {
                    productname: productname,
                    category: category,
                    brand: brand,
                    quantity: quantity,
                    description: description,
                    price: price,
                    image: images,
                    status: status
                }
            })
        } else {
            const productData = await Product.updateOne({ _id: ObjectId(req.body.id) }, {
                $set: {
                    productname: productname,
                    category: category,
                    brand: brand,
                    quantity: quantity,
                    description: description,
                    price: price,
                    status: status
                }
            })
        }
        res.redirect('/admin/products')
    } catch (error) {
        console.log(error.message);
    }
}

//delete Product
const deleteProduct = async (req, res) => {
    try {
        const productData = await Product.updateOne({ _id: ObjectId(req.params.id) }, { is_delete: 1 });
        res.redirect('/admin/products')
    }
    catch (error) { console.log(error.message) }
}

//Product View
const productView = async (req, res) => {
    try {
        const productData = await Product.findById(req.params.id).lean()
        console.log(productData);
        res.render('product-view', { productData, adminData: req.session.admin })
    } catch (error) {
        console.log(error.message);
    }
}

//Category list
const categoryList = async (req, res) => {
    try {
        const categoryData = await Category.find({ is_delete: 0 }).lean();
        res.render('categorylist', { categoryData, adminData: req.session.admin });
    } catch (error) {
        console.log(error.message);
    }
}

//add Category load
const addCategoryLoad = async (req, res) => {
    try {
        res.render('add-category', { adminData: req.session.admin });
    } catch (error) {
        console.log(error.message);
    }
}

//category
// const addCategory = async (req, res) => {
//     try {
//         const { categoryName, categoryOffer } = req.body;
//         const category = new Category({

//             categoryName: categoryName,
//             image: req.file.filename,
//             categoryOffer: categoryOffer

//         });
//         console.log(req.body);
//         const categoryData = await category.save();
//         if (categoryData) { 
//             res.redirect('/admin/categorylist');
//         }
//         else { res.render('add-category', { message: 'Something went Wrong !!' }); }
//     }

//     catch (error) { console.log(error.message) }
// }

const addCategory = async (req, res) => {
    try {
        const checkCategory = await Category.findOne({ categoryName: req.body.categoryName })
        if (checkCategory == null) {
            const { categoryName, categoryOffer } = req.body
            const category = new Category({
                categoryName: categoryName,
                image: req.file.filename,
                categoryOffer: categoryOffer
            });
            const categoryData = await category.save();
                res.redirect('/admin/category-list');
        } else {
            res.render('add-category', { error: 'Category Already Exist', adminData: req.session.admin })
        }
    }
    catch (error) { 
        console.log(error.message)
     }
}


//edit category
const editCategory = async (req, res) => {
    try {
        console.log(req.params.id);
        const categoryData = await Category.find({ _id: ObjectId(req.params.id) }).lean();
        res.render("edit-category", { categoryData, adminData: req.session.admin })
    } catch (error) {
        console.log(error.message);
    }
}

//update category
const updateCategory = async (req, res) => {
    try {
        const { categoryName, categoryOffer } = req.body
        if (req.file) {
            const CategoryData = await Category.updateOne({ _id: ObjectId(req.body.id) }, {
                $set: {
                    categoryName: categoryName,
                    image: req.file.filename,
                    categoryOffer: categoryOffer
                }
            })
        } else {
            const CategoryData = await Category.updateOne({ _id: ObjectId(req.body.id) }, {
                $set: {
                    categoryName: categoryName,
                    categoryOffer: categoryOffer
                }
            })
        }
        res.redirect('/admin/category-list')
    } catch (error) {
        console.log(error.message);
    }
}

//delete category
const deleteCategory = async (req, res) => {
    try {
        const categoryDelete = await Category.updateOne({ _id: ObjectId(req.params.id) }, { $set: { is_delete: 1 } });
        res.redirect('/admin/category-list');
    }
    catch (error) {
        console.log(error.message)
    }
}

//All users
const LoadAllUsers = async (req, res) => {
    try {
        const userData = await user.find().lean();
        res.render('all-users', { userData, adminData: req.session.admin })
        // console.log(userData);
    } catch (error) {
        console.log(error.message)
    }
}

//block user
const blockUser = async (req, res) => {
    try {
        const data = await user.findOne({ _id: ObjectId(req.params.id) })
        console.log(data);
        const userData = await user.updateOne({ _id: ObjectId(req.params.id) }, {
            $set: {
                block: true
            }
        });
        //console.log(userData);
        res.redirect('/admin/all-users')
    }
    catch (error) { console.log(error.message) }
}

//unblock user
const unblockUser = async (req, res) => {
    try {

        const userData = await user.updateOne({ _id: ObjectId(req.params.id) }, {
            $set: {
                block: true
            }
        });
        res.redirect('/admin/all-users')
    }
    catch (error) { console.log(error.message) }
}

const orderlist = async (req, res) => {
    try {
        const orderData = await order.aggregate([
            {
                $lookup: {
                    from: 'products',
                    localField: 'Products._id',
                    foreignField: '_id',
                    as: 'NewOrders'
                }
            }, { $sort: { _id: -1 } }
        ])

        res.render('order', {
            adminData: req.session.admin,
            orderData,
        })
    } catch (error) {
        console.log(error.message);
    }
}

const orderDetails = async (req, res) => {
    const orderData = await order.aggregate([{ $match: { orderId: req.params.id } },
    {
        $lookup: {
            from: 'products',
            localField: 'Products._id',
            foreignField: '_id',
            as: 'NewOrders'
        }
    }
    ])
    res.render('order-details', { orderData, adminData: req.session.admin })
}

const orderStatus = async (req, res) => {
    try {
        console.log(req.body.status);
        const updateStatus = await order.updateOne({ _id: req.params.id },
            {
                $set:
                    { status: req.body.status }
            }
        );
        if (updateStatus) {
            res.json("success");
        }
    } catch (error) {
        console.log(error);
    }
}

//load coupon
const loadAddCoupon = async (req, res) => {
    try {
        res.render('addCoupon', { adminData: req.session.admin })
    } catch (error) {
        console.log(error.message);
    }
}

//add coupon
const addCoupon = async (req, res) => {
    try {
        const checkCoupon = await coupon.findOne({ categoryName: req.body.couponCode, is_valid: true })
        console.log(checkCoupon);
        if (checkCoupon == null) {
            const { couponCode, couponOffer, expiryDate } = req.body
            const Coupon = new coupon({
                couponCode: couponCode,
                couponOffer: couponOffer,
                expiryDate: expiryDate
            });
            const couponData = await Coupon.save();
            if (couponData) {
                res.redirect('/admin/coupon');
            }
            else { res.render('addCoupon', { error: 'Something went Wrong !!' }); }

        } else {
            res.render('addCoupon', { error: 'Category Already Exist', adminData: req.session.admin })
        }
    }
    catch (error) { console.log(error.message) }
}

//Coupon list
const couponList = async (req, res) => {
    try {
        const couponData = await coupon.find().lean().sort({_id:-1});

        res.render('coupon', { couponData, adminData: req.session.admin });
    } catch (error) {
        console.log(error.message);
    }
}

//activate coupon
const activateCoupon = async (req, res) => {
    try {
        const couponData = await coupon.updateOne({ _id: ObjectId(req.params.id) }, {
            $set: {
                is_valid: true
            }
        });
        res.redirect('/admin/coupon')
    }
    catch (error) { console.log(error.message) }
}

//deactivate coupon
const deactivateCoupon = async (req, res) => {
    try {
        const couponData = await coupon.updateOne({ _id: ObjectId(req.params.id) }, {
            $set: {
                is_valid: false
            }
        });
        res.redirect('/admin/coupon')
    }
    catch (error) { console.log(error.message) }
}

module.exports = {
    loadLogin,
    verifyLogin,
    loadDashboard,
    salesReport,
    revenueReport,
    logout,
    products,
    Addproductsload,
    Addproduct,
    editProduct,
    updateProduct,
    deleteProduct,
    productView,
    categoryList,
    addCategoryLoad,
    addCategory,
    editCategory,
    updateCategory,
    deleteCategory,
    LoadAllUsers,
    blockUser,
    unblockUser,
    orderlist,
    orderDetails,
    orderStatus,
    loadAddCoupon,
    addCoupon,
    couponList,
    activateCoupon,
    deactivateCoupon,
    timeSearch
}