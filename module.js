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
          throw new Error("The parameter onError in not a function");
        }else{
          this._onError = onError;
        }

        if(strict && typeof strict != 'boolean'){
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
  var requiredParameters = this.getRequiredParameters("get", url);
  return this.getGeneriqueMiddleware(requiredParameters);
};

SwaggerInputValidator.prototype.post = function(url){
  var requiredParameters = this.getRequiredParameters("post", url);
  return this.getGeneriqueMiddleware(requiredParameters);
};

SwaggerInputValidator.prototype.put = function(url){
  var requiredParameters = this.getRequiredParameters("put", url);
  return this.getGeneriqueMiddleware(requiredParameters);
};

SwaggerInputValidator.prototype.delete = function(url){
  var requiredParameters = this.getRequiredParameters("delete", url);
  return this.getGeneriqueMiddleware(requiredParameters);
};

SwaggerInputValidator.prototype.getGeneriqueMiddleware = function(parameters){

  var thisReference = this;
  return function(req, res, next){

    var query = req.query;
    var params = req.params;
    //In get request, the body equals to null, this is why we need to instanciate it to {}
    var body = (req.body) ? req.body : {};

    var errorsToReturn = new Array();
    //We verify that each required parameter within the swagger file is present within the request
    for(var parameter of parameters){
      switch(parameter.in){
        case "query":
          if(query[parameter.name] == undefined && parameter.required == true){
            errorsToReturn.push(new Error("Parameter : " + parameter.name + " is not specified."));
          }
        break;
        case "path":
          if(params[parameter.name] == undefined && parameter.required == true){
            errorsToReturn.push(new Error("Parameter : " + parameter.name + " is not specified."));
          }
        break;
        case "body":
          if(body[parameter.name] == undefined && parameter.required == true){
            errorsToReturn.push(new Error("Parameter : " + parameter.name + " is not specified."));
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

SwaggerInputValidator.prototype.getRequiredParameters = function(verb, url){
  url = url.replace(/:(\w+)/gi, function myFunction(x, y){
    return "{" + y + "}";
  });

  if(this._swaggerFile.paths[url] == undefined || this._swaggerFile.paths[url][verb] == undefined){
    throw new Error('The url ' + url + ' has not any '+verb+' method defined within the swagger file');
  }

  var parameters = this._swaggerFile.paths[url][verb].parameters;
  if(parameters == undefined){
    parameters = [];
  }

  return parameters;

};


exports = module.exports = SwaggerInputValidator;