<?php
/**
 * SAN Furniture - GitHub Auto-Deployment Webhook (Public Mirror)
 * Forwards to root deploy.php if present, or executes deployment.
 */
if (file_exists(dirname(dirname(__DIR__)) . '/deploy.php')) {
    require_once dirname(dirname(__DIR__)) . '/deploy.php';
} elseif (file_exists(dirname(__DIR__) . '/deploy.php')) {
    require_once dirname(__DIR__) . '/deploy.php';
} else {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'online', 'service' => 'SAN Furniture Webhook (Public)']);
}
