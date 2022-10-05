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

  // project title optional
  if(isset($_POST['projecttitle'])) {
    $projecttitle = $_POST['projecttitle'];
  }


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
  if(count($existingProjects) > 0) {
    echo json_encode(["status" => false, "message" => "projectname already exists!"]);
    return;
  }

  // set values
  $projectpath = $projectsDir . $username . '/' . $projectname;
  
  // TODO actually create project dir/file - fail database entry if something goes wrong!
  try {
    if(!mkdir($projectpath, 0777, true)) { // TODO relative to basedir?
      throw new RuntimeException("ERROR: Could not create project dir: " . $projectpath);
    }
    // create default sounds dirs
    mkdir($projectpath . "/sounds/ogg", 0777, true);
    mkdir($projectpath . "/sounds/mp3", 0777, true);

    // create empty project file
    $projectfile = $projectpath . '/project.json';
    // TODO read from template?
    $default_project_json = "{\n" .
      "  \"info\": {\n" .
      "    \"name\": \"$projectname\",\n" .
      "    \"title\": \"$projecttitle\",\n" .
      "    \"composer\": \"$fullname\"\n" .
      "  },\n" .
      "  \"interface\": {\n" .
      "    \"startSegment\": \"\",\n" .
      "    \"defaultOutro\": \"\"\n" .
      "  },\n" .
      "  \"segments\": [],\n" .
      "  \"triggers\": [],\n" .
      "  \"parameters\": []\n" .
      "}";
    file_put_contents($projectfile, $default_project_json);
  } catch(Exception $e) {
    echo json_encode(["status" => false, "message" => $e]);
    return;
  }

  // Add to database
  $statement = $pdo->prepare("INSERT INTO user_projects (username, projectname, projecttitle, projectpath, createdate) VALUES (:username, :projectname, :projecttitle, :projectpath, :createdate)");
  $status = $statement->execute(["username" => $username, "projectname" => $projectname, "projecttitle" => $projecttitle, "projectpath" => $projectpath, "createdate" => time()]);

  echo json_encode(["status" => $status]);
?>