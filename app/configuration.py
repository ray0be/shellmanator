# configuration.py

from . import fm

configuration = None

def get(elempath):
    """Returns an element of the configuration.
    To retrieve a nested element in the JSON config :
    config('parent.child')
    """
    global configuration

    if configuration is None:
        configuration = fm.readjson('app/data/config.json')

    elems = elempath.split('.')
    tmp = configuration
    for e in elems:
        tmp = tmp[e]

    return tmp
