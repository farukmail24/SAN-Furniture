<?php
/**
 * SAN Furniture - GitHub Auto-Deployment Webhook (cPanel / Apache / PHP)
 *
 * Automatically pulls new commits from GitHub when pushed to 'master' or 'main'
 * and triggers Phusion Passenger Node.js app restart via tmp/restart.txt.
 *
 * GitHub Webhook Setup:
 * 1. Payload URL: https://yourdomain.co.uk/deploy.php (or https://yourdomain.co.uk/api/webhooks/deploy)
 * 2. Content type: application/json
 * 3. Secret: san_furniture_auto_deploy_master_secret_2026 (or your custom secret in .env)
 * 4. Events: Just the push event
 */

header('Content-Type: application/json; charset=utf-8');

// 1. Resolve Deployment Secret
$secret = getenv('DEPLOY_SECRET') ?: (getenv('SAN_AUTH_SECRET') ?: 'san_furniture_auto_deploy_master_secret_2026');

// Also try reading from .env file if available
$envFiles = [__DIR__ . '/.env', __DIR__ . '/apps/storefront/.env', dirname(__DIR__) . '/.env'];
foreach ($envFiles as $ef) {
    if (file_exists($ef) && is_readable($ef)) {
        $lines = file($ef, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            if (strpos($line, 'DEPLOY_SECRET=') === 0) {
                $secret = trim(substr($line, strlen('DEPLOY_SECRET=')));
                break;
            } elseif (strpos($line, 'SAN_AUTH_SECRET=') === 0 && $secret === 'san_furniture_auto_deploy_master_secret_2026') {
                $secret = trim(substr($line, strlen('SAN_AUTH_SECRET=')));
            }
        }
    }
}

// 2. Read Raw Request Body & Headers
$rawPayload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';
$githubEvent = $_SERVER['HTTP_X_GITHUB_EVENT'] ?? 'push';
$deliveryId = $_SERVER['HTTP_X_GITHUB_DELIVERY'] ?? '';

// Support query parameter fallback for manual testing: ?secret=... or ?token=...
$queryToken = $_GET['secret'] ?? ($_GET['token'] ?? '');
$headerToken = $_SERVER['HTTP_X_DEPLOY_SECRET'] ?? '';

// 3. Health check GET request
$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($requestMethod === 'GET') {
    echo json_encode([
        'status' => 'online',
        'service' => 'SAN Furniture GitHub Auto-Deploy Webhook (PHP Engine)',
        'supportedEvents' => ['push', 'ping'],
        'monitoredBranches' => ['master', 'main'],
        'authenticated' => ($queryToken === $secret),
        'serverTime' => date('c'),
        'instructions' => [
            'githubPayloadUrl' => '/deploy.php',
            'contentType' => 'application/json',
            'events' => 'Just the push event'
        ]
    ], JSON_PRETTY_PRINT);
    exit;
}

// 4. Validate GitHub HMAC SHA-256 Signature or Secret Token
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

// 5. Parse JSON Payload (Supports both application/json and application/x-www-form-urlencoded)
if (strpos($rawPayload, 'payload=') === 0) {
    $payload = json_decode(urldecode(substr($rawPayload, 8)), true);
} else {
    $payload = json_decode($rawPayload, true);
}
if (json_last_error() !== JSON_ERROR_NONE && !empty($rawPayload)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON payload received']);
    exit;
}

// 6. Handle GitHub Ping Event (initial webhook test handshake)
if ($githubEvent === 'ping') {
    echo json_encode([
        'success' => true,
        'event' => 'ping',
        'message' => 'GitHub Webhook Ping successfully acknowledged! SAN Furniture cPanel auto-deploy is active.',
        'zen' => $payload['zen'] ?? 'Responsive dropshipping e-commerce.',
        'hookId' => $payload['hook_id'] ?? null,
        'timestamp' => date('c')
    ], JSON_PRETTY_PRINT);
    exit;
}

// 7. Handle GitHub Push Event
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

    // Determine project root directory
    $projectRoot = __DIR__;
    if (!is_dir($projectRoot . '/.git') && is_dir(dirname($projectRoot) . '/.git')) {
        $projectRoot = dirname($projectRoot);
    }

    chdir($projectRoot);

    // Git pull or fetch & reset
    exec("git fetch origin {$branch} 2>&1", $output, $exitCode);
    exec("git reset --hard origin/{$branch} 2>&1", $output, $exitCode);

    // Touch tmp/restart.txt to restart Phusion Passenger Node.js app on cPanel
    $restartDirs = [
        $projectRoot . '/tmp',
        $projectRoot . '/apps/storefront/tmp'
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

echo json_encode([
    'success' => true,
    'message' => "Event '{$githubEvent}' received, no deployment action required."
]);
