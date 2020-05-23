# serverctl.py

from . import fm

servers = fm.readjson('app/data/servers.json')
timediffs = {}

def get_time_diff(server_id):
    if server_id in timediffs:
        return timediffs[server_id]

    return None

def set_time_diff(server_id, timediff):
    global timediffs
    timediffs[server_id] = int(timediff)

def get(server_id):
    return servers[server_id] if server_id in servers else None

def set_secret_key(server_id, secret_key):
    global servers
    servers[server_id]['secretkey'] = secret_key
    return fm.writejson('app/data/servers.json', servers)
