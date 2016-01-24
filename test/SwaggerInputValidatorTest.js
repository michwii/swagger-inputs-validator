var request = require('supertest');
var express = require('express');
var assert = require('assert');
var bodyParser = require('body-parser');

var swaggerInputValidator = require('../module.js');

describe('Wrong instanciations', function() {
  var swaggerFile;
  before(function(){
    swaggerFile = require('./../swagger-examples/UberAPI.json');
  });

  it('should crash if no swagger object is specified', function(done){
    assert.throws(function(){
      new swaggerInputValidator();
    });
    done();
  });
  it('should crash if bad swagger file is specified', function(done){
    assert.throws(function(){
      new swaggerInputValidator("fake object");
    });
    done();
  });
  it('should crash if swagger file without paths variable is specified', function(done){
    assert.throws(function(){
      new swaggerInputValidator({
        "swagger": "2.0",
        "info": {
            "title": "Uber API",
            "description": "Move your app forward with the Uber API",
            "version": "1.0.0"
        },
        "host": "api.uber.com",
        "schemes": [
            "https"
        ],
        "basePath": "/v1",
        "produces": [
            "application/json"
        ]
      });
    });
    done();
  });
  it('should crash if bad option object is passed', function(done){
    assert.throws(function(){
      new swaggerInputValidator(swaggerFile, "wrong option parameter");
    });
    done();
  });
  it('should crash if bad option.onError function is passed', function(done){
    assert.throws(function(){
      new swaggerInputValidator(swaggerFile, {onError:"wrong option.onError parameter"});
    });
    done();
  });
  it('should crash if bad option.strict variable is passed', function(done){
    assert.throws(function(){
      new swaggerInputValidator(swaggerFile, {strict:"wrong option.success parameter"});
    });
    done();
  });
});

describe('good instanciation', function() {

  var swaggerFile;
  before(function(){
    swaggerFile = require('./../swagger-examples/UberAPI.json');
  });

  it('should NOT crash if valid swagger is passed', function(done){
    new swaggerInputValidator(swaggerFile);
    done();
  });
  it('should NOT crash if valid swagger is passed + valid onError function', function(done){
    new swaggerInputValidator(swaggerFile, {onError: function(errors, req, res){}});
    done();
  });
  it('should NOT crash if valid swagger is passed + valid strict variable', function(done){
    new swaggerInputValidator(swaggerFile, {strict: false});
    done();
  });
  it('should NOT crash if valid swagger is passed + valid strict variable + valid onError function', function(done){
    new swaggerInputValidator(swaggerFile, {strict: false, onError: function(errors, req, res){}});
    done();
  });
});

describe('When parameters are missing', function(){
  var server;
  before(function(){
    swaggerFile = require('./../swagger-examples/UberAPI.json');
  });

  it('should return an HTTP 400 code when only one parameter is missing (GET/query)', function(done){
    server = createFakeServer(new swaggerInputValidator(swaggerFile).get("/products"));
    request.agent(server)
    .get('/v1/products?longitude=50')
    .expect(400, "Error: Parameter : latitude is not specified.\n")
    .end(done);
  });

  it('should return an HTTP 400 code when only one parameter is missing (GET/query)', function(done){
    server = createFakeServer(new swaggerInputValidator(swaggerFile).get("/products"));
    request.agent(server)
    .get('/v1/products?latitude=50')
    .expect(400, "Error: Parameter : longitude is not specified.\n")
    .end(done);
  });

  it('should return an HTTP 400 code when all parameters are missing (GET/query)', function(done){
    server = createFakeServer(new swaggerInputValidator(swaggerFile).get("/products"));
    request.agent(server)
    .get('/v1/products')
    .expect(400, "Error: Parameter : latitude is not specified.,Error: Parameter : longitude is not specified.\n")
    .end(done);
  });

  it('should return an HTTP 400 code when parameters are missing (POST / query + formData)', function(done){
    server = createFakeServer(new swaggerInputValidator(swaggerFile).post("/users"));
    request.agent(server)
    .post('/v1/users?name=Bart')
    .set('Content-Type', 'application/json')
    .send({age : 9})
    .expect(400, "Error: Parameter : surname is not specified.,Error: Parameter : sister is not specified.\n")
    .end(done);
  });

  it('should return an HTTP 400 code when parameters are missing (PUT / query + formData)', function(done){
    server = createFakeServer(new swaggerInputValidator(swaggerFile).put("/users"));
    request.agent(server)
    .put('/v1/users?surname=Simpson')
    .set('Content-Type', 'application/json')
    .send({sister : 'Lisa'})
    .expect(400, "Error: Parameter : name is not specified.,Error: Parameter : age is not specified.\n")
    .end(done);
  });

  it('should return an HTTP 400 code when parameters are missing (DELETE / query)', function(done){
    server = createFakeServer(new swaggerInputValidator(swaggerFile).delete("/users"));
    request.agent(server)
    .delete('/v1/users?surname=Simpson')
    .expect(400, "Error: Parameter : name is not specified.\n")
    .end(done);
  });

});

describe('format testing', function(){
  it('should block request waiting for a non proper double', function(done){
    server = createFakeServer(new swaggerInputValidator(swaggerFile).get("/products"));
    request.agent(server)
    .get('/v1/products?longitude=50.0.0&latitude=50')
    .expect(400, "Error: Parameter : longitude does not respect its type.\n")
    .end(done);
  });

  it('should block request waiting for double and sending instead string', function(done){
    server = createFakeServer(new swaggerInputValidator(swaggerFile).get("/products"));
    request.agent(server)
    .get('/v1/products?longitude=should not work&latitude=50')
    .expect(400, "Error: Parameter : longitude does not respect its type.\n")
    .end(done);
  })

  it('should block request waiting for integer and sending a float', function(done){
    server = createFakeServer(new swaggerInputValidator(swaggerFile).get("/products"));
    request.agent(server)
    .get('/v1/products?longitude=50&latitude=50&optionalInt=50.50')
    .expect(400, "Error: Parameter : optionalInt does not respect its type.\n")
    .end(done);
  })

  it('should block request waiting for integer and sending a string', function(done){
    server = createFakeServer(new swaggerInputValidator(swaggerFile).get("/products"));
    request.agent(server)
    .get('/v1/products?longitude=50&latitude=50&optionalInt=shouldGoInError')
    .expect(400, "Error: Parameter : optionalInt does not respect its type.\n")
    .end(done);
  })

  it('should block request waiting for integer (in formData) and sending a string', function(done){
    server = createFakeServer(new swaggerInputValidator(swaggerFile).post("/users"));
    request.agent(server)
    .post('/v1/users?name=Bart&surname=Simpson')
    .set('Content-Type', 'application/json')
    .send({sister : "Lisa", age : "should be an int"})
    .expect(400, "Error: Parameter : age does not respect its type.\n")
    .end(done);
  })

  it('should block request waiting for an int (in path) and sending a string', function(done){
    var app = express();
    app.get('/v1/users/:id', new swaggerInputValidator(swaggerFile).get("/users/:id"), function(req, res){
      res.status(200).json({ success: 'If you can enter here, it means that the swagger middleware let you do so' });
    });

    request.agent(app)
    .get('/v1/users/ShouldNotWork')
    .expect(400, "Error: Parameter : id does not respect its type.\n")
    .end(done);
  })

  it('should block request waiting for boolean (in formData) and sending a string', function(done){
    server = createFakeServer(new swaggerInputValidator(swaggerFile).post("/users"));
    request.agent(server)
    .post('/v1/users?name=Bart&surname=Simpson')
    .set('Content-Type', 'application/json')
    .send({sister : 'Lisa', age : '10', optionalBoolean : 'shouldNotWork'})
    .expect(400, "Error: Parameter : optionalBoolean does not respect its type.\n")
    .end(done);
  })

  it('should NOT block request waiting for boolean (as formData) and sending a string which looks like a boolean', function(done){
    server = createFakeServer(new swaggerInputValidator(swaggerFile).post("/users"));
    request.agent(server)
    .post('/v1/users?name=Bart&surname=Simpson')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({sister : 'Lisa', age : '10', optionalBoolean : 'true'})
    .expect(200, { success: 'If you can enter here, it means that the swagger middleware let you do so' })
    .end(done);
  })

  it('should block request when complex object is sent within the body and don\'t respect its type', function(done){
    server = createFakeServer(new swaggerInputValidator(swaggerFile).post("/estimates/time"));
    request.agent(server)
    .post('/v1/estimates/time')
    .set('Content-Type', 'application/json')
    .send({time : {code : "wrongType", message : "message", fields : "fields"}})
    .expect(400, "Error: Parameter : time does not respect its type.\n")
    .end(done);
  })

  it('should block request when complex object is sent within the body and don\'t respect its type (second level)', function(done){
    server = createFakeServer(new swaggerInputValidator(swaggerFile).post("/estimates/time"));
    request.agent(server)
    .post('/v1/estimates/time')
    .set('Content-Type', 'application/json')
    .send({time : {code : "wrongType", message : "message", fields : "fields"}})
    .expect(400, "Error: Parameter : time does not respect its type.\n")
    .end(done);
  })

  it('should block request when complex object is sent within the body and don\'t respect its type (second level)', function(done){
    server = createFakeServer(new swaggerInputValidator(swaggerFile).post("/estimates/time"));
    request.agent(server)
    .post('/v1/estimates/time')
    .set('Content-Type', 'application/json')
    .send({time : {code : 30, message : "message", fields : "fields", optional : {
      sub_prop1:"goodType",
      sub_prop2 : "WrongType"
    }}})
    .expect(400, "Error: Parameter : time does not respect its type.\n")
    .end(done);
  })

})

describe('Custom errorHandling', function(){
  var server;
  before(function(){
    swaggerFile = require('./../swagger-examples/UberAPI.json');
    var customOnError = function(errors, req, res){
      res.status(501).json({error : "Custom Error"});
    };
    server = createFakeServer(new swaggerInputValidator(swaggerFile, {onError: customOnError}).get("/products"));
  });

  it('should return an HTTP 501 code when all parameters are missing', function(done){
    request.agent(server)
    .get('/v1/products')
    .expect(501, {error : "Custom Error"})
    .end(done);
  });

  it('should return an HTTP 501 code when only one parameter is missing', function(done){
    request.agent(server)
    .get('/v1/products?longitude=50')
    .expect(501, {error : "Custom Error"})
    .end(done);
  });

  it('should return an HTTP 501 code when only one parameter is missing', function(done){
    request.agent(server)
    .get('/v1/products?latitude=50')
    .expect(501, {error : "Custom Error"})
    .end(done);
  });
});

describe('strict / no strict mode', function(){
  var server;
  before(function(){
    swaggerFile = require('./../swagger-examples/UberAPI.json');
    serverInStrictMode = createFakeServer(new swaggerInputValidator(swaggerFile, {strict: true}).get("/products"));
    serverNotInStrictMode = createFakeServer(new swaggerInputValidator(swaggerFile, {strict: false}).get("/products"));
  });

  it('should return an HTTP 200 code when extra is provided and strict = false', function(done){
    request.agent(serverNotInStrictMode)
    .get('/v1/products?longitude=50&latitude=50&extraParameter=shouldNotWork')
    .expect(200, { success: 'If you can enter here, it means that the swagger middleware let you do so' })
    .end(done);
  });

  it('should return an HTTP 400 code when extra parameters are provided and strict = true', function(done){
    request.agent(serverInStrictMode)
    .get('/v1/products?longitude=50&latitude=50&extraParameter=shouldNotWork')
    .expect(400, "Error: Parameter : extraParameter should not be specified.\n")
    .end(done);
  });

});

describe('Parameter that are not required', function(){
  var server;
  before(function(){
    swaggerFile = require('./../swagger-examples/UberAPI.json');
    serverInStrictMode = createFakeServer(new swaggerInputValidator(swaggerFile, {strict: true}).get("/products"));
    serverNotInStrictMode = createFakeServer(new swaggerInputValidator(swaggerFile, {strict: false}).get("/products"));
  });

  it('should return an HTTP 200 code when optional parameter is provided in strict mode', function(done){
    request.agent(serverInStrictMode)
    .get('/v1/products?longitude=50&latitude=50&optional=IamOptionalButPresentWithinTheSwaggerFile')
    .expect(200, { success: 'If you can enter here, it means that the swagger middleware let you do so' })
    .end(done);
  });

  it('should return an HTTP 200 code when optional parameter is provided not in strict mode', function(done){
    request.agent(serverNotInStrictMode)
    .get('/v1/products?longitude=50&latitude=50&optional=IamOptionalButPresentWithinTheSwaggerFile')
    .expect(200, { success: 'If you can enter here, it means that the swagger middleware let you do so' })
    .end(done);
  });

  it('should return an HTTP 200 code when optional parameter is not provided in strict mode', function(done){
    request.agent(serverInStrictMode)
    .get('/v1/products?longitude=50&latitude=50')
    .expect(200, { success: 'If you can enter here, it means that the swagger middleware let you do so' })
    .end(done);
  });

  it('should return an HTTP 200 code when optional parameter is not provided not in strict mode', function(done){
    request.agent(serverNotInStrictMode)
    .get('/v1/products?longitude=50&latitude=50')
    .expect(200, { success: 'If you can enter here, it means that the swagger middleware let you do so' })
    .end(done);
  });

  it('should not block request when complex object is sent within the body without specifying an optional property', function(done){
    server = createFakeServer(new swaggerInputValidator(swaggerFile).post("/estimates/time"));
    request.agent(server)
    .post('/v1/estimates/time')
    .set('Content-Type', 'application/json')
    .send({time : {code : 10, message : "message", fields : "fields"}})
    .expect(200, { success: 'If you can enter here, it means that the swagger middleware let you do so' })
    .end(done);
  })

});


describe('All parameters provided', function(){
  var server;
  before(function(){
    swaggerFile = require('./../swagger-examples/UberAPI.json');
    server = createFakeServer(new swaggerInputValidator(swaggerFile).get("/products"));
  });

  it('should return an HTTP 200 code when all parameters are provided in query', function(done){
    request.agent(server)
    .get('/v1/products?longitude=50&latitude=50')
    .expect(200, { success: 'If you can enter here, it means that the swagger middleware let you do so' })
    .end(done);
  });

  it('should return an HTTP 200 code when one parameter is provided in path', function(done){

    var app = express();
    app.get('/v1/user/:id', new swaggerInputValidator(swaggerFile, {strict: true}).get("/users/:id"), function(req, res){
      res.status(200).json({ success: 'If you can enter here, it means that the swagger middleware let you do so' });
    });

    request.agent(app)
    .get('/v1/user/50')
    .expect(200, { success: 'If you can enter here, it means that the swagger middleware let you do so' })
    .end(done);
  });

  it('should return an HTTP 200 code when optional parameter is provided also in query', function(done){
    request.agent(server)
    .get('/v1/products?longitude=50&latitude=50&optional=IamOptionalButPresentWithinTheSwaggerFile')
    .expect(200, { success: 'If you can enter here, it means that the swagger middleware let you do so' })
    .end(done);
  });

  it('should return an HTTP 200 code in POST (query + formData)', function(done){
    server = createFakeServer(new swaggerInputValidator(swaggerFile).post("/users"));
    request.agent(server)
    .post('/v1/users?name=Bart&surname=Simpson')
    .set('Content-Type', 'application/json')
    .send({age : 9, sister: "Lisa Simpson"})
    .expect(200, { success: 'If you can enter here, it means that the swagger middleware let you do so' })
    .end(done);
  });

  it('should return an HTTP 200 code in POST (query + formData)', function(done){
    server = createFakeServer(new swaggerInputValidator(swaggerFile).put("/users"));
    request.agent(server)
    .put('/v1/users?name=Bart&surname=Simpson')
    .set('Content-Type', 'application/json')
    .send({age : 9, sister: "Lisa Simpson"})
    .expect(200, { success: 'If you can enter here, it means that the swagger middleware let you do so' })
    .end(done);
  });

});

describe('Control all requests',function(){
  var server;
  before(function(){
    var middleware = new swaggerInputValidator(swaggerFile);
    server = createFakeServer(middleware.all());
  });

  it('Should accept the request when path parameter is correct', function(done){
    request.agent(server)
    .get('/v1/users/50')
    .expect(200)
    .end(done);
  })

  it('Should reject the request when a query parameter is missing', function(done){
    request.agent(server)
    .get('/v1/products?latitude=50')
    .expect(400)
    .end(done);
  })

  it('Should reject the request when a formData parameter is missing', function(done){
    request.agent(server)
    .post('/v1/users?name=Bart&surname=Simpson')
    .set('Content-Type', 'application/json')
    .send({age : 9})
    .expect(400)
    .end(done);
  })

  it('Should return 404 when asking unknown url', function(done){
    request.agent(server)
    .get('/urlThatDoesNotExist')
    .expect(404)
    .end(done);
  })


});

function createFakeServer(swaggerMiddleware){
  var app = express();

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(swaggerMiddleware);

  app.use(function(req, res){
    if(req.url == "/urlThatDoesNotExist"){
      res.status(404).json({ success: 'If you can enter here, it means that the swagger middleware let you do so' });
    }else{
      res.status(200).json({ success: 'If you can enter here, it means that the swagger middleware let you do so' });
    }
  });

  return app;
};
