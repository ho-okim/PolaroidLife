document.getElementById('join-form').addEventListener('submit', function(event){
  event.preventDefault() 

  let userEmail = document.getElementById('email').value
  let userPw = document.getElementById('passwd').value

  console.log(userEmail, userPw)

  // 내일 해결해야 할 문제... 비밀번호만 중복돼도 이미 가입된 회원이라고 뜸 미쳤냐?
  // isFind가 이상하게 동작함...
  if (!userEmail) {
    alert('이메일을 입력해주세요.');
  } else if (!userPw) {
    alert('유저 비밀번호를 입력해주세요.')
  }  else this.submit()
})