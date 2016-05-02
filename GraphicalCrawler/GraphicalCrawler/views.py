"""
Routes and views for the flask application.
"""

from datetime import datetime
from flask import render_template, url_for, request, redirect
from GraphicalCrawler import app
from forms import CrawlerForm

@app.route('/', methods=['GET', 'POST'])
@app.route('/home', methods=['GET', 'POST'])
def home():
    form = CrawlerForm()
    return render_template(
        'index.html',
        title='Home Page',
        year=datetime.now().year,
        form=form,
    )

@app.route('/crawl', methods=['GET', 'POST'])
def crawl():
    searchType = request.form.get('searchType')
    starturl = request.form.get('starturl')
    depth = request.form.get('depth')
    keywords = request.form.get('keywords')
    return render_template(
        'crawl.html',
        searchType=searchType,
        starturl=starturl,
        depth=depth,
        keywords=keywords,
        title='URL Crawler',
        year=datetime.now().year
    )

@app.route('/contact')
def contact():
    """Renders the contact page."""
    return render_template(
        'contact.html',
        title='Contact',
        year=datetime.now().year,
        message='Your contact page.'
    )

@app.route('/about')
def about():
    """Renders the about page."""
    return render_template(
        'about.html',
        title='About',
        year=datetime.now().year,
        message='Your application description page.'
    )

@app.route('/graph')
def graph():
    """Renders the graph page."""
    return render_template(
        'graph.html',
        title='Graph',
        year=datetime.now().year,
        message='Initial graph view.'
    )
