var API = require('./ghost-node-api');

var server = new API({
  basePath: '/api/v1',
  port: 7777,
  mockPath: 'samples',
  idAttribute: 'id',
  cors: true
});

//wrap data in 'results' and add total amount
server.decorate = function(data){
  if(data.length){
    return {
      results: data,
      count: data.length
    };
  }
  return data;
};

//add custom post method localhost:7777/api/v1/custom
server.post('custom', function(request, response){
  response.json({status: 'Post method - OK'});
});

//add custom put method localhost:7777/api/v1/custom
server.put('custom', function(request, response){
	response.json({status: 'Put method - OK'})
});

server.start();
