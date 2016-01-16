# swagger-inputs-validator
[![npm version](https://badge.fury.io/js/swagger-inputs-validator.svg)](https://badge.fury.io/js/swagger-inputs-validator)
[![Travis Build Status](https://travis-ci.org/michwii/swagger-inputs-validator.svg?branch=master)](https://travis-ci.org/michwii/swagger-inputs-validator.svg?branch=master)

###About

Lightweight Express middleware that controls your incoming requests.
It will reject all requests that do not respect the requirements writen in your swagger.

So far, the middleware is able to control the parameters present in :
*req.query
*req.params
*req.body
*req.headers

You have two ways of using this middleware :
Control all the requests by using an application middleware
Control a specific route by using a route middleware

### Installation
```
$ npm install swagger-inputs-validator --save
```

###Examples
Control a specific route :
```JavaScript
var express = require('express');
var SwaggerValidator = require('swagger-inputs-validator');
var swaggerFile = require("./swagger.json");
var app = express();

var middleware = new SwaggerValidator(swaggerFile);

app.get('/products', middleware.get('/products'), function(req,res){
  res.json({success: 'If you can enter here it seems that swagger validator let you get in'});
})

app.listen(80)

```

Control your entire application : 
```JavaScript
var express = require('express');
var SwaggerValidator = require('swagger-inputs-validator');
var swaggerFile = require("./swagger.json");
var app = express();

var middleware = new SwaggerValidator(swaggerFile);

app.use(middleware.all());

app.get('/products', function(req,res){
  res.json({success: 'If you can enter here it seems that swagger validator let you get in'});
})

app.listen(80)

```
