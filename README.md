# Ghost-Node-API https://travis-ci.org/maliknur/ghost-node-api.svg?branch=master
 :ghost: Ghost server in node.js mocking RESTFUL API server, route calls to static JSON files with different HTTP methods

## What does it do?

Ghost-Node-API was written to simulate a simple RESTFUL API. 
API calls are routed to static JSON files.
As an example if your sample directory looks like this:
```
+ samples
  - customers.json
  - users.json
  + products
    - printers.json
```

with users.json
```
[
  {id: 1, name: 'John Doe'},
  {id: 2, name: 'Peter Sample'}
]
```

`GET localhost:7777/api/v1/users`

returns all users inside users.json

`GET localhost:7777/api/v1/users/1`

returns one user with the id == 1

`GET localhost:7777/api/v1/products/printers`

returns all items from products/printers.json


## Installation

`npm install`

## Usage

```
var API = require('ghost-node-api');
var myApi = new API({
  basePath: '/api/v1',
  mockPath: 'samples',
  idAttribute: 'id'
});
myApi.start();
```

To run the server:
```
cd ghost-node-api
npm start

Open your Browser or Postman and go to `localhost:7777/api/v1/users`

```

To debug the server:
```
node-debug server.js

Open your browser and go to http://127.0.0.1:8080/?ws=127.0.0.1:8080&port=5858
```

## Custom Routes

If static JSON files are not sufficient you can also add custom routes by defining your own request handler functions. Custom routes are supported for GET, POST, PUT and DELETE methods:
```
myApi.post('customers', function(request, response){
  response.json({status: 'new customer created'});
});
```

## Beautify

All API responses can be wrapped by defining a `beautify` function. The functions also gets passed the request object as the second parameter. In this example all returned collections are wrapped into `results` and a total count is added.

```
myApi.beautify = function(data, request){
  if(data.length){
    return {
      results: data,
      count: data.length
    };
  }
  return data;
};
```

## Author:
**[Malik Nur]**


[Malik Nur]: https://github.com/maliknur
