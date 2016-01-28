# swagger-inputs-validator
[![npm version](https://badge.fury.io/js/swagger-inputs-validator.svg)](https://badge.fury.io/js/swagger-inputs-validator)
[![Travis Build Status](https://travis-ci.org/michwii/swagger-inputs-validator.svg?branch=master)](https://travis-ci.org/michwii/swagger-inputs-validator.svg?branch=master)

###About

Lightweight Express middleware that controls your incoming requests.
It will reject all requests that do not respect the requirements written in your swagger.

So far, the middleware is able to control the parameters present in :
* req.query
* req.params
* req.body

You have two ways of using this middleware :
* Control all the requests by using an application middleware
* Control a specific route by using a route middleware

### Installation
```Shell
$ npm install swagger-inputs-validator --save
```

###Examples

#####Controls your entire application : 
```JavaScript
var express = require('express');
var SwaggerValidator = require('swagger-inputs-validator');
var swaggerFile = require("./swagger.json");
var app = express();

var swaggerMiddleware = new SwaggerValidator(swaggerFile);

app.use(swaggerMiddleware.all());

app.get('/products', function(req,res){
  res.json({success: 'If you can enter here it seems that swagger validator let you get in'});
});

app.listen(80);

```

#####Controls a specific route :
```JavaScript
var express = require('express');
var SwaggerValidator = require('swagger-inputs-validator');
var swaggerFile = require("./swagger.json");
var app = express();

var swaggerMiddleware = new SwaggerValidator(swaggerFile);

app.get('/products', swaggerMiddleware.get('/products'), function(req,res){
  res.json({success: 'If you can enter here it seems that swagger validator let you get in'});
});

app.listen(80);

```

**Why would I use only a route middleware if I can control my entire app using swaggerMiddleware.all() ?**

You might want to implement this middleware progressively into your code. 
This is why, you would start by refractoring your code route by route instead of controlling your whole app.
Moreover, for tests purpose, you might want to disable some controls and let others active.


So far, you can use the route middleware with the following HTTP verbs : 
* GET
* POST
* PUT
* DELETE
* HEAD
* PATCH

### Options

When you are calling the constructor, you can specify options :
* **strict** : Default to false. When it's true, SwaggerInputsValidator will reject all the incoming parameters that are not specified in the swagger file 
* **onError** : a function that will handle your custom error behaviour

```JavaScript

var customErrorHandler = function(errors, req, res){
  res.status(400);//You could choose a custom error code
  res.json({message : "This message is coming from a custom error handler. Please find all your mistakes in the errors variable", errors : errors});
};

var swaggerMiddleware = new SwaggerValidator(swaggerFile, {strict : true, onError : customErrorHandler});
```

###Current release capabilities
- [x] Parse a swagger json file (2.0 specification)
- [x] checking parameters in req.query
- [x] checking parameters in req.body
- [x] checking parameters in req.params
- [ ] checking parameters in req.headers
- [x] checking optinal variables
- [x] checking variable types string | integer | double | boolean
- [x] checking object structure present within the body
- [ ] checking parameters in req.file
- [x] checking arrays
- [ ] checking string patterns (with RegExp)

We are currently working to enhance this middleware, any contribution is welcome :)

###Tests

Unit tests have been written using Mocha.
To launch them, please run the following command : 

```Shell
$ npm test
```
