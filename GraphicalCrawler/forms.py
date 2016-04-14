from wtforms import Form, RadioField, StringField, IntegerField, validators

class CrawlerForm(Form):
    starturl = StringField('Starturl', [validators.Length(min=3, max=50)])
    keywords = StringField('Keywords', [validators.Length(min=0, max=50)])
    depth = IntegerField('Depth', [validators.NumberRange(min=1, max=100)])
    option = RadioField('Option', choices=[('DFS','DFS'),('BFS','BFS')])
