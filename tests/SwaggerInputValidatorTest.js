var request = require('supertest');
var http = require('http');

var swaggerInputValidator = require('../module.js');


describe('swaggerInputValidator()', function() {
  var server;
    before(function(){
      server = createServer()
    });

  if('should crash if no swagger file is specified', function(done){
    request(server)
    .post('/')
    .expect(200, '{}', done);
  });
});

function createServer(url){
  var _swaggerInputValidator = swaggerInputValidator(url);

  return http.createServer(function(req, res){
    _swaggerInputValidator(req, res, function(err){
      res.statusCode = err ? (err.status || 500) : 200;
      res.end(err ? err.message : JSON.stringify(req.body));
    })
  });
}
