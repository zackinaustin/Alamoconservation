<?php
/* session_save_path("/tmp");  */
// require("php/phpsqlajax_dbinfo.php");
session_start();

if(isset($_POST['username'])){
	$username=$_POST['username'];
}
if(isset($_POST['password'])){
	$psw=$_POST['password'];
}


/*
$link=mysqli_connect($hostname, $dbuser, $password, $dbname);
$dataquery="select * from user where username='".$username."' and password='".$psw."'";
$result=mysqli_query($link, $dataquery);
if (mysqli_num_rows($result) ){
	while ($row = mysqli_fetch_array($result)){
	  $_SESSION['id']=$row['iduser'];
	  session_write_close();
	  echo ($_SESSION['id']);
	  }
	  echo "<script>location.href='calendar.html';</script>";
	  echo "waiting";

  }else{
  echo "<script>location.href='login.html';</script>";
  echo "no waiting";
  }
*/
if($username == "admin" && $psw == "admin"){
	$_SESSION['id']=1;
	session_write_close();
	echo "1";
	// echo "<script>location.href='/AlamoConservation/index_view.html';</script>";

}else{
  // echo "<script>location.href='/AlamoConservation/login.html';</script>";
  echo "0";
  }


?>