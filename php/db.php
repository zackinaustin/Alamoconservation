<?php
include 'dbinfo.php';
function my_error_handler()
{
    $last_error = error_get_last();
    if ($last_error && $last_error['type'] == E_ERROR) {
        header("HTTP/1.1 500 Internal Server Error");
        echo '...'; //html for 500 page
    }
}
register_shutdown_function('my_error_handler');
if (isset($_POST['data'])) {
    $insert_json = $_POST['data'];
}
try {
    $m = new MongoClient($url);
}
catch (Exception $e) {
    header("Status: 500 Server Error");
    var_dump($e->getMessage());
}
$db         = $m->selectDB($db_name);
$collection = $db->selectCollection($collection_name);
try {
    $dataRetrieveQuery = array(
        'name' => 'A'
    );
    $retrieveCursor    = $collection->find($dataRetrieveQuery);
    if ($retrieveCursor->count() > 0) {
        $retrieveCursor->next();
        $retrieveCursor = $retrieveCursor->current();
        $r_GeoJson      = $retrieveCursor['geoJSON'];
    } else {
        return false;
    }
}
catch (Exception $e) {
    header("Status: 500 Server Error");
    var_dump($e->getMessage());
}
$r_data           = json_decode($r_GeoJson);
$insert           = json_decode($insert_json);
$r_data->features = $insert->features;
$w_data_json      = json_encode($r_data);
try {
    $cursor = $collection->update(array(
        'name' => 'A'
    ), array(
        '$set' => array(
            'geoJSON' => $w_data_json
        )
    ));
    //  throw new Exception('error');
}
catch (Exception $e) {
    header("Status: 500 Server Error");
    var_dump($e->getMessage());
}
?>