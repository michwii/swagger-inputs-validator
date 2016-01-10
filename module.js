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

      //Now we create an array of regular expressions that we are going to check whenever a request is coming to the app.
      this._regularExpressions = new Array();
      this._variableNames = new Array();
      var thisReference = this;
      Object.keys(swagger.paths).forEach(function (url) {
        thisReference._variableNames.push(new Array());
        var customRegex = url.replace(/{(\w+)}/gi, function myFunction(wholeString, variableName){
          var whereToPutMyVariables = thisReference._variableNames[thisReference._variableNames.length - 1];
          whereToPutMyVariables.push(variableName);
          return "(\\w+)";
        });
        thisReference._regularExpressions.push(customRegex);
      });
      //End creation array of regular expression

    }
  }else{
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

SwaggerInputValidator.prototype.all = function(){
  var thisReference = this;
  return function(req, res, next){
    console.log(thisReference.getRequiredParameters(req.method, req.url));
    next();
  };
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
  verb = verb.toLowerCase();

  //If parameter is undefined it is either because the user asked for an url which is not present within the swagger file or because the url contains parameters
  //Ex : /users/50 ==> correspond to this url in the swagger /users/{id}
  //We then need to iterate on all the urls specified within the swagger file and see if we have an url that match
  if(this._swaggerFile.paths[url] == undefined || this._swaggerFile.paths[url][verb] == undefined){
    Object.keys(this._swaggerFile.paths).forEach(function (path, index) {

      var variableNames = new Array();
      customRegex = path.replace(/{(\w+)}/gi, function myFunction(x, y){
        variableNames.push(y);
        return "(\\w+)";
      });

      var finalUrl = url.replace(new RegExp(customRegex, 'gi'), function myFunction(){
        var wholeString = arguments[0];
        for(var i = 1; i < arguments.length -2 ; i++){
          wholeString = wholeString.replace(arguments[i], "{" + variableNames.shift() + "}")
        }
        return wholeString;
      });

      console.log(finalUrl);

    });
    return {};
  }

  var parameters = this._swaggerFile.paths[url][verb].parameters;

  if(parameters == undefined){
    parameters = [];
  }

  return parameters;
};


exports = module.exports = SwaggerInputValidator;
