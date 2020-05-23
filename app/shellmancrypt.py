# shellmancrypt.py

import subprocess
from . import fm

def _run_shellmancrypt_php(mode, msg, key):
    msg = msg.replace('\\', '\\\\').replace('"', '\\"').replace('$', '\\$')

    cmd  = '/usr/bin/env php '
    cmd += fm.abspath('app/shellmancrypt.php')
    cmd += ' ' + mode + ' '
    cmd += '"' + msg + '" '
    cmd += '"' + key + '"'
    excode, output = subprocess.getstatusoutput(cmd)
    return output if excode == 0 else None

def encrypt(msg, key):
    return _run_shellmancrypt_php('encrypt', msg, key)

def decrypt(msg, key):
    return _run_shellmancrypt_php('decrypt', msg, key)

def generate_secret_key():
    return _run_shellmancrypt_php('key', 'A', 'A')
