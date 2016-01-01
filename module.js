var fs = require("fs");

var SwaggerInputValidator = function(){
  this._allGetUrls = {};
  this._allPostUrls = {};
  this._allPutUrls = {};
  this._allDeleteUrls = {};
};


SwaggerInputValidator.prototype.use = function(urlSwagger, onError){
  try{
    //As we are accessing this file only once at the creation of the server, there is no need for an asyncronous call
    fs.accessSync(urlSwagger, fs.R_OK);
  }catch(e){
    console.error("SwaggerInputValidator:");
    console.error("File ("+urlSwagger+") does not exist or the app does not have the authorisation requiered to access to it");
    console.error("Closing the app...");
    process.exit(-1);
  }
  this._swaggerFile = require(urlSwagger);
  this._onError = onError;
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



exports = module.exports = new SwaggerInputValidator();
