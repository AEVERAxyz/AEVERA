import React from 'react';

const LogoBottle = () => (
  <svg width="60" height="80" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Sanfte Wellen UNTER der Flasche - Verstärkt für bessere Sichtbarkeit */}
    <path d="M25 110C35 107 45 113 55 110C65 107 75 113 85 110" stroke="#1652F0" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M20 116C30 113 40 119 50 116C60 113 70 119 80 116" stroke="#1652F0" strokeWidth="2" strokeOpacity="0.4" strokeLinecap="round"/>

    {/* Die elegante Flaschenform aus deinem Favoriten */}
    <path d="M43 24V12H57V24C63 25 73 34 73 54V88C73 100 65 105 50 105C35 105 27 100 27 88V54C27 34 37 25 43 24Z" stroke="#1652F0" strokeWidth="3" strokeLinejoin="round"/>

    {/* Der markante Korken */}
    <rect x="44" y="5" width="12" height="8" rx="1.5" fill="#1652F0"/>

    {/* Das Pergament (Brief) - Deutlicher gezeichnet */}
    <path d="M38 65C38 65 60 56 63 62L58 88C58 88 36 94 33 88L38 65Z" stroke="#1652F0" strokeWidth="1.8" fill="#1652F0" fillOpacity="0.2"/>
    <path d="M38 65C45 62 55 62 63 62" stroke="#1652F0" strokeWidth="1.5"/>
  </svg>
);

export default LogoBottle;