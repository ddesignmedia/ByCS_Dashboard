<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(["error" => "Method not allowed"]));
}

$jsonData = file_get_contents('php://input');
$data = json_decode($jsonData, true);

if (!$data || !isset($data['roomId'])) {
    http_response_code(400);
    exit(json_encode(["error" => "Invalid or missing JSON data or Room ID"]));
}

$roomId = preg_replace('/[^a-zA-Z0-9-]/', '', $data['roomId']);

$targetDir = __DIR__ . '/../student_portal/';
$targetFile = $targetDir . 'data_' . $roomId . '.json';

if (!is_dir($targetDir)) {
    mkdir($targetDir, 0755, true);
}

if (file_put_contents($targetFile, $jsonData)) {
    http_response_code(200);
    echo json_encode(["success" => "Data saved successfully", "room" => $roomId]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Failed to write file"]);
}
?>
