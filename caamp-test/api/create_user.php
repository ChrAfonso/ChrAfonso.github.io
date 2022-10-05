<?php
  header('Content-Type: application/json');

  // Read and verify input
  // TODO: accept json input (too?)?

  // username (=alias) required, has to be unique
  if(!isset($_POST['name'])) {
    throw new RuntimeException('ERROR: no name set!');
  }
  $username = $_POST['name'];

  // fullname (optional)
  if(!isset($_POST['fullname'])) $_POST['fullname'] = '';
  $fullname = $_POST['fullname'];
  
  // email required
  if(!isset($_POST['email'])) {
    throw new RuntimeException('ERROR: no email set!');
  }
  $email = $_POST['email'];

  // password required
  if(!isset($_POST['password'])) {
    throw new RuntimeException('ERROR: no password set!');
  }
  $password = $_POST['password'];

  // prepare database connection
  $pdo = new PDO('mysql:host=localhost;dbname=caamp', 'root', ''); // TODO credentials?
  
  // Check if username exists
  $statement = $pdo->prepare("SELECT * FROM users WHERE username = :username");
  $statement->execute(["username" => $username]);
  $existingUsers = $statement->fetchAll();
  if(count($existingUsers) > 0) {
    echo json_encode(["status" => false, "message" => "username already exists!"]);
    return;
  }

  // Create password hash
  $passhash = password_hash($password, PASSWORD_BCRYPT);

  // Add to database
  $statement = $pdo->prepare("INSERT INTO users (username, fullname, email, passhash, joindate) VALUES (:username, :fullname, :email, :passhash, :joindate)");
  $status = $statement->execute(["username" => $username, "fullname" => $fullname, "email" => $email, "passhash" => $passhash, "joindate" => time()]);

  echo json_encode(["status" => $status]);
?>