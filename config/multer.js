const multer = require("multer");
const path = require("path");

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

module.exports = {
    productUpload,
    categoryUpload
}