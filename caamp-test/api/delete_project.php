<?php
  // TODO CFG_LOCAL?
  $projectsDir = 'C:/Users/Christian/Documents/Homepage/violins-against-aliens/dist/projects/';

  // careful with this
  function rmrf($dir) {
    // safeguard
    if(strpos($dir, "projects/") < 0) {
      echo json_encode(["status" => false, "message" => "ERROR: Can only delete directories in 'projects'!"]);
      return;
    }

    foreach (glob($dir) as $file) {
      if (is_dir($file)) { 
        rmrf("$file/*");
        rmdir($file);
      } else {
        unlink($file);
      }
    }
  }

  header('Content-Type: application/json');

  // Read and verify input
  // TODO: accept json input (too?)?

  // username (=alias) required, has to be unique
  if(!isset($_POST['user'])) {
    echo json_encode(["status" => false, "message" => "no user set!"]);
    return;
  }
  $username = $_POST['user'];

  // password required
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


  // prepare database connection
  $pdo = new PDO('mysql:host=localhost;dbname=caamp', 'root', ''); // TODO credentials?
  
  // Check if username exists
  $statement = $pdo->prepare("SELECT * FROM users WHERE username = :username");
  $statement->execute(["username" => $username]);
  $existingUsers = $statement->fetchAll();
  if(count($existingUsers) == 0) {
    echo json_encode(["status" => false, "message" => "username incorrect!"]);
    return;
  } else {
    // get full name for project file
    $fullname = $existingUsers[0]['fullname'];
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
    echo json_encode(["status" => false, "message" => "projectname doesn't exist!"]);
    return;
  }

  // set values
  $projectpath = $projectsDir . $username . '/' . $projectname;
  
  // actually delete project dir - TODO fail if something goes wrong
  try {
    // delete default sounds dirs
    rmrf($projectpath . "/sounds/ogg");
    rmrf($projectpath . "/sounds/mp3");
    rmdir($projectpath . "/sounds"); // should now be empty
    unlink($projectpath . "/project.json");
    if(!rmdir($projectpath)) { // should now be empty
      throw new RuntimeException("ERROR: Could not delete project dir: " . $projectpath);
    }
  } catch(Exception $e) {
    echo json_encode(["status" => false, "message" => $e]);
    return;
  }

  // Remove from database
  $status = $pdo->exec("DELETE FROM user_projects WHERE username = " . $pdo->quote($username) . " AND projectname = " . $pdo->quote($projectname));
  if($status === false) {
    echo json_encode(["status" => false, "message" => "Could not delete user project!"]);
  } else {
    echo json_encode(["status" => true, "projects_deleted" => $status]);
  }
?>