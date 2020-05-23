# shellmancrypt.py

import subprocess

def _run_shellmancrypt_php(mode, msg, key):
    cmd  = '/usr/bin/php '
    cmd += 'app/shellmancrypt.php '
    cmd += mode + ' '
    cmd += '"' + msg.replace('"', '\\"') + '" '
    cmd += '"' + key + '"'
    excode, output = subprocess.getstatusoutput(cmd)
    return output if excode == 0 else None

def encrypt(msg, key):
    return _run_shellmancrypt_php('encrypt', msg, key)

def decrypt(msg, key):
    return _run_shellmancrypt_php('decrypt', msg, key)

def generate_secret_key():
    return _run_shellmancrypt_php('key', 'A', 'A')
