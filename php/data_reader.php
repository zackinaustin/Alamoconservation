<?php
try {
    $m                 = new MongoClient("mongodb://tahoe.ischool.utexas.edu/");
    $db                = $m->AlamoConservation;
    $collection        = $db->walls;
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
echo $r_GeoJson;
?>