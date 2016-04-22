var express = require('express');
var bodyParser = require('body-parser');
var app		= express();
var request = require('request');
var events = require('events').EventEmitter.prototype._maxListeners = 100;
var cheerio = require('cheerio');
var http = require('http');


// Variable to store the post request
var startUrl;
var keywords;
var searchType;
var depth;

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




function Queue(){
	var count = 0;
	//Yes, I don't use back and front.
	var head = null;
	var tail = null;

	//Returns the number of items in the queue
	this.GetCount = function(){
    	return count;
	}

	/* Methods */


	this.Enqueue = function (data) {
		//Creates a node with the data
		var node = {
	    	data: data,
	    	//next points to value straight way. If head is null, it won't be a problem
	    	next: head
		};

		//if it is the first item, then the head is also the tail
		if (head === null) {
	    	tail = node;
		}

		//defines the node as the new head
		head = node;

		//increases the count
		count++;
	}


	this.Dequeue = function () {
		//if queue is empty, returns null
		if (count === 0) {
	    	return;
		}
		else {
	    	var dq = tail.data;
	    	var current = head;
	    	var previous = null;

	    	//while there is a next, it will advance the queue.
	    	//the idea is to have "current" at the end and "previous" as the one before last
	    	while (current.next) {
	        	previous = current;
	        	current = current.next;
	    	}

	    	//if there is more than 1 item,
	    	//Removes the tail and decreases count by 1.
	    	if (count > 1) {
	        	//Remove the reference to the last one.
	        	previous.next = null;

	        	//makes tail point to the previous node.
	        	tail = previous;
	    	}
	    	//resets the queue
	    	else {
	        	head = null;
	        	tail = null;
	    	}

	    	count--;
		}
	    	return dq;
	}

}


var gQ = new Queue();
//var startUrl = "http://web.engr.oregonstate.edu/~grubbm/search.html";
//var MAX_PAGES = 100;
//var pagesVisited = 0;

gQ.Enqueue(startUrl);
//lambdaCrawler();

function lambdaCrawler() {

    	var nextPage = gQ.Dequeue();
    	if(pagesVisited >= MAX_PAGES){
            	console.log("Crawl Complete");
            	return;
    	}
    	else{
            	visitPage(nextPage, lambdaCrawler);
            	}
}

function visitPage(url, callback){


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
  	collectInternalLinks($);
   	// In this short program, our callback is just calling crawl()
   	callback();

    });
}

function collectInternalLinks($) {

    var absoluteLinks = $("a[href^='http']");
    absoluteLinks.each(function() {
	    gQ.Enqueue($(this).attr('href'));
	    //pagesToVisit.push($(this).attr('href'));
    });
    console.log("size of gQ: " + gQ.GetCount());
}
