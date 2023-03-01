const mongoose = require('mongoose');
mongoose.set("strictQuery", false);
mongoose.connect('mongodb://127.0.0.1:27017/user-management-system', { useNewUrlParser: true });

const express = require('express');
const path = require('path');
const hbs = require('express-handlebars');
const app = express();
const session = require('./config/session');
const nocache = require("nocache");
const Handlebars =require('handlebars');
const moment = require ('moment');


app.use(nocache());
app.use(session);

app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({
  extname: 'hbs',
  defaultLayout: 'adminLayout', 
  layoutsDir: __dirname + '/views/admin',
  adminDir: __dirname + '/views/admin/'
}))

Handlebars.registerHelper('ifeq', function (a, b, options) {
  if (a == b) { return options.fn(this); }
  return options.inverse(this);
});

Handlebars.registerHelper('ifnoteq', function (a, b, options) {
  if (a != b) { return options.fn(this); }
  return options.inverse(this);
});

var DateFormats = {
  short: "DD MMMM - YYYY",
  long: "dddd DD.MM.YYYY HH:mm"
};


  Handlebars.registerHelper("formatDate", function(datetime, format) {
    if (moment) {
      // can use other formats like 'lll' too
      format = DateFormats[format] || format;
      return moment(datetime).format(format);
    }
    else {
      return datetime;
    }
  });


//for user routes
const userRoute = require('./routes/user')
app.use('/', userRoute)

//for admin routes
const adminRoute = require('./routes/admin');
app.use('/admin', adminRoute);

app.use(function(req, res, next) {
  res.status(404).render('error');
});

app.listen(3000, function () {
  console.log('Server is running...');
});
