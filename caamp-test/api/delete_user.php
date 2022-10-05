<?php
  // TODO CFG_LOCAL?
  $projectsDir = 'C:/Users/Christian/Documents/Homepage/violins-against-aliens/dist/projects/';
  
  header('Content-Type: application/json');

  // Read and verify input
  // TODO: accept json input (too?)?

  // username (=alias) required, has to be unique
  if(!isset($_POST['name'])) {
    echo json_encode(["status" => false, "message" => 'no name set!']);
    return;
  }
  $username = $_POST['name'];

  // password required
  if(!isset($_POST['password'])) {
    echo json_encode(["status" => false, "message" => 'no password set!']);
    return;
  }
  $password = $_POST['password'];

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

  // Delete user's projects via api delegation
  $statement = $pdo->prepare("SELECT * FROM user_projects WHERE username = :username");
  $statement->execute(["username" => $username]);
  $existingProjects = $statement->fetchAll();
  $projects_deleted = 0;
  if(count($existingProjects) > 0) {
    $errors = false;

    // Call delete_project instead, which cleans up project dirs
    foreach($existingProjects as $existingProject) {
      $ch = curl_init();
      try {
        $projectname = $existingProject['projectname'];
        curl_setopt($ch, CURLOPT_URL, "http://localhost/violins-against-aliens/dist/api/delete_project.php");
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS , ["user" => $username, "password" => $password, "projectname" => $projectname]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); // don't echo
        $output = curl_exec($ch);
        curl_close($ch);
      } catch(Exception $e) {
        $errors = true;
      } finally {
        curl_close($ch);
      }
      if($errors == true) break;
    }
    
    if($errors == false) {
      rmdir($projectsDir . "/" . $username); // should now be empty
      $projects_deleted = count($existingProjects);
    } else {
      echo json_encode(["status" => false, "message" => "ERROR while deleting user project dirs: " . curl_error($ch)]);
      return;
    }
  }

  // Delete user
  $status = $pdo->exec("DELETE FROM users WHERE username = " . $pdo->quote($username));
  
  if($status === false) {
    echo json_encode(["status" => false, "message" => "Could not delete user"]);
  } else if($status === 0) {
    echo json_encode(["status" => false, "message" => "No rows affected"]);
  } else {
    echo json_encode(["status" => true, "rows_affected" => $status, "projects_deleted" => $projects_deleted]);
  }

  // TODO delete user dir
?>