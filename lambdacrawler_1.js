var express = require('express');
var async = require('async');
var exphbs = require('express-handlebars');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var server = require('http').createServer(app);
var request = require('request');
var events = require('events').EventEmitter.prototype._maxListeners = 100;
var cheerio = require('cheerio');


var app	= express();

var dataHolder = {};
dataHolder.sites = []; 
dataHolder.structLength = [];
var searchDS; 
var startUrl;
var SEARCH_WORD;
var searchType;
var MAX_PAGES;
var pagesVisited = 0;


app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars')
app.use(express.static(__dirname + '/public'));

// Adding the express framework
app.use( bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true}));


// Routes
app.get('/', function(req, res) {
	res.render('home', {
		title : 'Start Crawling'
	});
});

app.post('/crawl', function(req, res) {
	 startUrl = req.body.starturl;
	 SEARCH_WORD = req.body.keywords;
	 searchType = req.body.searchType;
	 MAX_PAGES = req.body.depth;

if(searchType == 'BFS'){
	searchDS = new Queue();
//var startUrl = "http://web.engr.oregonstate.edu/~grubbm/search.html";
//var MAX_PAGES = 100;
//var pagesVisited = 0;

	searchDS.Enqueue(startUrl);
	lambdaCrawlerBFS(res); 
}
else if(searchType == 'DFS'){

	searchDS = []; 
	searchDS.push(startUrl); 
	lambdaCrawlerDFS(res); 
}


});

/*app.get('/crawl', function(req, res) {
	res.render('crawl');
});
*/

app.get('/crawlHold', function(req, res) {


	res.send();
});

app.get('/about', function(req, res) {
	res.render('about');
});

app.get('/graph', function(req, res) {
	res.render('graph', {
		title : 'Graph'
	});
});


// Start the server
app.listen(3003, function() {
	console.log('Server running at http://127.0.0.1:8080/');
});






// Variable to store the post request
/*
var startUrl = "http://web.engr.oregonstate.edu/~grubbm/search.html";
var keywords;
var SEARCH_WORD = "dollar";
var searchType = 'BFS';
var MAX_PAGES = 10;
var pagesVisited = 0; 
*/


// Accept post reqeusts from the website
app.post('/crawlinfo', function(req, res) {
	startUrl = req.body.starturl;
	keywords = req.body.keywords;
	searchType = req.body.searchType;
	depth = req.body.depth;
	res.send('recieved url: ' + startUrl + '.');
});



function Queue(){
	var count = 0;
	var head = null;
	var tail = null;

	this.GetCount = function(){
    	return count;
	}



	this.Enqueue = function (data) {
		var node = {
	    	data: data,
	    	next: head
		};

		if (head === null) {
	    	tail = node;
		}

		head = node;

		count++;
	}


	this.Dequeue = function () {
		if (count === 0) {
	    	return;
		}
		else {
	    	var dq = tail.data;
	    	var current = head;
	    	var previous = null;

	    	while (current.next) {
	        	previous = current;
	        	current = current.next;
	    	}

	    	if (count > 1) {
	        	previous.next = null;

	        	tail = previous;
	    	}
	    	else {
	        	head = null;
	        	tail = null;
	    	}

	    	count--;
		}
	    	return dq;
	}

}

function searchForWord($, word) {
  var bodyText = $('html > body').text();
  if(bodyText.toLowerCase().indexOf(word.toLowerCase()) !== -1) {
    return true;
  }
  return false;
}

/*
var searchDS; 
if(searchType == 'BFS'){
	searchDS = new Queue();
//var startUrl = "http://web.engr.oregonstate.edu/~grubbm/search.html";
//var MAX_PAGES = 100;
//var pagesVisited = 0;

	searchDS.Enqueue(startUrl);
	lambdaCrawlerBFS();
}
else if(searchType == 'DFS'){

	searchDS = []; 
	searchDS.push(startUrl); 
	lambdaCrawlerDFS(); 

}
*/

function lambdaCrawlerBFS(res) {
	
	var nextPageBFS = searchDS.Dequeue();
    	if(pagesVisited >= MAX_PAGES){
            	console.log("Crawl Complete");
		res.send(dataHolder.sites);
		pagesVisited = 0; 
		dataHolder.sites = []; 
		dataHolder.structLength = [];
		return;
    	}
    	else{
            	visitPageBFS(nextPageBFS, res, lambdaCrawlerBFS);
            	}
}

function visitPageBFS(url, res, callback){


	pagesVisited++;

	  console.log("Current page " + url);
	dataHolder.sites.push(url); 
  request(url,  function(error, response, body) {

 	console.log("Status code: " + response.statusCode);
 	if(response.statusCode !== 200) {
   	callback(res);
   	return;
 	}
 	var $ = cheerio.load(body.toLowerCase());
	var isWordFound = searchForWord($, SEARCH_WORD);
	if(isWordFound) {
     		 console.log('Crawler found ' + SEARCH_WORD + ' at page ' + url);
		dataHolder.sites.push('Crawler found ' + SEARCH_WORD + ' at page ' + url);
		res.send(dataHolder.sites);
		pagesVisited = 0; 
		dataHolder.sites = []; 
		dataHolder.structLength = [];

	} 
	else{ 
		collectInternalLinksBFS($);
   	callback(res);
	}
	
    });
}

function collectInternalLinksBFS($) {

    var absoluteLinksBFS = $("a[href^='http']");
    absoluteLinksBFS.each(function() {
	    searchDS.Enqueue($(this).attr('href'));
    });
    console.log("size of gQ: " + searchDS.GetCount());
}


function lambdaCrawlerDFS(res) {

    	var nextPageDFS = searchDS.pop();
	dataHolder.sites.push(nextPageDFS); 		 
    	if(pagesVisited >= MAX_PAGES){
            	console.log("Crawl Complete");
		res.send(dataHolder.sites);
		pagesVisited = 0; 
		dataHolder.sites = []; 
		dataHolder.structLength = [];

            	return;
    	}
    	else{
            	visitPageDFS(nextPageDFS, res,  lambdaCrawlerDFS);
            	}
}

function visitPageDFS(url, res, callback){


	pagesVisited++;

  console.log("Current page " + url);
 request(url, function(error, response, body) {

 	console.log("Status code: " + response.statusCode);
 	if(response.statusCode !== 200) {
   	callback(res);
   	return;
 	}
 	var $ = cheerio.load(body.toLowerCase());
	var isWordFound = searchForWord($, SEARCH_WORD);
	if(isWordFound) {
     			console.log('Crawler found ' + SEARCH_WORD + ' at page ' + url);
			dataHolder.sites.push('Crawler found ' + SEARCH_WORD + ' at page ' + url);
			res.send(dataHolder.sites);
			pagesVisited = 0; 
			dataHolder.sites = []; 
			dataHolder.structLength = [];
	} 
	else{ 
	collectInternalLinksDFS($);
   	callback(res);
	}
	
    });
}

function collectInternalLinksDFS($) {

    var absoluteLinksDFS = $("a[href^='http']");
    absoluteLinksDFS.each(function() {
	    searchDS.push($(this).attr('href'));
	    //pagesToVisit.push($(this).attr('href'));
    });
}
