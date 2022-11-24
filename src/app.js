const express = require('express');
const cors = require('cors');
const router = require('./routes/routesConfig');
const app = express();
var morgan = require('morgan')

//learn how to do dependency injection for db testing


//settings
app.set('port', process.env.PORT || 4000);


//middlewares
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
//Logger HTTP request
app.use(morgan('dev'))
//for the future maybe include hetmet module for more security in header, see doc .Dcarrillo


//router
router(app);

module.exports = app;