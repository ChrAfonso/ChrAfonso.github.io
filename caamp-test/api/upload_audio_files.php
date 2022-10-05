<?php
  // TODO CFG_LOCAL?
  $projectsDir = 'C:/Users/Christian/Documents/Homepage/violins-against-aliens/dist/projects/';

  // prepare database connection
  $GLOBALS['pdo'] = new PDO('mysql:host=localhost;dbname=caamp', 'root', ''); // TODO credentials?

  if(isset($_POST['user'])) {
    $GLOBALS['username'] = $_POST['user'];
  } else {
    $GLOBALS['username'] = "unknown_user";
  }
  $GLOBALS['time'] = time();

  // === DEBUG INPUT ===
  
  write_log("\nPost: ");
  foreach($_POST as $postKey => $postValue) {
    write_log("\n" . $postKey . " => ");
    write_log($postKey == 'password' ? '******' : $postValue);
  }
  
  write_log("\nFiles: ");
  foreach($_FILES as $fileKey => $fileValue) {
    write_log("\n" . $fileKey . " => ");
    write_log($fileValue);
  }

  // === VALIDATE INPUT ===
  
  try {
    // TODO user and token/password also from cookie?

    if(!isset($_POST['user'])) throw new RuntimeException('user not set!');
    $username = $_POST['user'];
    // Check if username exists
    $statement = $GLOBALS['pdo']->prepare("SELECT * FROM users WHERE username = :username");
    $statement->execute(["username" => $username]);
    $existingUsers = $statement->fetchAll();
    if(count($existingUsers) == 0) {
      echo json_encode(["status" => false, "message" => "username doesn't exist!"]);
      return;
    }

    if(!isset($_POST['password'])) throw new RuntimeException('password not set!');
    $password = $_POST['password'];
    // Check if password correct (=authorize!)
    $passhash = $existingUsers[0]['passhash'];
    if(!password_verify($password, $passhash)) {
      echo json_encode(["status" => false, "message" => "password incorrect!"]);
      return;
    }
    
    if(!isset($_POST['projectname'])) throw new RuntimeException('projectname not set!');
    $projectname = $_POST['projectname'];
    if(!has_user_project($username, $projectname)) {
      throw new RuntimeException('project does not exist!');
    }
  } catch(Exception $exception) {
    echo json_encode(["status" => false, "message" => $exception->getMessage()]);
    return;
  }

  // === PROCESS INPUT ===

  foreach($_FILES as $file) {
    // check for errors
    switch ($file['error']) {
      case UPLOAD_ERR_OK:
          break;
      case UPLOAD_ERR_NO_FILE:
          throw new RuntimeException('No file sent.');
      case UPLOAD_ERR_INI_SIZE:
      case UPLOAD_ERR_FORM_SIZE:
          throw new RuntimeException('Exceeded filesize limit.');
      default:
          throw new RuntimeException('Unknown errors.');
    }

    // check max file size OR user quota
    // TODO

    // check file type
    $extension = substr($file['name'], strrpos($file['name'], '.') + 1);
    switch($extension) {
      case 'ogg':
        $fileType = 'ogg';
        break;
      case 'mp3':
        $fileType = 'mp3';
        break;
      default:
        write_log('WARNING: file type not supported: ' . $extension);
        continue 2; // ---------------------------------------------
    }
    
    // set upload path
    $targetDir = $projectsDir . $username . "/" . $projectname . '/sounds/' . $fileType;
    $targetFilename = $file['name']; // TODO encode? (when storing in database)
    write_log("\nUpload file: " . $file['name'] . ' (size: ' . $file['size'] . ')');
    write_log("\n  to: " . $targetDir . "/" . $targetFilename);

    // upload
    try {
      if(!move_uploaded_file($file['tmp_name'], $targetDir . '/' . $targetFilename)) {
        throw new RuntimeException('Could not move file!');
      } else {
        write_log("\nDone.");
      }
    } catch(Exception $exception) {
      echo json_encode(["status" => false, "message" => 'Exception during Upload: ' . $exception->getMessage()]);
      return;
    }

    // TODO add to project? (update library)
  }

  // no errors if we arrive here
  echo json_encode(["status" => true, "message" => count($_FILES) . " files uploaded"]);
  return;

  // === Functions ===

  function has_user_project($username, $projectname) {
    $statement = $GLOBALS['pdo']->prepare("SELECT * FROM user_projects WHERE username = :username AND projectname = :projectname");
    $statement->execute(["username" => $username, "projectname" => $projectname]);
    $existingProjects = $statement->fetchAll();
    if(count($existingProjects) == 0) {
      return false;
    } else {
      return true;
    }
  }

  // TODO move to util module
  function write_log($message) {
    $logfile = 'C:/Users/Christian/Documents/Homepage/violins-against-aliens/logs/log_' . $GLOBALS['username'] . '_' . $GLOBALS['time'] . '.log';
    file_put_contents($logfile, $message, FILE_APPEND);
  }
?>