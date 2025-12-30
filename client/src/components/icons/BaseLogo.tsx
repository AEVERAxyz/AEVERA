export function BaseLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 111 111" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF"/>
      <path 
        d="M55.5 94.625C77.6066 94.625 95.5 76.7316 95.5 54.625C95.5 32.5184 77.6066 14.625 55.5 14.625C34.4536 14.625 17.2425 30.8664 15.5938 51.375H68.4375V57.875H15.5938C17.2425 78.3836 34.4536 94.625 55.5 94.625Z" 
        fill="white"
      />
    </svg>
  );
}
