let http = require('http');
let Stream = require('stream');
let EventEmitter = require('events');
let context = require('./context');
let request = require('./request');
let response = require('./response');

class Koa extends EventEmitter {
  constructor() {
    super();
    this.middlewares = [];
    this.context = context;
    this.request = request;
    this.response = response;
  }

  use(fn) {
    this.middlewares.push(fn);
  }

  compose(middlewares, ctx) {
    function dispatch(index) {
      // 最后一次next不执行
      if (index === middlewares.length) return;
      let middleware = middlewares[index];
      return Promise.resolve(middleware(ctx, () => dispatch(index + 1)));
    }
    return dispatch(0);
  }

  createContext(req, res) {
    const ctx = Object.create(this.context);
    const request = ctx.request = Object.create(this.request);
    const response = ctx.response = Object.create(this.response);
    ctx.req = request.req = response.req = req;
    ctx.res = request.res = response.res = res;
    request.response = response;
    response.request = request;
    return ctx;
  }

  handleRequest(req, res) {
    res.statusCode = 404;
    let ctx = this.createContext(req, res);
    let fn = this.compose(this.middlewares, ctx);
    fn.then(() => {
      if (typeof ctx.body === 'object') {
        res.setHeader('Content-Type', 'application/json;charset=utf8');
        res.setHeader(JSON.stringify(ctx.body));
      } else if (ctx.body instanceof Stream) {
        ctx.body.pipe(res);
      } else if (typeof ctx.body === 'string' || Buffer.isBuffer(ctx.body)) {
        res.setHeader('Content-Type', 'text/html;charset=utf8');
        res.end(ctx.body);
      } else {
        res.end('Not Found');
      }
    }).catch(err => {
      this.emit('error', err);
      res.statusCode = 500;
      res.end('server error')
    })
  }

  listen(...args) {
    let server = http.createServer(this.handleRequest.bind(this));
    server.listen(...args);
  }
  
}

module.exports = Koa;
