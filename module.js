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
      this._parsingParameters = new Array();
      var thisReference = this;
      Object.keys(swagger.paths).forEach(function (url) {
        var variableNames = new Array();
        var customRegex = url.replace(/{(\w+)}/gi, function myFunction(wholeString, variableName){
          variableNames.push(variableName);
          return "(\\w+)";
        });
        thisReference._parsingParameters.push({regexp : customRegex, variables : variableNames, swaggerPath : url});
      });
      //End creation array of regular expression

    }
  }else{
    throw new Error("The swagger specified is not correct. It do not contains any paths specification");
  }
};

//Private method
var onError = function(errors, req, res){
  this._onError(errors, req, res);
};

//Private method
var getPathParametersFromUrl = function(url, parsingParameters){
  var pathParameters = {};
  for(var variable of parsingParameters.variables){
    pathParameters[variable] = url.match(parsingParameters.regexp)[1];
  }
  return pathParameters;
};

//Private method
var getParsingParameters = function(url){
  var swaggerPath = null;
  for(var i = 0; i < this._parsingParameters.length; i++){
    var regularExpression = this._parsingParameters[i].regexp;
    var match = url.match(new RegExp(regularExpression + '/?(\\?[^/]+)?$', 'gmi'));
    if(match){
      if(swaggerPath){//If we enter here it means that we detected duplicated entries for the regular expression. It means that the regular expression for url parsing must be reviewed.
        throw new Error('Duplicate swagger path for this url. Please signal this bug.');
      }else{
        return this._parsingParameters[i];
      }
    }
  }
}

SwaggerInputValidator.prototype.all = function(){
  var thisReference = this;
  return function(req, res, next){
    var verb = req.method;
    var url = req.url;
    var parsingParameters = getParsingParameters.call(thisReference, url);

    //If no parsing parameters are found, is either because their is no swagger path available for the requested url
    //Or the app will return an 404 error code.
    if(parsingParameters == null){
      next();
      return;
    }

    var swaggerParameters = thisReference.getRequiredParameters(verb, parsingParameters.swaggerPath);

    var queryParameters = req.query;
    var pathParameters = getPathParametersFromUrl.call(thisReference, url, parsingParameters);
    //In get request, the body equals to null, this is why we need to instanciate it to {}
    var bodyParameters = (req.body) ? req.body : {};

    var errorsToReturn = getErrors.call(thisReference, swaggerParameters, queryParameters, pathParameters, bodyParameters);

    if(errorsToReturn.length == 0){
      next();
    }else{
      res.status(400);
      if(thisReference._onError){
        //We call the onError private method giving him a context. This is why we are using onError.call
        onError.call(thisReference, errorsToReturn, req, res);
      }else{
        next(errorsToReturn);
      }
    }
  };
};

//private method
var getErrors = function(swaggerParameters, queryParameters, pathParameters, bodyParameters){
  var thisReference = this;

  var errorsToReturn = new Array();
  //We verify that each required parameter within the swagger file is present within the request
  for(var parameter of swaggerParameters){
    switch(parameter.in){
      case "query":
        if(queryParameters[parameter.name] == undefined && parameter.required == true){
          errorsToReturn.push(new Error("Parameter : " + parameter.name + " is not specified."));
        }
      break;
      case "path":
        if(pathParameters[parameter.name] == undefined && parameter.required == true){
          errorsToReturn.push(new Error("Parameter : " + parameter.name + " is not specified."));
        }
      break;
      case "body":
        if(bodyParameters[parameter.name] == undefined && parameter.required == true){
          errorsToReturn.push(new Error("Parameter : " + parameter.name + " is not specified."));
        }
      break;
    }
  }

  //If the _strict parameter is specified, we do the verification the other way around also.
  //We verify that each parameter in the request is present within the swagger file
  if(this._strict){
    var isPresentWithinTheSwagger = function(whereToSearch, variableName){
      for(var parameter of swaggerParameters){
        if(parameter.in == whereToSearch && parameter.name == variableName){
          return true;
        }
      }
      return false;
    }

    Object.keys(queryParameters).forEach(function (variableName, index) {
        if(!isPresentWithinTheSwagger("query", variableName)){
          errorsToReturn.push(new Error("Parameter : " + variableName + " should not be specified."));
        }
    });

    Object.keys(pathParameters).forEach(function (variableName, index) {
        if(!isPresentWithinTheSwagger("path", variableName)){
          errorsToReturn.push(new Error("Parameter : " + variableName + " should not be specified."));
        }
    });

    Object.keys(bodyParameters).forEach(function (variableName, index) {
        if(!isPresentWithinTheSwagger("body", variableName)){
          errorsToReturn.push(new Error("Parameter : " + variableName + " should not be specified."));
        }
    });
  }
  return errorsToReturn;
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

    var queryParameters = req.query;
    var pathParameters = req.params;
    //In get request, the body equals to null, this is why we need to instanciate it to {}
    var bodyParameters = (req.body) ? req.body : {};

    var errorsToReturn = getErrors.call(thisReference, parameters, queryParameters, pathParameters, bodyParameters);

    if(errorsToReturn.length == 0){
      next();
    }else{
      res.status(400);
      if(thisReference._onError){
        //We call the onError private method giving him a context. This is why we are using onError.call
        onError.call(thisReference, errorsToReturn, req, res);
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
    throw new Error('Their is no swagger entries for the url : ' + url + 'with the HTTP verb : '+ verb);
    return [];
  }

  var parameters = this._swaggerFile.paths[url][verb].parameters;

  if(parameters == undefined){
    parameters = [];
  }

  return parameters;
};


exports = module.exports = SwaggerInputValidator;
