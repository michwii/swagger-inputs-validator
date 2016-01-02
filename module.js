var fs = require("fs");

var SwaggerInputValidator = function(swagger, onError){
  if(swagger.paths){
    this._swaggerFile = swagger;
    if(onError && typeof onError != 'function'){
      throw new Error("The parameter onError in not a function");
    }else{
      this._onError = onError;
    }
  }else{
    console.error("SwaggerInputValidator:");
    throw new Error("The swagger specified is not correct. It do not contains any paths specification");
  }
};

SwaggerInputValidator.prototype.middleware = function(){
  return function(req, res, next){
    next();
  }
};

SwaggerInputValidator.prototype.onError = function(errors, req, res){
  this._onError(errors, req, res);
};


SwaggerInputValidator.prototype.get = function(url){
  url = url.replace(/:(\w+)/gi, function myFunction(x, y){
    return "{" + y + "}";
  });

  if(this._swaggerFile.paths[url] == undefined || this._swaggerFile.paths[url].get == undefined){
    console.error('The url ' + url + ' has not any get method defined within the swagger file');
    console.error("Closing the app...");
    process.exit(-1);
  }

  var parameters = this._swaggerFile.paths[url].get.parameters;
  if(parameters == undefined){
    parameters = [];
  }
  var thisReference = this;


  return function(req, res, next){

    var query = req.query;
    var params = req.params;
    var body = req.body;
    var errorsToReturn = new Array();
    for(var parameter of parameters){
      switch(parameter.in){
        case "query":
          if(query[parameter.name] == undefined){
            errorsToReturn.push(new Error("Parameter : " + parameter.name + " is not specified."));
          }
        break;
        case "path":
          if(params[parameter.name] == undefined){
            errorsToReturn.push(new Error("Parameter : " + parameter.name + "is not specified."));
          }
        break;
        case "body":
          if(body[parameter.name] == undefined){
            errorsToReturn.push(new Error("Parameter : " + parameter.name + "is not specified."));
          }
        break;
      }
    }
    if(errorsToReturn.length == 0){
      next();
    }else{
      res.status(400);
      if(thisReference._onError){
        thisReference.onError(errorsToReturn, req, res);
      }else{
        next(errorsToReturn);
      }
    }
  };
};

SwaggerInputValidator.prototype.post = function(url){

};

SwaggerInputValidator.prototype.put = function(url){

};

SwaggerInputValidator.prototype.delete = function(url){

};



exports = module.exports = SwaggerInputValidator;
