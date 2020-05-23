<?php

if (count($argv) !== 4) {
    echo 'ERROR';
    exit(1);
}

function generatekey($len) {
    return base64_encode(openssl_random_pseudo_bytes($len));
}

function strencrypt($plaintext, $b64_key, $cipher="AES-256-CBC") {
    $key = base64_decode($b64_key);
    $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length($cipher));
    $ciphertext_raw = openssl_encrypt($plaintext, $cipher, $key, $options=OPENSSL_RAW_DATA, $iv);
    $hmac = hash_hmac('sha256', $ciphertext_raw, $key, $as_binary=true);

    return base64_encode($iv.$hmac.$ciphertext_raw);
}

function strdecrypt($ciphertext, $b64_key, $cipher="AES-256-CBC") {
    $key = base64_decode($b64_key);
    $tmp = base64_decode($ciphertext);
    $hashlen = 32;
    $ivlen = openssl_cipher_iv_length($cipher);

    $iv = substr($tmp, 0, $ivlen);
    $hmac = substr($tmp, $ivlen, $hashlen);
    $ciphertext_raw = substr($tmp, $ivlen+$hashlen);

    $plaintext = openssl_decrypt($ciphertext_raw, $cipher, $key, $options=OPENSSL_RAW_DATA, $iv);
    $checkmac = hash_hmac('sha256', $ciphertext_raw, $key, $as_binary=true);

    return hash_equals($hmac, $checkmac) ? $plaintext : null;
}

$plaintext = $argv[2];
$key = $argv[3];

switch ($argv[1]) {
    case 'encrypt':
        echo strencrypt($plaintext, $key);
        exit(0);
    case 'decrypt':
        $tmp = strdecrypt($plaintext, $key);
        if ($tmp == null) {
            echo 'ERROR';
            exit(1);
        }
        else {
            echo $tmp;
            exit(0);
        }
    case 'key':
        echo generatekey(32);
        exit(0);
    default:
        echo 'ERROR';
        exit(1);
}
