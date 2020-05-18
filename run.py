#!/usr/bin/env python3

from app import (
    config,
    router,
    totoro
)

from flask import Flask

# Flask app + config
app = Flask(__name__, static_folder='app/static')
app.config['ENV'] = config('env')
app.config['DEBUG'] = False
app.config['SESSION_COOKIE_NAME'] = 'shellman'

# Define routes
router.define_routes(app)

# Start Totoro
if config('use_tor') and totoro().start():
    print('Totoro successfully started !')

# Start the webserver
app.run(port=config('port'))
