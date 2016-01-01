var express = require("express");
var SwaggerInputValidator = require('./module');
var app = express();

SwaggerInputValidator.use('./swagger-examples/UberAPI.json', function(errors, req, res){
  res.status = 400;
  errorToSend = "<html>";
  errorToSend += "BAD REQUEST <br/>";
  for(var error of errors){
    errorToSend += "" + error + "<br/>";
  }
  errorToSend +="</html>"
  res.end(errorToSend);
});

app.get('/test', SwaggerInputValidator.get("/estimates/price"), function(req, res){
  res.json({success : "ok"});
});

app.listen(80);
