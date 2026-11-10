import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import ChatBot from './ChatBot';
import {listClientes,listConsultas,createConsulta,getAiStatus} from '../services/chatApi';
jest.mock('../services/chatApi');
jest.mock('../hooks/useChatVoice', () => ({__esModule:true,default:() => ({stop:mockStopVoice,canSpeak:false,canRecognize:false})}));
const mockStopVoice = jest.fn();
let container,root;
async function choose(id){await act(async () => {const select = container.querySelector('select'); select.value=id; select.dispatchEvent(new Event('change',{bubbles:true}));});}
beforeEach(async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  listClientes.mockResolvedValue([{id_cliente:1,nombre:'Ana'},{id_cliente:2,nombre:'Luis'}]);
  listConsultas.mockResolvedValue([]);
  getAiStatus.mockResolvedValue({enabled:true,provider:'gemini'});
  container=document.createElement('div'); document.body.appendChild(container); root=createRoot(container);
  await act(async () => {root.render(<ChatBot/>);});
});
afterEach(async () => {await act(async () => root.unmount()); container.remove(); jest.clearAllMocks();});
test('disables input until a real customer is chosen', async () => {
  expect(container.querySelector('input').disabled).toBe(true);
  await choose('1');
  expect(listConsultas).toHaveBeenCalledWith('1',expect.any(AbortSignal));
  expect(container.querySelector('input').disabled).toBe(false);
});
test('ignores a late history response after changing customer', async () => {
  let resolveOld;
  listConsultas.mockImplementationOnce(() => new Promise(resolve => {resolveOld=resolve;})).mockResolvedValueOnce([{id_consulta:2,id:2,Consulta:'Luis pregunta',estado_respuesta:'respondida',Respuesta:'Respuesta Luis'}]);
  await choose('1'); await choose('2');
  await act(async () => resolveOld([{id_consulta:1,id:1,Consulta:'Dato privado Ana'}]));
  expect(container.textContent).toContain('Luis pregunta');
  expect(container.textContent).not.toContain('Dato privado Ana');
});
test('preserves draft after a failed submission', async () => {
  await choose('1');
  createConsulta.mockRejectedValue(new Error('Sin conexión'));
  await act(async () => {
    const input=container.querySelector('input');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Nueva pregunta');
    input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await act(async () => container.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  expect(container.querySelector('input').value).toBe('Nueva pregunta');
  expect(container.textContent).toContain('El borrador se conserva');
});
test('shows actual customer history counts without demonstration banners', async () => {
  listConsultas.mockResolvedValue([{id_consulta:3,id:1,Consulta:'Consulta guardada',Respuesta:'Respuesta guardada',estado_respuesta:'respondida'}]);
  await choose('1');
  expect(container.textContent).toContain('Consulta guardada');
  expect(container.textContent).toContain('1 consultas');
  expect(container.textContent).toContain('1 respondidas');
  expect(container.textContent).not.toMatch(/demostración|simulad|Modo API|disponible cuando/i);
});
test('disabled assistant keeps history readable and prevents new submissions', async () => {
  getAiStatus.mockResolvedValue({enabled:false,provider:'disabled'});
  listConsultas.mockResolvedValue([{id_consulta:3,id:1,Consulta:'Historial disponible',Respuesta:'Texto',estado_respuesta:'respondida'}]);
  await act(async () => root.render(<ChatBot key="disabled-assistant"/>));
  await choose('1');
  expect(container.textContent).toContain('Historial disponible');
  expect(container.querySelector('input').disabled).toBe(true);
  await act(async () => container.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  expect(createConsulta).not.toHaveBeenCalled();
});

