<?php
  // TODO CFG_LOCAL?
  $projectsDir = 'C:/Users/Christian/Documents/Homepage/violins-against-aliens/dist/projects/';

  header('Content-Type: application/json');

  // Read and verify input
  // TODO: accept json input (too?)?

  // username (=alias) required, has to be unique
  if(!isset($_POST['user'])) {
    echo json_encode(["status" => false, "message" => "no user set!"]);
    return;
  }
  $username = $_POST['user'];

  // password required - TODO or read hash from cookie
  if(!isset($_POST['password'])) {
    echo json_encode(["status" => false, "message" => "no password set!"]);
    return;
  }
  $password = $_POST['password'];

  // project name required
  if(!isset($_POST['projectname'])) {
    echo json_encode(["status" => false, "message" => "no projectname set!"]);
    return;
  }
  $projectname = $_POST['projectname'];

  // project json
  if(!isset($_POST['projectjson'])) {
    echo json_encode(["status" => false, "message" => "no projectjson set!"]);
  }
  $projectjson = $_POST['projectjson'];


  // prepare database connection
  $pdo = new PDO('mysql:host=localhost;dbname=caamp', 'root', ''); // TODO credentials?
  
  // Check if username exists
  $statement = $pdo->prepare("SELECT * FROM users WHERE username = :username");
  $statement->execute(["username" => $username]);
  $existingUsers = $statement->fetchAll();
  if(count($existingUsers) == 0) {
    echo json_encode(["status" => false, "message" => "username doesn't exist!"]);
    return;
  }
  // Check if password correct (=authorize!)
  $passhash = $existingUsers[0]['passhash'];
  if(!password_verify($password, $passhash)) {
    echo json_encode(["status" => false, "message" => "password incorrect!"]);
    return;
  }

  // Check if projectname exists
  $statement = $pdo->prepare("SELECT * FROM user_projects WHERE username = :username AND projectname = :projectname");
  $statement->execute(["username" => $username, "projectname" => $projectname]);
  $existingProjects = $statement->fetchAll();
  if(count($existingProjects) == 0) {
    echo json_encode(["status" => false, "message" => "projectname doesn't exists!"]);
    return;
  }

  // set values
  $projectpath = $projectsDir . $username . '/' . $projectname;
  $projectfile = $projectpath . '/project.json';
  
  // save to project file
  try {
    file_put_contents($projectfile, urldecode($projectjson));
  } catch(Exception $e) {
    echo json_encode(["status" => false, "message" => $e]);
    return;
  }

  // Update to database - change date?
  // TODO

  echo json_encode(["status" => true]); // hardcoded - if we arrive here it's fine
?>