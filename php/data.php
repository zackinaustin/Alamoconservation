<?php

if(isset($_POST['data'])){
	$insert=$_POST['data'];
	echo($insert);
}

$fileName = 'feature.json';
$data = file_get_contents($fileName);
$data_json = json_decode($data);
$insert_json=json_decode($insert);

array_push($data_json->features,$insert_json);
$jsonMobiles = json_encode($data_json);
file_put_contents('feature.json', $jsonMobiles);


print_r("insert");
?>