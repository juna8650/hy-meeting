import React from 'react';

interface SchoolSymbolProps {
  className?: string;
  size?: number | string;
}

/**
 * 한양과학기술고등학교 공식 심볼마크 (평면형 백색바탕)
 * 로고2.png 원본 그래픽을 모든 화면(모바일, 레티나, 4K)에서 100% 무손실로
 * 선명하게 렌더링되도록 수학적 정밀 벡터(SVG)로 구현한 컴포넌트입니다.
 */
export function SchoolSymbol({ className = 'w-12 h-12', size }: SchoolSymbolProps) {
  const navy = '#162B59';
  const white = '#FFFFFF';

  return (
    <svg
      viewBox="0 0 500 500"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="geometricPrecision"
      textRendering="geometricPrecision"
      aria-label="한양과학기술고등학교 공식 심볼마크"
    >
      {/* 1. 백색 배경 원 */}
      <circle cx="250" cy="250" r="248" fill={white} />

      {/* 2. 최외곽 얇은 네이비 원형 테두리 */}
      <circle cx="250" cy="250" r="243" stroke={navy} strokeWidth="5.5" fill="none" />

      {/* 3. 굵은 네이비 원형 밴드 (도넛 형태) */}
      <path
        d="M 250 16 
           A 234 234 0 1 0 250 484 
           A 234 234 0 1 0 250 16 Z 
           M 250 84 
           A 166 166 0 1 1 250 416 
           A 166 166 0 1 1 250 84 Z"
        fill={navy}
        fillRule="evenodd"
      />

      {/* 4. 내부 원형 테두리 선 */}
      <circle cx="250" cy="250" r="166" stroke={navy} strokeWidth="3.5" fill="none" />

      {/* 5. 상단 호형 영문 텍스트 */}
      <defs>
        <path
          id="hanyang-symbol-arc-path"
          d="M 72 312 A 200 200 0 1 1 428 312"
          fill="none"
        />
      </defs>
      <text
        fill={white}
        fontSize="21"
        fontWeight="900"
        letterSpacing="0.045em"
        fontFamily="'Arial Black', 'Pretendard', 'Noto Sans KR', sans-serif"
        className="select-none"
      >
        <textPath href="#hanyang-symbol-arc-path" startOffset="50%" textAnchor="middle">
          HANYANG SCIENCE AND TECHNOLOGY HIGH SCHOOL
        </textPath>
      </text>

      {/* 6. 하단 장식 (좌우 구분점, 월계수 가지와 잎, 꽃, 하단 중앙 점) */}
      <circle cx="86" cy="316" r="8.5" fill={white} />
      <circle cx="414" cy="316" r="8.5" fill={white} />
      <circle cx="250" cy="454" r="7" fill={white} />

      {/* 좌측 월계수 줄기 */}
      <path
        d="M 106 342 Q 140 402 192 434"
        stroke={white}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {/* 좌측 잎 1, 2, 3, 4 */}
      <path d="M 110 334 C 94 328 102 314 120 324 C 124 336 116 340 110 334 Z" fill={white} />
      <path d="M 124 352 C 108 346 116 332 134 342 C 138 352 130 358 124 352 Z" fill={white} />
      <path d="M 144 378 C 130 372 136 358 154 366 C 158 376 150 382 144 378 Z" fill={white} />
      <path d="M 164 400 C 150 394 156 380 174 388 C 178 398 170 404 164 400 Z" fill={white} />

      {/* 좌측 4잎 꽃 */}
      <g transform="translate(196, 436) scale(0.85)">
        <ellipse cx="0" cy="-11" rx="4" ry="9" fill={white} transform="rotate(15)" />
        <ellipse cx="0" cy="11" rx="4" ry="9" fill={white} transform="rotate(15)" />
        <ellipse cx="-11" cy="0" rx="9" ry="4" fill={white} transform="rotate(15)" />
        <ellipse cx="11" cy="0" rx="9" ry="4" fill={white} transform="rotate(15)" />
        <circle cx="0" cy="0" r="3.5" fill={navy} />
      </g>

      {/* 우측 월계수 줄기 */}
      <path
        d="M 394 342 Q 360 402 308 434"
        stroke={white}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {/* 우측 잎 1, 2, 3, 4 */}
      <path d="M 390 334 C 406 328 398 314 380 324 C 376 336 384 340 390 334 Z" fill={white} />
      <path d="M 376 352 C 392 346 384 332 366 342 C 362 352 370 358 376 352 Z" fill={white} />
      <path d="M 356 378 C 370 372 364 358 346 366 C 342 376 350 382 356 378 Z" fill={white} />
      <path d="M 336 400 C 350 394 344 380 326 388 C 322 398 330 404 336 400 Z" fill={white} />

      {/* 우측 4잎 꽃 */}
      <g transform="translate(304, 436) scale(0.85)">
        <ellipse cx="0" cy="-11" rx="4" ry="9" fill={white} transform="rotate(-15)" />
        <ellipse cx="0" cy="11" rx="4" ry="9" fill={white} transform="rotate(-15)" />
        <ellipse cx="-11" cy="0" rx="9" ry="4" fill={white} transform="rotate(-15)" />
        <ellipse cx="11" cy="0" rx="9" ry="4" fill={white} transform="rotate(-15)" />
        <circle cx="0" cy="0" r="3.5" fill={navy} />
      </g>

      {/* 7. 내부 영역 (한양 삼각형, 한, 양, 高, 1945) */}
      {/* '한' 텍스트 */}
      <text
        x="152"
        y="198"
        fill={navy}
        fontSize="58"
        fontWeight="900"
        textAnchor="middle"
        fontFamily="'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif"
        className="select-none"
      >
        한
      </text>

      {/* '양' 텍스트 */}
      <text
        x="348"
        y="198"
        fill={navy}
        fontSize="58"
        fontWeight="900"
        textAnchor="middle"
        fontFamily="'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif"
        className="select-none"
      >
        양
      </text>

      {/* 외곽 굵은 삼각형 */}
      <polygon
        points="250,116 132,316 368,316"
        stroke={navy}
        strokeWidth="11"
        strokeLinejoin="round"
        fill="none"
      />

      {/* 내측 얇은 삼각형 */}
      <polygon
        points="250,146 156,302 344,302"
        stroke={navy}
        strokeWidth="4"
        strokeLinejoin="round"
        fill="none"
      />

      {/* 3방향 스파이어 돌기 (상단, 좌하단, 우하단) */}
      <polygon points="250,148 245,214 255,214" fill={navy} />
      <polygon points="170,285 212,254 220,262" fill={navy} />
      <polygon points="330,285 288,254 280,262" fill={navy} />

      {/* 중앙 휠 양쪽 수평 노치 바 (좌 3개, 우 3개) */}
      <line x1="188" y1="237" x2="220" y2="237" stroke={navy} strokeWidth="5.5" strokeLinecap="round" />
      <line x1="184" y1="250" x2="216" y2="250" stroke={navy} strokeWidth="5.5" strokeLinecap="round" />
      <line x1="188" y1="263" x2="220" y2="263" stroke={navy} strokeWidth="5.5" strokeLinecap="round" />

      <line x1="280" y1="237" x2="312" y2="237" stroke={navy} strokeWidth="5.5" strokeLinecap="round" />
      <line x1="284" y1="250" x2="316" y2="250" stroke={navy} strokeWidth="5.5" strokeLinecap="round" />
      <line x1="280" y1="263" x2="312" y2="263" stroke={navy} strokeWidth="5.5" strokeLinecap="round" />

      {/* 중앙 휠 원형 */}
      <circle cx="250" cy="250" r="39" fill={navy} />
      <circle cx="250" cy="250" r="33.5" fill={white} />

      {/* 중앙 '高' 한자 */}
      <text
        x="250"
        y="266"
        fill={navy}
        fontSize="44"
        fontWeight="bold"
        textAnchor="middle"
        fontFamily="'Batang', 'Songti SC', 'Noto Serif KR', serif"
        className="select-none"
      >
        高
      </text>

      {/* 하단 설립연도 '1945' */}
      <text
        x="250"
        y="368"
        fill={navy}
        fontSize="44"
        fontWeight="900"
        letterSpacing="0.08em"
        textAnchor="middle"
        fontFamily="'Arial Black', 'Pretendard', sans-serif"
        className="select-none"
      >
        1945
      </text>
    </svg>
  );
}
