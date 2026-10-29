<?php
/**
 * SAN Furniture - GitHub Auto-Deployment Webhook (Self-Contained Engine)
 *
 * Automatically pulls new commits from GitHub when pushed to 'master' or 'main'
 * and triggers Phusion Passenger Node.js app restart via tmp/restart.txt.
 * Records immutable deployment audit trail in MySQL admin_audit_logs & notifications.
 *
 * GitHub Webhook Setup:
 * 1. Payload URL: https://sanfurniture.com/deploy.php
 * 2. Content type: application/json
 * 3. Secret: san_furniture_auto_deploy_master_secret_2026
 * 4. Events: Just the push event
 */

header('Content-Type: application/json; charset=utf-8');

if (!function_exists('cleanEnvVal')) {
    function cleanEnvVal($val) {
        $val = trim($val);
        if (strlen($val) >= 2) {
            $first = $val[0];
            $last = $val[strlen($val) - 1];
            if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
                return substr($val, 1, -1);
            }
        }
        return $val;
    }
}

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

// 2. Resolve Deployment Secret & Database Credentials
$secret = getenv('DEPLOY_SECRET') ?: (getenv('SAN_AUTH_SECRET') ?: 'san_furniture_auto_deploy_master_secret_2026');
$dbHost = getenv('DB_HOST') ?: '127.0.0.1';
$dbPort = getenv('DB_PORT') ?: '3306';
$dbName = getenv('DB_DATABASE') ?: (getenv('DB_NAME') ?: 'sansoft_san_furniture');
$dbUser = getenv('DB_USERNAME') ?: (getenv('DB_USER') ?: 'root');
$dbPass = getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : '';

$envFiles = [
    $projectRoot . '/.env',
    $projectRoot . '/.env.production',
    $projectRoot . '/.env.local',
    $projectRoot . '/.env.production.local',
    $projectRoot . '/apps/storefront/.env',
    $projectRoot . '/apps/storefront/.env.production',
    $projectRoot . '/apps/storefront/.env.local',
    $projectRoot . '/apps/storefront/.env.production.local',
    dirname($projectRoot) . '/.env',
    __DIR__ . '/.env',
    __DIR__ . '/../.env'
];

$existingEnvFiles = [];
foreach ($envFiles as $ef) {
    if (file_exists($ef) && is_readable($ef)) {
        $existingEnvFiles[] = $ef;
        $lines = @file($ef, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (!$lines) continue;
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || strpos($line, '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                list($k, $v) = explode('=', $line, 2);
                $k = trim($k);
                $v = cleanEnvVal($v);
                if ($k === 'DEPLOY_SECRET') $secret = $v;
                if ($k === 'SAN_AUTH_SECRET' && $secret === 'san_furniture_auto_deploy_master_secret_2026') $secret = $v;
                if ($k === 'DB_HOST') $dbHost = $v;
                if ($k === 'DB_PORT') $dbPort = $v;
                if ($k === 'DB_DATABASE' || $k === 'DB_NAME') $dbName = $v;
                if ($k === 'DB_USERNAME' || $k === 'DB_USER') $dbUser = $v;
                if ($k === 'DB_PASSWORD') $dbPass = $v;
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

    $htaccessFile = $projectRoot . '/.htaccess';
    $curHtaccess = file_exists($htaccessFile) ? (string)@file_get_contents($htaccessFile) : '';
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

    if ($isAuthenticated && $action === 'fix_htaccess') {
        try {
            if (!$hasRealPassenger) {
                $updatedHtaccess = $passengerBlock . $curHtaccess;
                @file_put_contents($htaccessFile, $updatedHtaccess);
                $curHtaccess = $updatedHtaccess;
                $hasRealPassenger = true;
            }

            @mkdir($projectRoot . '/tmp', 0755, true);
            @file_put_contents($projectRoot . '/tmp/restart.txt', "Restarted by fix_htaccess at " . date('c') . "\n");
            @exec("passenger-config restart-app {$projectRoot} 2>&1");
        } catch (Exception $e) {}
    }

    // Diagnostic mode to inspect DB and environment safely
    if ($isAuthenticated && $action === 'diag') {
        $dbConnected = false;
        $dbError = null;
        $hostUsed = null;
        $auditLogsCount = 0;
        $hostsToTry = array_unique([$dbHost, '127.0.0.1', 'localhost']);
        foreach ($hostsToTry as $h) {
            try {
                $dsn = "mysql:host={$h};port={$dbPort};dbname={$dbName};charset=utf8mb4";
                $pdo = new PDO($dsn, $dbUser, $dbPass, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_TIMEOUT => 3
                ]);
                $dbConnected = true;
                $hostUsed = $h;
                $cStmt = $pdo->query("SELECT COUNT(*) FROM admin_audit_logs");
                $auditLogsCount = (int)$cStmt->fetchColumn();
                break;
            } catch (Exception $e) {
                $dbError = $e->getMessage();
            }
        }

        echo json_encode([
            'status' => 'diagnostic',
            'projectRoot' => $projectRoot,
            'existingEnvFiles' => $existingEnvFiles,
            'dbHost' => $dbHost,
            'dbPort' => $dbPort,
            'dbName' => $dbName,
            'dbUser' => $dbUser,
            'dbConnected' => $dbConnected,
            'hostUsed' => $hostUsed,
            'auditLogsCount' => $auditLogsCount,
            'dbError' => $dbError,
            'pdoAvailable' => extension_loaded('pdo_mysql'),
            'curlAvailable' => extension_loaded('curl'),
            'serverTime' => date('c')
        ], JSON_PRETTY_PRINT);
        exit;
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
    $auditSuccess = false;
    $auditMethod = null;
    $auditErrorMsg = null;

    $hostsToTry = array_unique([$dbHost, '127.0.0.1', 'localhost']);
    $pdo = null;
    foreach ($hostsToTry as $h) {
        try {
            $dsn = "mysql:host={$h};port={$dbPort};dbname={$dbName};charset=utf8mb4";
            $p = new PDO($dsn, $dbUser, $dbPass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 3
            ]);
            $pdo = $p;
            break;
        } catch (Exception $e) {
            $auditErrorMsg = $e->getMessage();
        }
    }

    $clientIp = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? ($_SERVER['REMOTE_ADDR'] ?? 'GitHub Webhook');
    $detailsData = [
        'branch' => $branch,
        'commitSha' => substr($commitSha, 0, 7),
        'fullCommitSha' => $commitSha,
        'commitMessage' => $commitMsg,
        'pusher' => $pusher,
        'deliveryId' => $deliveryId,
        'passengerRestart' => $restarted,
        'deployStatus' => 'SUCCESS',
        'timestamp' => date('c')
    ];
    $detailsJson = json_encode($detailsData);

    if ($pdo) {
        try {
            $auditId = 'audit_deploy_' . time() . '_' . bin2hex(random_bytes(3));
            $stmt = $pdo->prepare("INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address, created_at) VALUES (?, ?, 'GITHUB_AUTO_DEPLOY', 'git_repository', ?, ?, NOW())");
            $stmt->execute([$auditId, "GitHub ({$pusher})", $detailsJson, $clientIp]);

            $notifId = 'notif_deploy_' . time() . '_' . bin2hex(random_bytes(3));
            $notifTitle = "Auto-Deployed branch '{$branch}' (" . substr($commitSha, 0, 7) . ")";
            $notifMsg = "Pushed by {$pusher}: {$commitMsg}";
            $notifMeta = json_encode(['branch' => $branch, 'commitSha' => substr($commitSha, 0, 7), 'pusher' => $pusher, 'auditId' => $auditId]);

            $nStmt = $pdo->prepare("INSERT INTO notifications (id, recipient_type, recipient_id, type, title, message, link, is_read, metadata, created_at) VALUES (?, 'admin', 'all', 'deploy', ?, ?, '/admin/audit', 0, ?, NOW())");
            $nStmt->execute([$notifId, $notifTitle, $notifMsg, $notifMeta]);

            $auditSuccess = true;
            $auditMethod = 'direct_pdo';
        } catch (Exception $dbErr) {
            $auditErrorMsg = $dbErr->getMessage();
        }
    }

    // Failsafe HTTP fallback to Next.js API if PDO direct insert failed or was unavailable
    if (!$auditSuccess) {
        $apiUrls = [
            'http://127.0.0.1:3000/api/admin/audit',
            'https://sanfurniture.com/api/admin/audit'
        ];
        foreach ($apiUrls as $apiUrl) {
            $ch = curl_init($apiUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'X-Deploy-Secret: ' . $secret
            ]);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
                'actor' => "GitHub ({$pusher})",
                'action' => 'GITHUB_AUTO_DEPLOY',
                'resource' => 'git_repository',
                'details' => $detailsData,
                'ipAddress' => $clientIp
            ]));
            curl_setopt($ch, CURLOPT_TIMEOUT, 4);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            $resp = @curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            @curl_close($ch);

            if ($httpCode >= 200 && $httpCode < 300) {
                $auditSuccess = true;
                $auditMethod = 'http_api_fallback';
                $auditErrorMsg = null;
                break;
            }
        }
    }

    echo json_encode([
        'success' => true,
        'message' => "Auto-deployment successfully executed on cPanel",
        'branch' => $branch,
        'commitSha' => $commitSha,
        'pusher' => $pusher,
        'deliveryId' => $deliveryId,
        'passengerRestartTriggered' => $restarted,
        'auditLogged' => $auditSuccess,
        'auditMethod' => $auditMethod,
        'auditError' => $auditErrorMsg,
        'output' => array_slice($output, 0, 5),
        'timestamp' => date('c')
    ], JSON_PRETTY_PRINT);
    exit;
}

echo json_encode(['success' => true, 'message' => "Event '{$githubEvent}' received"]);
