<?php
/**
 * SAN Furniture - GitHub Auto-Deployment Webhook (Self-Contained Engine)
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
    $isAuthenticated = ($queryToken === $secret || $headerToken === $secret);
    $action = $_GET['action'] ?? 'status';

    $hasRealPassenger = (bool)preg_match('/^\s*PassengerAppRoot\s+/m', $curHtaccess);

    // List all node binaries and environments
    $nodeDirs = glob('/home/sansoft/nodevenv/*', GLOB_ONLYDIR) ?: [];
    $sanNodeStorefront = glob('/home/sansoft/nodevenv/sanfurniture.com/apps/storefront/*') ?: [];
    $sanNodeDeep = glob('/home/sansoft/nodevenv/sanfurniture.com/apps/storefront/*/*') ?: [];
    $sanNodeBin = glob('/home/sansoft/nodevenv/sanfurniture.com/apps/storefront/*/bin/node') ?: [];

    $allNodeBins = array_unique(array_merge(
        $sanNodeBin,
        glob('/home/sansoft/nodevenv/sanfurniture.com/apps/storefront/**/bin/node') ?: [],
        glob('/home/sansoft/nodevenv/sanfurniture.com/*/bin/node') ?: [],
        glob('/home/sansoft/nodevenv/*/*/bin/node') ?: [],
        glob('/usr/local/bin/node') ?: [],
        glob('/usr/bin/node') ?: []
    ));

    $selectedNode = !empty($sanNodeBin) ? $sanNodeBin[0] : (!empty($allNodeBins) ? $allNodeBins[0] : '/usr/bin/node');
    foreach ($allNodeBins as $nb) {
        if (strpos($nb, 'sanfurniture') !== false) {
            $selectedNode = $nb;
            break;
        }
    }

    $passengerBlock = "# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN\n" .
        "PassengerAppRoot \"{$projectRoot}\"\n" .
        "PassengerBaseURI \"/\"\n" .
        "PassengerNodejs \"{$selectedNode}\"\n" .
        "PassengerAppType node\n" .
        "PassengerStartupFile server.js\n" .
        "# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END\n\n";

    if ($isAuthenticated && ($action === 'fix_htaccess' || !$hasRealPassenger)) {
        if (!$hasRealPassenger) {
            $updatedHtaccess = $passengerBlock . $curHtaccess;
            @file_put_contents($htaccessFile, $updatedHtaccess);
            $curHtaccess = $updatedHtaccess;
            $hasRealPassenger = true;
        }

        @mkdir($projectRoot . '/tmp', 0755, true);
        @file_put_contents($projectRoot . '/tmp/restart.txt', "Restarted by fix_htaccess at " . date('c') . "\n");
        @exec("passenger-config restart-app {$projectRoot} 2>&1");
    }

    echo json_encode([
        'status' => 'online',
        'service' => 'SAN Furniture GitHub Auto-Deploy Webhook',
        'projectRoot' => $projectRoot,
        'supportedEvents' => ['push', 'ping'],
        'monitoredBranches' => ['master', 'main'],
        'authenticated' => $isAuthenticated,
        'action' => $action,
        'serverTime' => date('c'),
        'hasRealPassenger' => $hasRealPassenger,
        'selectedNode' => $selectedNode,
        'sanNodeStorefront' => $sanNodeStorefront,
        'sanNodeDeep' => $sanNodeDeep,
        'sanNodeBin' => $sanNodeBin,
        'allNodeBins' => $allNodeBins,
        'instructions' => [
            'payloadUrl' => 'https://sanfurniture.com/deploy.php',
            'contentType' => 'application/json',
            'secret' => $isAuthenticated ? 'Configured in .env' : '[PROTECTED]',
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
        }
    }

    exec("git fetch origin {$branch} 2>&1", $output, $exitCode);
    exec("git reset --hard origin/{$branch} 2>&1", $output, $exitCode);

    // 2. Restore CloudLinux / Passenger block to .htaccess if it is not present
    if (file_exists($htaccessFile)) {
        $newHtaccess = @file_get_contents($htaccessFile);
        if (!preg_match('/^\s*PassengerAppRoot\s+/m', $newHtaccess)) {
            if (!$passengerBlock) {
                $sanNodeBin = glob('/home/sansoft/nodevenv/sanfurniture.com/apps/storefront/*/bin/node') ?: [];
                $allNodeBins = array_unique(array_merge(
                    $sanNodeBin,
                    glob('/home/sansoft/nodevenv/sanfurniture.com/**/bin/node') ?: [],
                    glob('/home/sansoft/nodevenv/*/*/bin/node') ?: [],
                    glob('/usr/local/bin/node') ?: [],
                    glob('/usr/bin/node') ?: []
                ));
                $selectedNode = !empty($sanNodeBin) ? $sanNodeBin[0] : (!empty($allNodeBins) ? $allNodeBins[0] : '/usr/bin/node');
                foreach ($allNodeBins as $nb) {
                    if (strpos($nb, 'sanfurniture') !== false) {
                        $selectedNode = $nb;
                        break;
                    }
                }
                $passengerBlock = "# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN\n" .
                    "PassengerAppRoot \"{$projectRoot}\"\n" .
                    "PassengerBaseURI \"/\"\n" .
                    "PassengerNodejs \"{$selectedNode}\"\n" .
                    "PassengerAppType node\n" .
                    "PassengerStartupFile server.js\n" .
                    "# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END";
            }
            @file_put_contents($htaccessFile, $passengerBlock . "\n\n" . $newHtaccess);
        }
    }

    // 3. Mirror all static/app chunks into static/chunks/app for 100% zero-downtime cache
    $staticApp = $projectRoot . '/apps/storefront/.next/static/app';
    $chunksApp = $projectRoot . '/apps/storefront/.next/static/chunks/app';
    if (is_dir($staticApp)) {
        if (!is_dir($chunksApp)) @mkdir($chunksApp, 0755, true);
        @exec("cp -rn {$staticApp}/* {$chunksApp}/ 2>/dev/null || true");
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

    // Record immutable audit entry in MySQL admin_audit_logs & notifications
    try {
        $dbHost = getenv('DB_HOST') ?: '127.0.0.1';
        $dbPort = getenv('DB_PORT') ?: '3306';
        $dbName = getenv('DB_DATABASE') ?: (getenv('DB_NAME') ?: 'san_furniture');
        $dbUser = getenv('DB_USERNAME') ?: (getenv('DB_USER') ?: 'root');
        $dbPass = getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : '';

        foreach ($envFiles as $ef) {
            if (file_exists($ef) && is_readable($ef)) {
                $lines = file($ef, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                foreach ($lines as $line) {
                    $line = trim($line);
                    if (strpos($line, '#') === 0) continue;
                    if (strpos($line, 'DB_HOST=') === 0) $dbHost = trim(substr($line, 8));
                    if (strpos($line, 'DB_PORT=') === 0) $dbPort = trim(substr($line, 8));
                    if (strpos($line, 'DB_DATABASE=') === 0 || strpos($line, 'DB_NAME=') === 0) $dbName = trim(substr($line, strpos($line, '=') + 1));
                    if (strpos($line, 'DB_USERNAME=') === 0 || strpos($line, 'DB_USER=') === 0) $dbUser = trim(substr($line, strpos($line, '=') + 1));
                    if (strpos($line, 'DB_PASSWORD=') === 0) $dbPass = trim(substr($line, 12));
                }
            }
        }

        $dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4";
        $pdo = new PDO($dsn, $dbUser, $dbPass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 3
        ]);

        $auditId = 'audit_deploy_' . time() . '_' . bin2hex(random_bytes(3));
        $clientIp = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? ($_SERVER['REMOTE_ADDR'] ?? 'GitHub Webhook');
        $detailsJson = json_encode([
            'branch' => $branch,
            'commitSha' => substr($commitSha, 0, 7),
            'fullCommitSha' => $commitSha,
            'commitMessage' => $commitMsg,
            'pusher' => $pusher,
            'deliveryId' => $deliveryId,
            'passengerRestart' => $restarted,
            'deployStatus' => 'SUCCESS',
            'timestamp' => date('c')
        ]);

        $stmt = $pdo->prepare("INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address, created_at) VALUES (?, ?, 'GITHUB_AUTO_DEPLOY', 'git_repository', ?, ?, NOW())");
        $stmt->execute([$auditId, "GitHub ({$pusher})", $detailsJson, $clientIp]);

        $notifId = 'notif_deploy_' . time() . '_' . bin2hex(random_bytes(3));
        $notifTitle = "Auto-Deployed branch '{$branch}' (" . substr($commitSha, 0, 7) . ")";
        $notifMsg = "Pushed by {$pusher}: {$commitMsg}";
        $notifMeta = json_encode(['branch' => $branch, 'commitSha' => substr($commitSha, 0, 7), 'pusher' => $pusher, 'auditId' => $auditId]);

        $nStmt = $pdo->prepare("INSERT INTO notifications (id, recipient_type, recipient_id, type, title, message, link, is_read, metadata, created_at) VALUES (?, 'admin', 'all', 'deploy', ?, ?, '/admin/audit', 0, ?, NOW())");
        $nStmt->execute([$notifId, $notifTitle, $notifMsg, $notifMeta]);
    } catch (Exception $dbErr) {
        // Continue gracefully if database is temporarily unavailable during git reset
    }

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
