# tororeq.py

from totororequests import Totoro

toro = None

def get():
    global toro

    if toro is None:
        toro = Totoro(nowarning=True)

    return toro
