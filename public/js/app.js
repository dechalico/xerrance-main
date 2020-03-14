function confirmPassword(pas1,pas2){
  const p1 = document.getElementById(pas1);
  const p2 = document.getElementById(pas2);
  console.log(p1);
  if(p1.value === p2.value){
    console.log(p1.value + " " + p2.value);
    return true;
  }
  else{
    alert('Invalid password');
    return false
  }
};