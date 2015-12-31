# swagger-input-validator
Lightweight Express middleware that allows the validation of incoming parameters.

Basic example :
```
var express = require("express");
var swaggerValidator = require("swagger-input-validator");
var app = express();

swaggerValidator.use('PATH_OF_YOUR_SWAGGER_FILE.json');

app.use(swaggerValidator);

app.get('/users/:id', function(req, res){
  //Will enter here only if all the parameters specified within the swagger are correct.
  res.json({ok : true});
})

var server = app.listen(80);
```
