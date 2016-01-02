var request = require('supertest');
var express = require('express');
var assert = require('assert');
var http = require('http');
var bodyParser = require('body-parser');

var swaggerInputValidator = require('../module.js');


describe('Wrong instanciation', function() {
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
  it('should crash if bad onError function is passed', function(done){
    assert.throws(function(){
      new swaggerInputValidator(swaggerFile, "wrong onErrorParameter");
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
    new swaggerInputValidator(swaggerFile, function(errors, req, res){});
    done();
  });
});

describe('missing parameters', function(){
  var server;
  before(function(){
    swaggerFile = require('./../swagger-examples/UberAPI.json');
    server = createFakeServer(new swaggerInputValidator(swaggerFile).get("/products"));
  });

  it('should return an HTTP 400 code when all parameters are missing', function(done){
    request.agent(server)
    .get('/products')
    .expect(400)
    .end(done);
  });

  it('should return an HTTP 400 code when only one parameter is missing', function(done){
    request.agent(server)
    .get('/products?longitude=50')
    .expect(400, "Error: Parameter : latitude is not specified.\n")
    .end(done);
  });
  
  it('should return an HTTP 400 code when only one parameter is missing', function(done){
    request.agent(server)
    .get('/products?latitude=50')
    .expect(400, "Error: Parameter : longitude is not specified.\n")
    .end(done);
  });
});

describe('missing parameters with custom errorHandling', function(){
  var server;
  before(function(){
    swaggerFile = require('./../swagger-examples/UberAPI.json');
    server = createFakeServer(new swaggerInputValidator(swaggerFile, function(errors, req, res){
      res.status(501).json({error : "Custom Error"});
    }).get("/products"));
  });

  it('should return an HTTP 501 code when all parameters are missing', function(done){
    request.agent(server)
    .get('/products')
    .expect(501, {error : "Custom Error"})
    .end(done);
  });

  it('should return an HTTP 501 code when only one parameter is missing', function(done){
    request.agent(server)
    .get('/products?longitude=50')
    .expect(501, {error : "Custom Error"})
    .end(done);
  });
  it('should return an HTTP 501 code when only one parameter is missing', function(done){
    request.agent(server)
    .get('/products?latitude=50')
    .expect(501, {error : "Custom Error"})
    .end(done);
  });
});

function createFakeServer(swaggerMiddleware){
  var app = express();

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(swaggerMiddleware);

  app.use(function(req, res){
    res.status(200).json({ success: 'If you can enter here, it means that the swagger middleware let you do so' });
  });

  return app;
};
