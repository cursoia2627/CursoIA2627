import React from 'react';
export default function Brand({small=false}) {
  return <div className={'brand '+(small?'brand-small':'')}>
    <img src="/assets/mano-boceto.png" alt="Mano robótica estilo boceto" />
    <div><span>IA</span> para <strong>Todos</strong></div>
  </div>;
}
