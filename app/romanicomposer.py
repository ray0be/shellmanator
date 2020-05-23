# romanicomposer.py

import subprocess
from . import fm

def _clean(content):
    return content.replace('<?php', '').replace('?>', '')

def _check_syntax(file):
    cmd  = '/usr/bin/env php -l {}'.format(file)
    excode, output = subprocess.getstatusoutput(cmd)
    return (excode == 0)

def compose(secretkey, modules, servid):
    romain = fm.read('romanishell/romanishell.php')
    rofunc = fm.read('romanishell/functions.php')
    eol = fm.eol()

    php_secretkey = '$SECRET_KEY = "{}";'.format(secretkey)
    php_functions = _clean(rofunc)
    php_modulelist = '$MODULES = {};'.format(str(modules))
    php_modules = ""

    for modid in modules:
        path = 'modules/{}/module.class.php'.format(modid)

        if fm.exists(path):
            php_modules += eol + _clean(fm.read(path))

    # Replacements
    romain = romain.replace("//{SECRETKEY}", php_secretkey)
    romain = romain.replace("//{MODULELIST}", php_modulelist)
    romain = romain.replace("//{MODULES}", php_modules)
    romain = romain.replace("//{FUNCTIONS}", php_functions)

    # Save the romanishell content
    destpath = fm.abspath('romanishell/generated/' + servid + '.php')
    fm.write(destpath, romain)

    return _check_syntax(destpath), destpath
