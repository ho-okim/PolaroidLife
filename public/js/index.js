document.addEventListener('DOMContentLoaded', ()=>{
  let loginInfo = document.querySelector('.login-info')
  let loginState = loginInfo.dataset.loginState
  
  let postingSec = document.getElementsByClassName('posting')[0]
  let tag = ''

  if(loginState){
    tag = `<span class="username">${loginState}</span><span class="message">님 반갑습니다!</span><a href="/mypage" class="mypage">마이페이지</a><a href="/logout" class="logout">로그아웃</a>`
  } else{
    tag = '<a href="/login" class="login">로그인</a>'
  }

  loginInfo.innerHTML = tag
})

function isEmpty(content){
  if (content == "") {
    alert('내용을 입력해주세요!')
    return false
  } else {
    return true
  }
}

// 포스트 텍스트 비어있는지 체크
const postForm = document.getElementById('post-form')
if(postForm){
  postForm.addEventListener('submit', function(event){
    event.preventDefault() 

    let postContent = document.getElementById('post-text').value;
    
    if(isEmpty(postContent))
      this.submit()
  });
}


// textarea 크기 조정
let textarea = document.querySelectorAll('.blog-textarea')
let nicknameInput = document.querySelector('.mypage-nickname')
let introInput = document.querySelector('.mypage-intro')

function resize(el){
    el.style.height = "0px"

    let scrollHeight = el.scrollHeight
    let style = window.getComputedStyle(el)
    let borderTop = parseInt(style.borderTop);
    let borderBottom = parseInt(style.borderBottom);

    el.style.height = (scrollHeight + borderTop + borderBottom + 3) + "px"
}

// textarea 입력 중 사이즈 조절 코드(근데 문제 있는 듯 제대로 동작 안 함)
function handleResizeHeight(textarea){
  textarea.style.height = '0px'

  let style = window.getComputedStyle(textarea)
  let borderTop = parseInt(style.borderTop)
  let borderBottom = parseInt(style.borderBottom)
  textarea.style.height = (textarea.scrollHeight + borderTop + borderBottom + 3) + 'px'
}

if(textarea){
  window.addEventListener("load", textarea.forEach((el)=>{
    resize(el)
  }));
  window.onresize = textarea.forEach((el)=>{
    resize(el)
  });
  textarea.forEach((el)=>resize(el))
}
if(nicknameInput){
  window.addEventListener("load", resize(nicknameInput));
  window.onresize = resize(nicknameInput);
}
if(introInput){
  window.addEventListener("load", resize(introInput));
  window.onresize = resize(introInput);
}



// 포스트 수정
const blogItems = document.querySelectorAll(".blog-item")

blogItems.forEach((item)=>{
  // 쿼리셀렉터 좋은 점 : 이런식으로 현재 아이템 밑의 요소들도 불러올 수 있음
  // 현재 아이템 밑의 input, btn을 모두 불러온다
  const contentInput = item.querySelector('.blog-textarea')
  const editBtn = item.querySelector('.edit')
  const delBtn = item.querySelector('.del')
  const fileBox = item.querySelector('.fileBox')
  const postImg = item.querySelector('.postImg')

  const fileBoxTag = `<div class="preview d-flex justify-content-center align-items-center">
  <img src="" alt="" class="previewUpdateImg">
  <img src="/img/fileBox.png" alt="" class="previewDefaultImg">
  <label for="postUpdateImg" class="fileBtn"></label>
  <input type="file" name="postUpdateImg" id="postUpdateImg" class="text-center">
</div>`

  if(editBtn){
    // 수정 버튼 클릭하면
    editBtn.addEventListener('click', function(e){
      const id = editBtn.dataset.id

      contentInput.classList.toggle('edit')

      if(contentInput.classList.contains('edit')){ // 수정 진입 버튼 click 이벤트

        editBtn.innerHTML = '<i class="bi bi-check2"></i>'
        delBtn.innerHTML = '<i class="bi bi-x-lg"></i>'

        fileBox.innerHTML = fileBoxTag
        const fileDOM = document.querySelector('#postUpdateImg');
        filePreview(fileDOM, postImg)

        // readonly 속성 제거
        contentInput.removeAttribute('readonly')
      } else { // 수정 확인 버튼 click 이벤트

        // fileBox 삭제 전 파일 formData에 넣기
        const fileDOM = document.querySelector('#postUpdateImg');
        let file = fileDOM.files[0]
        console.log(file)
        let formData = new FormData()
        formData.append("file", file)

        // 서버 API에게 파일 수동으로 보내주는 코드
        let link = "/post/update/" + id
        fetch(link, {
          method : 'POST',
          body: formData
        })
        .then((r)=>r.text())
        .then((data)=>console.log(data))

        // fileBox 비우기를 비롯한 버튼 아이콘 등의 설정 변경
        editBtn.innerHTML = '<i class="bi bi-pencil"></i>'
        delBtn.innerHTML = '<i class="bi bi-trash3"></i>'
        fileBox.innerHTML = ''
        contentInput.setAttribute('readonly', 'readonly')

        const newPost = { // 수정할 내용(텍스트) 객체로 만듦
          id,
          text : contentInput.value
        }

        // 수정한 내용이 비어있는지 체크
        if(isEmpty(newPost.text)){ // 내용이 비어있지 않으면
          postEdit(newPost) // 서버에 객체 보내는 함수 실행
        } else{ // 수정한 내용이 비어있으면 보내지 않고 수정 상태 유지
          e.preventDefault()
          contentInput.classList.toggle('edit')
          editBtn.innerHTML = '<i class="bi bi-check2"></i>'
          delBtn.innerHTML = '<i class="bi bi-x-lg"></i>'
          const fileDOM = document.querySelector('#postUpdateImg');
          fileBox.innerHTML = fileBoxTag
          filePreview(fileDOM, postImg)
          contentInput.removeAttribute('readonly')
        }
      }
    })

    // 삭제 버튼 클릭하면
    delBtn.addEventListener('click', function(e){
      const id = delBtn.dataset.id

      if(!contentInput.classList.contains('edit'))
        postDel(id)
      else{
        contentInput.classList.toggle('edit')
        editBtn.innerHTML = '<i class="bi bi-pencil"></i>'
        delBtn.innerHTML = '<i class="bi bi-trash3"></i>'
        fileBox.innerHTML = ''
        contentInput.setAttribute('readonly', 'readonly')
      }
    })
  }
})

function postEdit(newPost){
  const {id} = newPost // newPost 객체에서 id 분리
  console.log(newPost)

  // PUT
  fetch('/post/' + id, {
    method : 'PUT',
    headers : {'Content-Type' : 'application/json'},
    body : JSON.stringify(newPost) // body에 newPost 객체 JSON 형태로 전송할 테니 해당 내용 바탕으로 수정하라
  })
  .then( r => r.text())
  .then( r => {
    window.location.href="/"
  })
  .catch(err => {
    console.log(err)
  })
}

function postDel(id){
  // DELETE
  fetch('/post/' + id, {method : "DELETE"})
  .then( r => r.text() )
  .then( r => {
    // 성공했을 때 실행하는 결과
    window.location.href="/" //해당 URL로 이동하라
  })
  .catch(err=>{
    console.log(err)
  })
}


// 유저 정보 수정
let userEditBtn = document.querySelector('.infoEditBtn')
let infoResetBtn = document.querySelector('.infoResetBtn')

if(userEditBtn){ // 유저 프로필 화면에서 수정 버튼 눌렀을 때
  userEditBtn.addEventListener('click', function(e){
    nicknameInput.classList.toggle('edit')
    introInput.classList.toggle('edit')

    if(nicknameInput.classList.contains('edit')){

      userEditBtn.innerHTML = '<i class="bi bi-check2"></i>'
      infoResetBtn.innerHTML = '<i class="bi bi-x-lg"></i>'

      // readonly 속성 제거
      nicknameInput.removeAttribute('readonly')
      introInput.removeAttribute('readonly')
      
      nicknameInput.addEventListener("input", handleResizeHeight(nicknameInput))
      introInput.addEventListener("input", handleResizeHeight(introInput))
      
    } else{
      userEditBtn.innerHTML = '<i class="bi bi-pencil"></i>'
      infoResetBtn.innerHTML = ''
      nicknameInput.setAttribute('readonly', 'readonly')
      introInput.setAttribute('readonly', 'readonly')

      const newUser = { // 수정할 내용 객체로 만듦
        nickname : nicknameInput.value,
        intro : introInput.value
      }

      // 수정한 내용이 비어있는지 체크
      if(isEmpty(newUser.text)){
        userEdit(newUser) // 서버에 객체 보내는 함수 실행
      } else{
        e.preventDefault()
        nicknameInput.classList.toggle('edit')
        introInput.classList.toggle('edit')

        userEditBtn.textContent = '확인'

        nicknameInput.removeAttribute('readonly')
        introInput.removeAttribute('readonly')
      }
    }
  })

  // 리셋 버튼을 눌렀을 때 edit 모드에서 빠져나오고 readonly 속성을 추가
  infoResetBtn.addEventListener('click', function(e){
    nicknameInput.classList.toggle('edit')
    introInput.classList.toggle('edit')
    nicknameInput.setAttribute('readonly', 'readonly')
    introInput.setAttribute('readonly', 'readonly')
    userEditBtn.innerHTML = '<i class="bi bi-pencil"></i>'
    infoResetBtn.innerHTML = ''
  })
}

function userEdit(newUser){
  // PUT
  fetch('/edit', {
    method : 'PUT',
    headers : {'Content-Type' : 'application/json'},
    body : JSON.stringify(newUser)
  })
  .then( r => r.text())
  .then( r => {
    window.location.href="/mypage"
  })
  .catch(err => {
    console.log(err)
  })
}


// 파일 업로드 미리보기
function filePreview(fileDOM, preview){
  if(fileDOM){
    fileDOM.addEventListener('change', (e) => {
        const reader = new FileReader();
        reader.onload = ({ target }) => {
          preview.src = target.result;
        };
        reader.readAsDataURL(fileDOM.files[0]);
        console.log(fileDOM.files[0])
      })
  }
}

// posting 파일 업로드 미리보기
const fileDOM = document.querySelector('#file');
const preview = document.querySelector('.previewImg');
filePreview(fileDOM, preview)


// const fileBox = document.querySelectorAll('.fileBox')

// if(fileBox){
//   fileBox.forEach((item, i)=>{
//     // dataset.id가 undefined인 것은 posting 부분이므로 아이디가 file로 뜨도록 삼항연산자 만듦
//     const postId = item.dataset.id ? item.dataset.id : ''
//     const fileDOM = item.querySelector('#file' + postId);
//     const preview = item.querySelector('.previewImg');

//     if(fileDOM){
//       fileDOM.addEventListener('change', (e) => {
//           const reader = new FileReader();
//           reader.onload = ({ target }) => {
//             preview.src = target.result;
//           };
//           reader.readAsDataURL(fileDOM.files[0]);
//         });
//     }
//   })
// }