'use strict';

var bodyParser = require('body-parser');
var express = require('express');
var _ = require('lodash-node');
var fs = require('fs');
var path = require('path');
var Q = require('q');
var fs_readFile = Q.denodeify(fs.readFile);
var customMethods = [
  'get', 'post', 'put', 'delete', 'patch'
];

var NODEAPI = function(options){
  this.defaults = {
    mockPath: 'samples',
    basePath: '/api',
    port: 7777,
    idAttribute: 'uuid',
    cors: true
  };
  this.options = _.extend(this.defaults, options);
  this.app = express();
  this.app.use(bodyParser.json());
  this.app.use(bodyParser.urlencoded({extended: false}));
  
  if(this.options.cors === true){
    this.app.use(require('cors')());
  }
  
  if(this.options.delay){
    var options = {
      url: /./i,
      delay: 100
    };
    if(typeof this.options.delay === 'object'){
      _.extend(options, this.options.delay);
    }
    this.app.use(require('connect-slow')(options));
  }
  return this;
};



// Handle all API requests with json files found in file system (./samples).
// If a file is not found the server assumes that a single item was requested
// and tries to search a specific id in the parent collection
// e.g. for customers/123 it will search in customers.json for an item with idAttribute === 123


NODEAPI.prototype.initNodeRoute = function(filePath){
  this.app.get(filePath, function(request, response){
    console.log(request.query);
    var strippedRequestPath = request.path.substring(this.options.basePath.length),
    fileName = this.getFileName(strippedRequestPath);

    fs_readFile(fileName, 'utf8').then(

      function handleFileFound(data){
        var parsedData,
        responseData;
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          return console.error(e);
        }
        responseData = sort(parsedData, request.query[this.options.sortParameter]);
        console.log('Serving: ' + fileName)
        try {
          response.json(this.beautify(responseData, request));
        } catch (e) {
          console.log(e);
        }
      }.bind(this),

      function handleError(){
        var splitted = splitPathInIdAndPath(strippedRequestPath);
        if(splitted){
          fs_readFile(this.getFileName(splitted.path), 'utf8').then(

            function handleSingleItem(data){
              var parsedData,
              queryObj = {};
              queryObj[this.options.idAttribute] = splitted.id;

              try {
                parsedData = JSON.parse(data);
              } catch (e) {
                return console.error(e);
              }

              //search single item
              var foundItem = _.findWhere(parsedData, queryObj);
              //try again with number instead of string
              if(!foundItem){
                queryObj[this.options.idAttribute] = parseInt(splitted.id, 10);
                foundItem = _.findWhere(parsedData, queryObj);
              }
              if(foundItem){
                console.log('Serving: ' + path.join(this.getFileName(splitted.path), splitted.id));
                response.json(this.beautify(foundItem, request));
              } else {
                response.sendStatus(404);
              }
            }.bind(this),

            function(err) {
              console.log('No mock data found:', strippedRequestPath);
              response.sendStatus(404);
            }.bind(this)
          );
        }
      }.bind(this)
    );
  }.bind(this));
}


//This function can be overridden. Allows to modify responses globally.
NODEAPI.prototype.beautify = function(data) {
  return data;
};

// Configure express mock route (has to be set up here because custom routes should be defined earlier)
// and start server

NODEAPI.prototype.start = function() {
  this.initNodeRoute(path.join(this.options.basePath, '*'));
  this.expressInstance = this.app.listen(this.options.port);
  console.log('Listening on:', this.options.port);
};

//Stop server
NODEAPI.prototype.stop = function() {
  if(this.expressInstance){
    this.expressInstance.close();
    console.log('Stopped listening on:', this.options.port);
  }
};


// adds convenient functions for custom routes
// e.g. server.post('abc', function(req, res)) instead of server.app.post(server.options.basePath ...)

customMethods.forEach(function(method){
  NODEAPI.prototype[method] = function(relativeRoute, fn) {
    this.app[method](path.join(this.options.basePath, relativeRoute), fn);
  };
  NODEAPI.prototype[method + 'FromRoot'] = function(absoluteRoute, fn) {
    this.app[method](absoluteRoute, fn);
  };
});


// get filename relative to mock path
NODEAPI.prototype.getFileName = function(filePath) {
  return path.join(process.cwd(), this.options.mockPath, filePath+'.json');
};

// split path in subpath and uuid
var splitPathInIdAndPath = function(filePath){
  var parts = filePath.split('/');
  if(parts.length > 0){
    var id = parts.pop();
    return {
      id: id,
      path: parts.join('/')
    }
  } else {
    return false;
  }
};

/*
* Sort data array by property
* leading + is ASC
* leading - is DESC
*/
var sort = function(data, sortOrder) {
  if(sortOrder){
    data = _.sortBy(data, sortOrder.substr(1));
    if(sortOrder[0] === '-'){
      data.reverse();
    }
  }
  return data;
};

module.exports = NODEAPI;
