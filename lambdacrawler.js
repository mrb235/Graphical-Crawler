var express = require('express');
var bodyParser = require('body-parser');
var app		= express();
var request = require('request');
var events = require('events').EventEmitter.prototype._maxListeners = 100;
var cheerio = require('cheerio');
var http = require('http');


// Variable to store the post request
var startUrl = "http://web.engr.oregonstate.edu/~grubbm/search.html";
var keywords;
var SEARCH_WORD = "dollar";
var searchType = 'BFS';
var MAX_PAGES = 10;
var pagesVisited = 0; 
/*
// Adding the express framework 
app.use(bodyParser.urlencoded({ extended: true}));


// Accept post reqeusts from the website
app.post('/crawlinfo', function(req, res) {
	startUrl = req.body.starturl;
	keywords = req.body.keywords;
	searchType = req.body.searchType;
	depth = req.body.depth;
	res.send('recieved url: ' + startUrl + '.');
});


app.listen(8080, function() {
	console.log('Server running at http://127.0.0.1:8080/');
});
*/



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

function lambdaCrawlerBFS() {

    	var nextPageBFS = searchDS.Dequeue();
    	if(pagesVisited >= MAX_PAGES){
            	console.log("Crawl Complete");
            	return;
    	}
    	else{
            	visitPageBFS(nextPageBFS, lambdaCrawlerBFS);
            	}
}

function visitPageBFS(url, callback){


	pagesVisited++;

  console.log("Visiting page " + url);
  request(url, function(error, response, body) {

 	console.log("Status code: " + response.statusCode);
 	if(response.statusCode !== 200) {
   	callback();
   	return;
 	}
 	var $ = cheerio.load(body.toLowerCase());
	var wordFound = searchForWord($, SEARCH_WORD);
	if(wordFound) {
     		  console.log('Word ' + SEARCH_WORD + ' found at page ' + url);
	} 
	else{ 
		collectInternalLinksBFS($);
   	callback();
	}

    });
}

function collectInternalLinksBFS($) {

    var linksBFS = $("a[href^='http']");
   	 linksBFS.each(function() {
	 searchDS.Enqueue($(this).attr('href'));
	    //pagesToVisit.push($(this).attr('href'));
    });
//    console.log("size of gQ: " + searchDS.GetCount());
}


function lambdaCrawlerDFS() {

    	var nextPageDFS = searchDS.pop();
    	if(pagesVisited >= MAX_PAGES){
            	console.log("Crawl Complete");
            	return;
    	}
    	else{
            	visitPageDFS(nextPageDFS, lambdaCrawlerDFS);
            	}
}

function visitPageDFS(url, callback){


	pagesVisited++;

  console.log("Visiting page " + url);
  request(url, function(error, response, body) {
 	// Check status code (200 is HTTP OK)

 	console.log("Status code: " + response.statusCode);
 	if(response.statusCode !== 200) {
   	callback();
   	return;
 	}
 	// Parse the document body
 	var $ = cheerio.load(body.toLowerCase());
	var isWordFound = searchForWord($, SEARCH_WORD);
	if(isWordFound) {
     		  console.log('Word ' + SEARCH_WORD + ' found at page ' + url);
	} 
	else{ 
	collectInternalLinksDFS($);
   	callback();
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
