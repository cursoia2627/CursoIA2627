import {createConsulta, listClientes, listConsultas} from './chatApi';
const ok = data => Promise.resolve({ok:true,json:async () => ({data})});
afterEach(() => jest.restoreAllMocks());
test('loads all pages of customers', async () => {
  global.fetch = jest.fn().mockImplementationOnce(() => ok({items:[{id_cliente:1}],total:2})).mockImplementationOnce(() => ok({items:[{id_cliente:2}],total:2}));
  expect(await listClientes()).toHaveLength(2);
  expect(fetch.mock.calls[1][0]).toContain('offset=1');
});
test('rejects another customer history', async () => {
  global.fetch = jest.fn(() => ok({items:[{id_consulta:1,id:2}],total:1}));
  await expect(listConsultas(1)).rejects.toThrow('otro cliente');
});
test('orders history chronologically by query ID', async () => {
  global.fetch = jest.fn(() => ok({items:[{id_consulta:3,id:1},{id_consulta:2,id:1}],total:2}));
  expect((await listConsultas(1)).map(c => c.id_consulta)).toEqual([2,3]);
});
test('creates query with the exact existing backend contract', async () => {
  global.fetch = jest.fn(() => ok({id_consulta:5,id:7,Consulta:'Hola'}));
  await createConsulta('7','Hola');
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({id:7,Consulta:'Hola'});
  expect(fetch.mock.calls[0][1].method).toBe('POST');
});
test('surfaces API errors', async () => {
  global.fetch = jest.fn(async () => ({ok:false,json:async () => ({error:{message:'Cliente no existe'}})}));
  await expect(createConsulta(1,'Hola')).rejects.toThrow('Cliente no existe');
});
test('rejects an incomplete page', async () => {
  global.fetch = jest.fn(() => ok({items:[],total:2}));
  await expect(listClientes()).rejects.toThrow('incompleto');
});
test('uses HTTP even with legacy mode set to demo', async () => {
  const previous = process.env.REACT_APP_CHAT_MODE;
  process.env.REACT_APP_CHAT_MODE = 'demo';
  try {
    global.fetch = jest.fn(() => ok({items:[],total:0}));
    expect(await listClientes()).toEqual([]);
    expect(fetch).toHaveBeenCalled();
  } finally {
    if (previous === undefined) delete process.env.REACT_APP_CHAT_MODE;
    else process.env.REACT_APP_CHAT_MODE = previous;
  }
});
test('network failure is shown instead of fake customer data', async () => {
  global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
  await expect(listClientes()).rejects.toThrow('No se puede conectar');
});


