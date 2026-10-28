export function DinoScene() {
  return (
    <svg
      className="dino-illustration"
      viewBox="0 0 560 340"
      role="img"
      aria-label="Dino e seu filhote em um jardim de descobertas"
    >
      <defs>
        <linearGradient id="dinoGreen" x2="0" y2="1">
          <stop stopColor="#8acb8c" />
          <stop offset="1" stopColor="#50a875" />
        </linearGradient>
        <linearGradient id="dinoSky" x2="1" y2="1">
          <stop stopColor="#e3f0df" />
          <stop offset="1" stopColor="#eff2d5" />
        </linearGradient>
      </defs>
      <ellipse cx="290" cy="180" rx="235" ry="150" fill="url(#dinoSky)" />
      <circle cx="423" cy="72" r="29" fill="#f4cb66" />
      <g fill="white" opacity=".85">
        <path d="M85 90a20 20 0 0140-8 26 26 0 0145 13H85z" />
        <path d="M345 130a17 17 0 0130-10 20 20 0 0138 12h-68z" />
      </g>
      <ellipse cx="290" cy="287" rx="194" ry="20" fill="#b8d8ac" />
      <path
        d="M420 281q-8-65 27-107-7 66-27 107m0 0q22-51 62-57-27 43-62 57"
        fill="#8eb57c"
      />
      <path
        d="M116 279q-9-61-43-79 10 61 43 79m0 0q-2-48 30-74 1 45-30 74"
        fill="#739f6b"
      />
      <path d="M153 239q-49 14-75-22 16 65 81 52l17-24" fill="#59a675" />
      <path
        d="M178 221q9-28 51-29h57l5-78q0-53 50-53h33q32 0 33 27l-2 23q-2 17-23 17h-32l-4 89q-3 46-48 49l-8 32h-31l-3-32h-31l-5 32h-30l-2-39q-23-13-10-38"
        fill="url(#dinoGreen)"
      />
      <path d="M319 131h27l-3 91q-3 28-42 30h-30q40-16 42-47z" fill="#b5d99a" />
      <path
        d="M292 145l-22-7 23-16m-4 55-22-8 24-15m-6 53-21-10 23-14"
        fill="#34795c"
      />
      <circle cx="374" cy="86" r="6" fill="#254c40" />
      <circle cx="376" cy="84" r="2" fill="white" />
      <ellipse cx="387" cy="104" rx="9" ry="5" fill="#e5a39b" />
      <path
        d="M381 115q8 5 14-1"
        stroke="#326c52"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <g fill="#6db783">
        <circle cx="228" cy="215" r="6" />
        <circle cx="247" cy="206" r="5" />
        <circle cx="255" cy="223" r="7" />
      </g>
      <path d="M335 263q-18 5-28-8 3 23 28 22l8-8" fill="#c799d8" />
      <path
        d="M344 260q-2-22 23-24l2-26q0-22 22-22h11q16 0 16 15v10q0 11-14 11h-12v28q-1 20-21 23l-2 17h-13l-2-17h-7l-2 17h-12l1-22"
        fill="#b598d4"
      />
      <circle cx="402" cy="200" r="3" fill="#4a3f69" />
      <path d="M385 226h7v26q0 11-16 15h-13q20-13 22-41" fill="#d5c3e9" />
      <g fill="#f5c96c">
        <circle cx="162" cy="124" r="6" />
        <path d="M222 85l4-11 4 11 11 4-11 4-4 11-4-11-11-4z" />
        <path d="M463 185l3-8 3 8 8 3-8 3-3 8-3-8-8-3z" />
      </g>
      <g>
        <path d="M158 280v-18" stroke="#7f9d66" strokeWidth="3" />
        <circle cx="158" cy="258" r="10" fill="#ebacb0" />
        <circle cx="158" cy="258" r="4" fill="#f9e5ab" />
        <path d="M458 291v-17" stroke="#7f9d66" strokeWidth="3" />
        <circle cx="458" cy="270" r="9" fill="#c0a0d9" />
        <circle cx="458" cy="270" r="3" fill="#f9e5ab" />
      </g>
    </svg>
  );
}
