# serverctl.py

from . import fm

servers = fm.readjson('app/data/servers.json')

def get_time_diff(server_id):
    if server_id in servers:
        server = servers[server_id]

        if 'timediff' in server:
            return server['timediff']

    return None

def set_time_diff(server_id, timediff):
    global servers

    if server_id in servers:
        servers[server_id]['timediff'] = int(timediff)

def get(server_id):
    return servers[server_id] if server_id in servers else None
