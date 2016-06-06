/************************************************
Title: lambdacrawler_1.js
Authors: Max Grubb, Mark Rushmere, Matthew Boal
Description: Web server implemenation of graphical
webcrawler. 
Date: 6/6/2016
**************************************************/



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
const url = require('url');


var app	= express();

var dataHolder = {};
dataHolder.nodes = []; 
dataHolder.links = [];
dataHolder.keywordFoundUrl = '1';
var foundKeyword = false;
var searchDS; 
var startUrl;
var SEARCH_WORD;
var searchType;
var MAX_DEPTH;
var pagesVisited = 0;
var numLinksFound = 0;
var totalLinksFound = 0;
var nodeToLink;
var errorMsg = false;
var badUrl = "";


app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars')
app.use(express.static(__dirname + '/public'));

// Adding the express framework
app.use( bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true}));
app.use(cookieParser());



// Routes
app.get('/', function(req, res) {
	res.render('home', {
		title : 'Start Crawling'
	});
});

/*
app.get('/ck', function(req, res){


	var list = {},


	rc = req.headers.cookie;

	rc && rc.split(';').forEach(function( cookie ) {
	        var parts = cookie.split('=');
	        list[parts.shift().trim()] = decodeURI(parts.join('='));
	    });


	 console.log("Cookies: ", list);

	console.log(JSON.stringify(res.cookie));
	 res.writeHead(200, {
	    'Set-Cookie': 'mycookie=test',
	    'Content-Type': 'text/plain'
	  });
	  res.end('Hello World\n');

});
*/

app.post('/crawl', function(req, res) {
	 startUrl = req.body.starturl;
	 SEARCH_WORD = req.body.keywords;
	 searchType = req.body.searchType;
	 MAX_DEPTH = req.body.depth;

	
	//add the initial root node to the dataholder object
	createRootNode(startUrl);


/*Check for depth or breadth first search, then begin recursive lambdaCrawler. 
  the web response is at the bottom of the lambdaCrawler function. '/graph' 
  will display final results*/

	if(searchType == 'BFS'){
		searchDS = new Queue();
		searchDS.Enqueue(dataHolder.nodes[0]);
		lambdaCrawler(res); 
	}
	else if(searchType == 'DFS'){

		searchDS = []; 
		searchDS.push(dataHolder.nodes[0]); 
		lambdaCrawler(res); 
	}


});

app.get('/crawlHold', function(req, res) {
	res.send();
});

app.get('/about', function(req, res) {
	res.render('about');
});

/*Final display of results*/

app.get('/graph', function(req, res) {
	res.render('graph', {
		title : 'Graph',
		jsonData : JSON.stringify(require('./public/graph-json/fakeSiteData.json'))
	});
});


// Start the server
app.listen(3003, function() {
	console.log('Server running at host:3003/');
});


// Accept post reqeusts from the website
app.post('/crawlinfo', function(req, res) {
	startUrl = req.body.starturl;
	keywords = req.body.keywords;
	searchType = req.body.searchType;
	depth = req.body.depth;
	res.send('recieved url: ' + startUrl + '.');
});

/*Implementation of Queue Data Structure for Breadth First Search */

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
	    	return 'empty';
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

/*wordSearch() parses returned page data and finds input 'word'. Uses cheerio package*/
function wordSearch($, word) {
	if(word.trim().length < 1) {
		return false;
	}
  	var bodyText = $('html > body').text();
  	if(bodyText.toLowerCase().indexOf(word.toLowerCase()) !== -1) {
    	return true;
  	}
  	return false;
}


function lambdaCrawler(res) {

	if(searchType == 'DFS') {
	    var nextPage = searchDS.pop();
	} else {
		var nextPage = searchDS.Dequeue();
	}

    if(pagesVisited >= MAX_DEPTH || nextPage === 'empty') {

        console.log("Crawl Complete");
		renderGraph(res);
        return;
	} else if ( nextPage !== undefined && Object.keys(nextPage).length) {
		visitPage(nextPage, res, lambdaCrawler);
	} else {
		//This should only happen if nextPage is empty
		console.log("Invalid URL");
		renderGraph(res);
    }
}

/*visitPage() visits each page in data structure, begins word search and performs 
error handling and callback*/
function visitPage(urlObj, res, callback){

	console.log("Current page " + urlObj.URL);
	try {
		request({
				uri: urlObj.URL,
				method: "GET",
				timeout: 5000,
				followRedirect: true,
				maxRedirects:10
			}
			, function(error, response, body) {

			if(error) {
				console.log('Error from URL: ' + error);
				errorMsg = "Error Message: " + error;
				badUrl = urlObj.URL;
				callback(res);
				return;
			} else if(response.statusCode !== 200) {
		 		console.log("Status code: " + response.statusCode);
			   	callback(res);
			   	return;
		 	}
		 	pagesVisited++;
		 	urlObj.visited = true;

		 	var $ = cheerio.load(body.toLowerCase());
			var isWordFound = wordSearch($, SEARCH_WORD);

			if(isWordFound) {
				dataHolder.keywordFoundUrl = urlObj.URL;
				foundKeyword = SEARCH_WORD;
				renderGraph(res);
			} 
			else{ 
				collectInternalLinks($, urlObj.URL);
			   	callback(res);
			}
	    });
	} catch (e) {
		console.log(e);
		callback(res);
	}
}

/*collectInternalLinks parses pages and returns links to outside sources in an effort 
to prevent the crawler from only searching on internal path pages*/

function collectInternalLinks($, currentUrl) {

    var absoluteLinks = $("a[href^='http']");
    var relativeLinks = $("a[href^='/']");

    //filter unique links
    var tempArr = [];
    absoluteLinks.each(function() {
    	tempArr.push($(this).attr('href'));
    });
    relativeLinks.each(function() {
    	var absoluteUrl = url.resolve(currentUrl, $(this).attr('href'));
    	tempArr.push(absoluteUrl);
    });
    uniqueLinks = uniq(tempArr);

    numLinksFound = 0;
    for (var i = uniqueLinks.length - 1; i >= 0; i--) {

	    numLinksFound++;
	    totalLinksFound++;
    	var newNode = addNodeLink(currentUrl, uniqueLinks[i]);

    	if(newNode) {
    		if(searchType == 'DFS') {
    			searchDS.push(newNode);
	    	} else {
	    		searchDS.Enqueue(newNode);
	    	}
	    }
    }
}

//Should be called once the crawl is complete
//pass dataholder to the graph
function renderGraph(res) {
	var sendError = 0;

	removeUnusedData();
	if(dataHolder.nodes.length == 0) {
		sendError = errorMsg;
	}
	dataHolder.searchType = searchType;
	res.render('graph', {
		title : 'Graph',
		jsonData : JSON.stringify(dataHolder),
		errorMsg : sendError,
		foundKeyword : foundKeyword,
		badUrl : badUrl
	});
	pagesVisited = 0; 
	dataHolder.nodes = []; 
	dataHolder.links = [];
	totalLinksFound = 0;
}

function removeUnusedData() {
	var tempNodes = [];
	var tempLinks = [];

	//find nodes that were visited
	for (var i = 0; i < dataHolder.nodes.length; i++) {
		var tempNode = dataHolder.nodes[i];
		if(tempNode.visited) {
			tempNode.oldIndex = i;
			tempNodes.push(tempNode);
		}
	}

	//find links that are still relevant
	//remove links to old nodes
	for (var i = 0; i < dataHolder.links.length; i++) {
		var tempLink = dataHolder.links[i];
		var foundTarget = false
		var foundSource = false;
		for (var j = tempNodes.length - 1; j >= 0; j--) {
			if(tempNodes[j].oldIndex == tempLink.target) {
				foundTarget = j;
			}
			if(tempNodes[j].oldIndex == tempLink.source) {
				foundSource = j;
			}
		}
		if(foundSource !== false && foundTarget !== false) {
			tempLinks.push(createLink(foundSource, foundTarget));
		}
	}
	dataHolder.nodes = tempNodes;
	dataHolder.links = tempLinks;
}

//Should only be called once
//This will take the start node and append it to the nodes array with the depth of 0
//The root node will always be the only node with a depth of 0
function createRootNode(startUrl) {
	dataHolder.nodes.push(createNode(startUrl, 0));
}

//function for creating a node
//accepts url and depth
//returns a fully formed node object
function createNode(newurl, depth) {
	var nodeUrlObj = url.parse(newurl);
	var node = {};
	node.URL = newurl;
	node.URLnoProtocol = (url.format(nodeUrlObj)).replace(nodeUrlObj.protocol, '');
	node.depth = depth;
	node.visited = false;
	return node;
}

//accepts current index and next index
//returns created link object
function createLink(currentIndex, nextIndex) {
	var link = {};
	link.source = currentIndex;
	link.target = nextIndex;
	return link;
}

//take a currentUrl and a url it links to  
//create a new node(if necessary) for the nextUrl
//create a link between them
//return newNode if it was a new node, and false if the node already existed
function addNodeLink(currentUrl, nextUrl) {
	var currentIndex = getNodeIndex(currentUrl);
	var currentObj = dataHolder.nodes[currentIndex];

	nextUrlIndexSearch = getNodeIndex(nextUrl);

	if(nextUrlIndexSearch === -1) {
		nextObj = createNode(nextUrl, currentObj.depth + 1);
		nextIndex = dataHolder.nodes.push(nextObj) - 1;
	} else {
		nextIndex = nextUrlIndexSearch;
		nextObj = false;
	}
	if(nextIndex != currentIndex){
		dataHolder.links.push(createLink(currentIndex, nextIndex));
	}
	return nextObj;
}

//get index of a given node in the dataHolder.nodes array
//Only call this if you can reasonably know the element exists in the array
function getNodeIndex(testurl) {
	var nodeUrlObj = url.parse(testurl);
	var urlNoProtocol = (url.format(nodeUrlObj)).replace(nodeUrlObj.protocol, '');
	for (var i = dataHolder.nodes.length - 1; i >= 0; i--) {
		var element = dataHolder.nodes[i];
		if(urlNoProtocol == element.URLnoProtocol) {
			return i;
		}
	}
	return -1;
}

//If a node is successfully visited, flip it's visited bit to true
function visitedNode(url) {
	var nodeIndex = getNodeIndex(url);
	var node = dataHolder.nodes[nodeIndex];
	node.visited = true;
}

//http://stackoverflow.com/questions/9229645/remove-duplicates-from-javascript-array
//take array of strings and return array of unique strings.
//This will be used when going over links on a single page.  I only care about unique links on a page.
function uniq(a) {
    var seen = {};
    return a.filter(function(item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });
}
