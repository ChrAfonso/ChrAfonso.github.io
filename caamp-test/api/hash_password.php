<?php
  if(!isset($_POST['password'])) {
    throw new RuntimeException('ERROR: no password set!');
  }

  // TODO return as json?
  echo password_hash($_POST['password'], PASSWORD_BCRYPT);
?>
