# fileman.py

import os
import json

def abspath(relpath):
    if relpath[:1] == '/':
        return relpath
    else:
        return os.path.dirname(__file__)[:-4] + '/' + relpath

def readjson(file):
    return json.loads(
        read(
            abspath(file)
        )
    )

def writejson(file, content):
    return write(
        abspath(file),
        json.dumps(
            content,
            indent=4,
            separators=(', ', ': ')
        )
    )

def read(file):
    return open(
        abspath(file),
        'r'
    ).read()

def write(file, content):
    return open(
        abspath(file),
        'w'
    ).write(content)

def exists(file):
    return os.path.exists(abspath(file))

def eol():
    return os.linesep
