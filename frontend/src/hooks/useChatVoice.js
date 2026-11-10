import {useCallback, useEffect, useRef, useState} from 'react';
export default function useChatVoice(onTranscript) {
  const recognition = useRef(null), callback = useRef(onTranscript);
  callback.current = onTranscript;
  const [listening,setListening] = useState(false), [notice,setNotice] = useState('');
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canSpeak = Boolean(window.speechSynthesis && window.SpeechSynthesisUtterance);
  const stop = useCallback(() => {
    const current = recognition.current;
    recognition.current = null;
    if (current) {current.onresult = null; current.onend = null; current.onerror = null; current.abort();}
    window.speechSynthesis?.cancel();
    setListening(false); setNotice('');
  }, []);
  useEffect(() => stop, [stop]);
  function listen() {
    if (!Recognition || recognition.current) return;
    window.speechSynthesis?.cancel();
    setNotice('El servicio de dictado del navegador puede procesar el audio en servidores externos.');
    const current = new Recognition();
    current.lang = 'es-ES'; current.continuous = false; current.interimResults = false;
    recognition.current = current;
    current.onresult = event => {
      if (recognition.current !== current) return;
      const text = Array.from(event.results).filter(result => result.isFinal).map(result => result[0].transcript).join(' ');
      if (text) callback.current(text);
    };
    current.onerror = event => {
      if (recognition.current !== current) return;
      const messages = {'not-allowed':'Permiso de micrófono denegado. Puedes escribir el mensaje.', 'audio-capture':'No hay un micrófono disponible.', 'no-speech':'No se detectó voz.', network:'El servicio de dictado no está disponible.'};
      setNotice(messages[event.error] || 'No se pudo completar el dictado. Puedes escribir el mensaje.');
    };
    current.onend = () => {if (recognition.current === current) {recognition.current = null; setListening(false);}};
    try {current.start(); setListening(true);} catch {recognition.current = null; setListening(false); setNotice('No se pudo iniciar el micrófono.');}
  }
  function speak(text) {
    stop(); if (!canSpeak) return;
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === 'es-ES') || voices.find(v => v.lang.startsWith('es'));
    if (voice) utterance.voice = voice;
    utterance.onerror = event => {if (!['canceled','interrupted'].includes(event.error)) setNotice('No se pudo leer la respuesta.');};
    window.speechSynthesis.speak(utterance);
  }
  return {listening,notice,canSpeak,canRecognize:Boolean(Recognition),listen,speak,stop,finishListening:() => recognition.current?.stop()};
}
