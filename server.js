// module exports
const express = require("express")
const app = express()

const path = require('path')

const session = require('express-session')
const passport = require('passport')
const LocalStartegy = require('passport-local')

// multer
const multer = require('multer')
const uuid4 = require('uuid4')
const upload = multer({
  storage: multer.diskStorage({
    filename(req, file, done) {
      const randomID = uuid4();
      const ext = path.extname(file.originalname);
      const filename = randomID + ext;
      done(null, filename);
    },
    destination(req, file, done) {
      done(null, path.join(__dirname, "public/img"));
    },
  }),
  limits: { fileSize: 1024 * 1024 },
});


//db
const db = require('./models')
const {User, Post} = db


app.set('view engine', 'ejs')

const publicPath = path.join(__dirname, 'public')
app.use(express.static(publicPath))

app.use(express.json())
app.use(express.urlencoded({extended : true}))


// passport
app.use(passport.initialize())
app.use(session({
  secret : '',
  resave : false,
  saveUninitialized : false,
  cookie : {maxAge : 60 * 60 * 1000}
}))
app.use(passport.session())


// 로그인 검증 기능
passport.use(new LocalStartegy(async (email, pw, done)=>{
  let result = await User.findOne({where : {email}})

  if(!result){
    return done(null, false, {message : 'email is not exist in database'})
  }
  if (result.passwd != pw){
    return done(null, false, {message : 'password mismatch'})
  }

  return done(null, result)
}))


// session 생성
passport.serializeUser((user, done) => {
  process.nextTick(()=>{
    done(null, {id : user.id, email : user.email})
  })
})


// 유저가 접속할 때 session 검사
passport.deserializeUser(async (user, done) => {
  let result = await User.findOne({where : {id : user.id}})
  
  if(result){
    const newUserInfo = {
      id : result.id,
      email : result.email
    }
    process.nextTick(()=>{
      return done(null, result)
    })
  }
})


app.listen(3030, ()=>{
  console.log('connetion completed')
})

app.get('/', (req, res)=>{
  res.redirect('/page/1')
})

// login, logout
app.get('/login', (req, res)=>{
  res.render('login.ejs')
})

app.get('/login/:state', (req, res)=>{
  const {state} = req.params

  if(state == 'fail')
    res.render('login-fail.ejs')
})

app.get('/logout', (req, res)=>{
  req.logout(()=>{
    res.redirect('/page/1')
  })
})

app.get('/welcome', (req, res)=>{
  res.render('welcome.ejs')
})

app.get('/page/:pageNum', async (req,res)=>{
  const user = req.isAuthenticated() ? req.user : false
  
  let {pageNum} = req.params
  let limit = 5
  let offset = (pageNum - 1) * limit
  let totalPost = await Post.count()

  let totalPage = Math.ceil(totalPost / limit)

  const query ={
    include: [
      {
        model: User,
        attributes: ['nickname', 'profileImg'],
      },
    ],
    offset,
    limit,
    order: [['createdAt', 'DESC']],
  }
  const posts = await Post.findAll(query)

  res.render('index.ejs', {posts, totalPage, user, pageNum})
})


// 마이페이지
app.get('/mypage', (req, res) => {
  res.redirect('/mypage/1')
})

app.get('/mypage/:pageNum', async function(req, res){
  const user = req.isAuthenticated() ? req.user : false
  const isMypage = true

  if(user){
    // 로그인 상태일 때만 mypage 진입 가능
    let {pageNum} = req.params
    let limit = 5
    let offset = (pageNum - 1) * limit

    const query ={
      include: [
        {
          model: User,
          attributes: ['nickname', 'profileImg', 'intro'],
        },
      ],
      where : {userId : user.id},
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    }

    const findAndCoutPost = await Post.findAndCountAll(query)

    let totalPost = findAndCoutPost.count
    let posts = findAndCoutPost.rows

    let totalPage = Math.ceil(totalPost / limit)

    res.render('userPage.ejs', {posts, totalPage, user, pageNum, isMypage})
  } else res.redirect('/login')
  // 로그인 상태가 아니라면 login 페이지로 redirect
})

// 유저 페이지 (나중에 봐서 마이페이지랑 합쳐버릴 수 있게 짜야할 듯)
app.get('/userPage/:userId', (req, res)=>{
  const user = req.isAuthenticated() ? req.user : false
  let {userId} = req.params

  // 이거 redirect 주소를 삼항연산자로 주소 저장해서 코드 줄일 수 있을 거 같음
  // 유저 로그인 상태면 '/mypage/1', 아니면 '/userPage/' + userId + '/1' 저장 후 redirect에 넘겨
  if(user.id == userId){
    res.redirect('/mypage/1')
  } else{
    let redirectPage = '/userPage/' + userId + '/1'
    res.redirect(redirectPage)
  }

})

app.get('/userPage/:userId/:pageNum', async function(req, res){
  let {userId, pageNum} = req.params
  const user = req.isAuthenticated() ? req.user : false
  const isMypage = (user.id == userId) ? true : false

  // 넘어온 파라미터 userId를 이용하여 해당 유저 객체 정보와 post와 조인한 결과 뿌리기
  let limit = 5
  let offset = (pageNum - 1) * limit

  const query ={
    include: [
      {
        model: User,
        attributes: ['nickname', 'profileImg', 'intro'],
      },
    ],
    where : {userId},
    offset,
    limit,
    order: [['createdAt', 'DESC']],
  }

  const findAndCoutPost = await Post.findAndCountAll(query)

  let totalPost = findAndCoutPost.count
  let posts = findAndCoutPost.rows

  let totalPage = Math.ceil(totalPost / limit)

  res.render('userPage.ejs', {posts, totalPage, pageNum, isMypage, user})
})


app.post('/login', (req, res)=>{
  passport.authenticate('local', (error, user, info)=>{
    if (error) return res.status(500).json(error)

    if(!user) return res.redirect('/login/fail')

    req.logIn(user, (err) => {
      if(err) return next(err)

      res.redirect('/page/1')
    })
  })(req, res)
})

app.get('/join', (req, res)=>{
  res.render('join.ejs')
})

app.post('/join', async function(req, res){
  const newUser = req.body

  try {
    const isExist = await User.findOne({where : {email : newUser.email}}) ? true : false
    if(isExist){
      res.render('join-fail.ejs')
    } else{
      await User.create(newUser)
      res.redirect('/welcome')
    }
  } catch (error) {
    res.status(500).send('user join POST 과정에서 오류 발생')
  }
})


app.post('/add', upload.single('postImg'), async function (req, res) {
  
  const user = req.isAuthenticated() ? req.user : false

  try{
    if(user){
      const userId = user.id
      const newPost = req.body
      const postImg = req.file ? req.file.filename : null
      console.log("---------------" + req.file + "---------------")
      
      // userId 외래키 넣어준 뒤 해당 객체를 create
      newPost.userId = userId
      newPost.postImg = postImg

      await Post.create(newPost)
      res.redirect('/')
    } else res.redirect('/login')

  } catch{
    res.status(500).send('post POST 과정에서 오류 발생')
  }
})

app.put('/post/:id', async function (req, res) {
  const {id} = req.params
  const newPost = req.body

  try{
    // 이미지 수정이 되지 않았다면 포스트의 원본 이미지 값 그대로 놔둠
    const post = await Post.findOne({where : {id}})

    Object.keys(newPost).forEach((prop)=>{
      post[prop] = newPost[prop]
    })

    await post.save()
    res.redirect('/')

  } catch{
    res.status(500).send('post PUT 과정에서 오류 발생')
  }
})

app.post('/post/update/:id', upload.single('file'), async function (req, res) {
  const {id} = req.params
  const updateImg = req.file ? req.file.filename : null

  try{
    const post = await Post.findOne({where : {id}})

    // 이미지 수정이 되지 않았다면 포스트의 원본 이미지 값 그대로 놔둠
    if(updateImg) {
      post.postImg = updateImg
      await post.save()

    } else console.log('\n<-------- post img not changed -------->\n')

    res.redirect('/')

  } catch{
    res.status(500).send('post 사진 수정에서 오류 발생')
  }
})


app.put('/edit', async function(req, res){
  const user = req.isAuthenticated() ? req.user : false

  if(user){
    try{
      const newUser = req.body
      console.log(newUser)

      Object.keys(newUser).forEach((prop)=>{
        user[prop] = newUser[prop]
      })

      await user.save()
      res.redirect('/mypage')

    } catch{
      res.status(500).send('서버 오류!')
    }
  }
  else res.redirect('/login')
})



app.delete('/post/:id', async function (req, res) {
  const {id} = req.params
  try{
    await Post.destroy({where : {id}})
    res.redirect('/')
  } catch{
    res.status(500).send('post DELETE 과정에서 오류 발생')
  }
})