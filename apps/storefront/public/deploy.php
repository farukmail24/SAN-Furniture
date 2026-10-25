<?php
/**
 * SAN Furniture - GitHub Auto-Deployment Webhook (Public Entry Point)
 *
 * Automatically pulls new commits from GitHub when pushed to 'master' or 'main'
 * and triggers Phusion Passenger Node.js app restart via tmp/restart.txt.
 *
 * GitHub Webhook Setup:
 * 1. Payload URL: https://sanfurniture.com/deploy.php
 * 2. Content type: application/json
 * 3. Secret: san_furniture_auto_deploy_master_secret_2026
 * 4. Events: Just the push event
 */

header('Content-Type: application/json; charset=utf-8');

// 1. Resolve Project Root
$possibleRoots = [
    '/home/sansoft/sanfurniture.com',
    dirname(dirname(__DIR__)),
    dirname(__DIR__),
    __DIR__
];

$projectRoot = null;
foreach ($possibleRoots as $r) {
    if (is_dir($r . '/.git')) {
        $projectRoot = $r;
        break;
    }
}
if (!$projectRoot) {
    $projectRoot = is_dir('/home/sansoft/sanfurniture.com') ? '/home/sansoft/sanfurniture.com' : dirname(dirname(__DIR__));
}

// 2. Resolve Deployment Secret
$secret = getenv('DEPLOY_SECRET') ?: (getenv('SAN_AUTH_SECRET') ?: 'san_furniture_auto_deploy_master_secret_2026');

// Check .env files
$envFiles = [
    $projectRoot . '/.env',
    $projectRoot . '/apps/storefront/.env',
    __DIR__ . '/.env'
];
foreach ($envFiles as $ef) {
    if (file_exists($ef) && is_readable($ef)) {
        $lines = file($ef, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (strpos($line, '#') === 0) continue;
            if (strpos($line, 'DEPLOY_SECRET=') === 0) {
                $secret = trim(substr($line, strlen('DEPLOY_SECRET=')));
                break;
            } elseif (strpos($line, 'SAN_AUTH_SECRET=') === 0 && $secret === 'san_furniture_auto_deploy_master_secret_2026') {
                $secret = trim(substr($line, strlen('SAN_AUTH_SECRET=')));
            }
        }
    }
}

// 3. Health Check GET Request
$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$queryToken = $_GET['secret'] ?? ($_GET['token'] ?? '');
$headerToken = $_SERVER['HTTP_X_DEPLOY_SECRET'] ?? '';

if ($requestMethod === 'GET') {
    echo json_encode([
        'status' => 'online',
        'service' => 'SAN Furniture GitHub Auto-Deploy Webhook',
        'projectRoot' => $projectRoot,
        'supportedEvents' => ['push', 'ping'],
        'monitoredBranches' => ['master', 'main'],
        'authenticated' => ($queryToken === $secret),
        'serverTime' => date('c'),
        'instructions' => [
            'payloadUrl' => 'https://sanfurniture.com/deploy.php',
            'contentType' => 'application/json',
            'secret' => 'san_furniture_auto_deploy_master_secret_2026',
            'events' => 'Just the push event'
        ]
    ], JSON_PRETTY_PRINT);
    exit;
}

// 4. Read Raw Payload & Signature
$rawPayload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';
$githubEvent = $_SERVER['HTTP_X_GITHUB_EVENT'] ?? 'push';
$deliveryId = $_SERVER['HTTP_X_GITHUB_DELIVERY'] ?? '';

// 5. Authenticate via HMAC SHA-256 OR Secret Token
$isSigValid = false;
if (!empty($signature) && strpos($signature, 'sha256=') === 0) {
    $expectedSig = 'sha256=' . hash_hmac('sha256', $rawPayload, $secret);
    $isSigValid = hash_equals($expectedSig, $signature);
}

$isTokenValid = (!empty($queryToken) && hash_equals($secret, $queryToken)) || 
                (!empty($headerToken) && hash_equals($secret, $headerToken));

if (!$isSigValid && !$isTokenValid) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'Unauthorized: Invalid or missing GitHub Webhook signature / secret',
        'hint' => 'Ensure Secret matches in GitHub Webhook settings and .env'
    ]);
    exit;
}

// 6. Parse JSON Payload (Supports application/json and application/x-www-form-urlencoded)
$payload = [];
if (strpos($rawPayload, 'payload=') === 0) {
    $payload = json_decode(urldecode(substr($rawPayload, 8)), true);
} else {
    $payload = json_decode($rawPayload, true);
}

// 7. Handle GitHub Ping Event
if ($githubEvent === 'ping') {
    echo json_encode([
        'success' => true,
        'event' => 'ping',
        'message' => 'GitHub Webhook Ping acknowledged! SAN Furniture auto-deploy endpoint is online.',
        'hookId' => $payload['hook_id'] ?? null,
        'timestamp' => date('c')
    ], JSON_PRETTY_PRINT);
    exit;
}

// 8. Handle GitHub Push Event
if ($githubEvent === 'push') {
    $ref = $payload['ref'] ?? '';
    $branch = str_replace('refs/heads/', '', $ref);

    if ($branch !== 'master' && $branch !== 'main') {
        echo json_encode([
            'success' => true,
            'action' => 'ignored',
            'message' => "Ignored push to branch '{$branch}'. Auto-deploy only triggers for 'master' or 'main'."
        ]);
        exit;
    }

    $commitSha = substr($payload['after'] ?? ($payload['head_commit']['id'] ?? 'latest'), 0, 7);
    $commitMsg = $payload['head_commit']['message'] ?? 'No commit message';
    $pusher = $payload['pusher']['name'] ?? ($payload['sender']['login'] ?? 'Unknown');

    // Execute Git Pull & Passenger Restart
    $output = [];
    $exitCode = 0;

    chdir($projectRoot);

    // 1. Preserve CloudLinux / Passenger block from .htaccess before git reset
    $htaccessFile = $projectRoot . '/.htaccess';
    $passengerBlock = null;
    if (file_exists($htaccessFile)) {
        $curHtaccess = @file_get_contents($htaccessFile);
        if (preg_match('/(# DO NOT REMOVE\.\s*CLOUDLINUX PASSENGER CONFIGURATION BEGIN.*?# DO NOT REMOVE\.\s*CLOUDLINUX PASSENGER CONFIGURATION END)/s', $curHtaccess, $m)) {
            $passengerBlock = $m[1];
        } elseif (preg_match('/(PassengerAppRoot.*)/s', $curHtaccess, $m)) {
            $passengerBlock = $m[1];
        }
    }

    // Auto-discover Node.js Virtual Environment if block is missing
    if (!$passengerBlock) {
        $possibleNodeBins = array_merge(
            glob('/home/*/{nodevenv,virtualenv}/*/*/bin/node', GLOB_BRACE) ?: [],
            glob('/home/*/nodevenv/*/*/bin/node') ?: [],
            glob('/home/*/*/*/bin/node') ?: []
        );
        if (!empty($possibleNodeBins)) {
            $nodeBin = $possibleNodeBins[0];
            $passengerBlock = "# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN\n" .
                "PassengerAppRoot \"{$projectRoot}\"\n" .
                "PassengerBaseURI \"/\"\n" .
                "PassengerNodejs \"{$nodeBin}\"\n" .
                "PassengerAppType node\n" .
                "PassengerStartupFile server.js\n" .
                "# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END";
        }
    }

    exec("git fetch origin {$branch} 2>&1", $output, $exitCode);
    exec("git reset --hard origin/{$branch} 2>&1", $output, $exitCode);

    // 2. Restore CloudLinux / Passenger block to .htaccess if it was stripped
    if ($passengerBlock && file_exists($htaccessFile)) {
        $newHtaccess = @file_get_contents($htaccessFile);
        if (strpos($newHtaccess, 'PassengerAppRoot') === false) {
            @file_put_contents($htaccessFile, $passengerBlock . "\n\n" . $newHtaccess);
        }
    }

    // Touch tmp/restart.txt to restart Phusion Passenger Node.js app on cPanel
    $restartDirs = [
        $projectRoot . '/tmp',
        $projectRoot . '/apps/storefront/tmp',
        dirname($projectRoot) . '/tmp'
    ];

    $restarted = false;
    foreach ($restartDirs as $dir) {
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        $rFile = $dir . '/restart.txt';
        $written = @file_put_contents($rFile, "Restarted at " . date('c') . "\n");
        if ($written !== false) {
            $restarted = true;
        }
    }

    // Try passenger-config CLI if available
    @exec("passenger-config restart-app {$projectRoot} 2>&1");

    // Append to deploy.log
    $logMsg = sprintf("[%s] Branch: %s | Commit: %s | By: %s | Msg: %s\n", date('c'), $branch, $commitSha, $pusher, $commitMsg);
    @file_put_contents($projectRoot . '/deploy.log', $logMsg, FILE_APPEND);

    echo json_encode([
        'success' => true,
        'message' => "Auto-deployment successfully executed on cPanel",
        'branch' => $branch,
        'commitSha' => $commitSha,
        'pusher' => $pusher,
        'deliveryId' => $deliveryId,
        'passengerRestartTriggered' => $restarted,
        'output' => array_slice($output, 0, 5),
        'timestamp' => date('c')
    ], JSON_PRETTY_PRINT);
    exit;
}

echo json_encode(['success' => true, 'message' => "Event '{$githubEvent}' received"]);
