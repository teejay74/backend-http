const http = require('http');
const Koa = require('koa');
const koaBody = require('koa-body');
const uuid = require('uuid');
const app = new Koa();

app.use(koaBody({
    urlencoded: true,
    multipart: true,
}));

app.use(async (ctx, next) => {
    const origin = ctx.request.get('Origin');
    if (!origin) {
      return await next();
    }

    const headers = { 'Access-Control-Allow-Origin': '*', };

    if (ctx.request.method !== 'OPTIONS') {
      ctx.response.set({...headers});
      try {
        return await next();
      } catch (e) {
        e.headers = {...e.headers, ...headers};
        throw e;
      }
    }

    if (ctx.request.get('Access-Control-Request-Method')) {
      ctx.response.set({
        ...headers,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
      });

      if (ctx.request.get('Access-Control-Request-Headers')) {
        ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Request-Headers'));
      }

      ctx.response.status = 204;
    }
  });

  let tickets = [{
    id: uuid.v4(),
    name: 'Поменять краску в принтере, ком. 404',
    description: 'Принтер HP LJ 1210, картриджи на складе',
    status: false,
    created: initDate()
  },
  {
    id: uuid.v4(),
    name: 'Установить обновление КВ-ХХХ',
    description: 'Вышло критическое обновление для Windows',
    status: false,
    created: initDate()
  }];

  class TicketFull {
    constructor(name, description) {
      this.id = uuid.v4();
      this.name = name;
      this.description = description;
      this.status = false;
      this.created = initDate();
    }
  }

  function initDate() {
    const date = new Date();
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear().toString().slice(2);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${day < 10 ? '0' : ''}${day}.${month < 10 ? '0' : ''}${month}.${year} ${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
  }

  app.use(async (ctx) => {
    const { id, method, status } = ctx.request.query;
    const { editId, name, description } = ctx.request.body;
    let item;

    switch (method) {
      case 'allTickets':
        ctx.response.body = tickets;
        return;
      case 'ticketById':
          const ticket = tickets.filter((item) => item.id === id);
          ctx.response.body = ticket[0].description;
          return;
      case 'createTicket':
        tickets.push(new TicketFull(name, description));
        ctx.response.body = tickets;
        return;
      case 'editTicket':
        item = tickets.findIndex((item) => item.id === editId);
          tickets[item].name = name;
          tickets[item].description = description;
          ctx.response.body = 'ok';
          return;
           case 'toggleStatus':
        item = tickets.findIndex((item) => item.id === id);
        tickets[item].status = status === 'true' ? true : false;
        ctx.response.body = 'ok';
        return;
      case 'deleteTicket':
        tickets = tickets.filter((item) => item.id !== id);
        ctx.response.body = 'ok';
        return;
      default:
        ctx.response.status = 404;
    }
  });

  const port = process.env.PORT || 7070;
  http.createServer(app.callback()).listen(port);