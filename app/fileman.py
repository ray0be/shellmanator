# fileman.py

import json

def readjson(file):
    return json.loads(read(file))

def writejson(file, content):
    return write(file, json.dumps(content, indent=4, separators=(', ', ': ')))

def read(file):
    return open(file, 'r').read()

def write(file, content):
    return open(file, 'w').write(content)
