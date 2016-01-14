# swagger-inputs-validator


###About

Lightweight Express middleware that allows the parameter validations coming to your routes.

You have two ways of using this middleware :
Control all the requests by using an application middleware
Control a specific route by using a route middleware

### Installation
```
npm install swagger-inputs-validator --save
```

###Examples
Control a specific route :
```
var express = require('express');
var SwaggerValidator = require('swagger-inputs-validator');
var swaggerFile = require("./swagger.json");
var app = express();

var middleware = new SwaggerValidator(swaggerFile);

app.get('/products', middleware.get('/products'), function(req,res){
  res.json({success: 'If you can enter here it seems that sawgger validator let you get in'});
})

app.listen(80)

```

Control your entire application : 
```
var express = require('express');
var SwaggerValidator = require('swagger-inputs-validator');
var swaggerFile = require("./swagger.json");
var app = express();

var middleware = new SwaggerValidator(swaggerFile);

app.use(middleware.all());

app.get('/products', function(req,res){
  res.json({success: 'If you can enter here it seems that sawgger validator let you get in'});
})

app.listen(80)

```
