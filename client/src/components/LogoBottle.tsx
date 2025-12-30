import React from 'react';

const LogoBottle = () => (
  <svg width="60" height="80" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Sanfte Wellen unter der Flasche */}
    <path d="M10 110C30 105 40 115 60 110C80 105 90 115 110 110" stroke="#1652F0" strokeWidth="3" strokeLinecap="round"/>

    {/* Die Flasche nach deiner Vorlage */}
    <path d="M42 20V12H58V20C63 20 72 28 72 45V85C72 95 65 100 50 100C35 100 28 95 28 85V45C28 28 37 20 42 20Z" stroke="#1652F0" strokeWidth="3" strokeLinejoin="round"/>

    {/* Der Korken */}
    <rect x="44" y="5" width="12" height="7" rx="1" fill="#1652F0"/>

    {/* Das Pergament im Inneren */}
    <path d="M38 60L62 55L58 80L34 85L38 60Z" fill="#1652F0" fillOpacity="0.2" stroke="#1652F0" strokeWidth="2"/>
  </svg>
);

export default LogoBottle;