let Koa = require('./application');
let app = new Koa();


app.use((ctx, next) => {
  console.log(1)
  next()
  console.log(2)
})

app.use((ctx, next) => {
  console.log(3)
  next()
  console.log(4)
})

app.use((ctx, next) => {
  console.log(5)
  next()
  console.log(6)
})

app.use(async (ctx, next) =>{
  console.log('async 1')
  await next();
  console.log('async 2')
})

app.use(async (ctx, next) =>{
  console.log('async 3')
  let p = new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log('async 3.5');
      resolve()
    }, 1000)
  })
  await p.then()
  await next();
  console.log('async 4')
  ctx.body = 'hello world';
})

app.listen(3000);
console.log('Server is open at: http://localhost:3000')