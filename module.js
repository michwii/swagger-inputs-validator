var fs = require("fs");

var SwaggerInputValidator = function(swagger, options){
  if(swagger.paths){
    this._swaggerFile = swagger;
    if(options && typeof options != 'object'){
      throw new Error("The parameter option in not an object");
    }else{
      if(options){
        var onError = options.onError;
        var strict = options.strict;
        if(onError && typeof onError != 'function'){
          console.error("SwaggerInputValidator:");
          throw new Error("The parameter onError in not a function");
        }else{
          this._onError = onError;
        }

        if(strict && typeof strict != 'boolean'){
          console.error("SwaggerInputValidator:");
          throw new Error("The parameter strict in not a boolean");
        }else{
          this._strict = strict;
        }
      }
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
    console.error("SwaggerInputValidator:");
    throw new Error('The url ' + url + ' has not any get method defined within the swagger file');
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
    //We verify that each required parameter within the swagger file is present within the request
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

    //If the _strict parameter is specified, we do the verification the other way around also.
    //We verify that each parameter in the request is present within the swagger file
    if(thisReference._strict){

      var isPresentWithinTheSwagger = function(whereToSearch, variableName){
        for(var parameter of parameters){
          if(parameter.in == whereToSearch && parameter.name == variableName){
            return true;
          }
        }
        return false;
      }

      Object.keys(query).forEach(function (variableName, index) {
          if(!isPresentWithinTheSwagger("query", variableName)){
            errorsToReturn.push(new Error("Parameter : " + variableName + " should not be specified."));
          }
      });

      Object.keys(params).forEach(function (variableName, index) {
          if(!isPresentWithinTheSwagger("path", variableName)){
            errorsToReturn.push(new Error("Parameter : " + variableName + " should not be specified."));
          }
      });

      Object.keys(body).forEach(function (variableName, index) {
          if(!isPresentWithinTheSwagger("body", variableName)){
            errorsToReturn.push(new Error("Parameter : " + variableName + " should not be specified."));
          }
      });
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
