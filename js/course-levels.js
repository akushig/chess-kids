// 자동 생성: node scripts/generate-course-levels.cjs (직접 고치지 말고 js/course-gen.js를 고친다)
// 주제마다 5단계(첫걸음·쉬움·보통·어려움·도전) × 3판. score는 난이도 점수, witness는 검사용 예시 첫 수(유일한 정답이 아니다).
// limit은 끝내기의 제한 수, distance는 끝내기 계산표의 거리(반수)다.
const COURSE_LEVEL_DATA = {
 "m2-check": [
  {
   "id": "m2check-01",
   "tier": 1,
   "fen": "8/k7/pp6/8/8/K7/5Q2/7R w - - 0 1",
   "goal": "두 수 만에 체크메이트! 첫 수는 체크예요.",
   "score": 4.69,
   "witness": [
    6,
    5,
    1,
    5
   ],
   "showHint": true
  },
  {
   "id": "m2check-02",
   "tier": 1,
   "fen": "8/5k2/4pppQ/8/1R6/8/7K/8 w - - 0 1",
   "goal": "두 수 만에 체크메이트! 첫 수는 체크예요.",
   "score": 5.69,
   "witness": [
    2,
    7,
    1,
    7
   ]
  },
  {
   "id": "m2check-03",
   "tier": 1,
   "fen": "8/6k1/R4ppp/8/Q7/K7/8/8 w - - 0 1",
   "goal": "두 수 만에 체크메이트! 첫 수는 체크예요.",
   "score": 6.51,
   "witness": [
    4,
    0,
    1,
    3
   ]
  },
  {
   "id": "m2check-04",
   "tier": 2,
   "fen": "1k6/ppp5/2n5/8/5R2/8/2RK4/8 w - - 0 1",
   "goal": "체크로 몰아서 두 수 메이트를 만들어요.",
   "score": 6.52,
   "witness": [
    4,
    5,
    0,
    5
   ]
  },
  {
   "id": "m2check-05",
   "tier": 2,
   "fen": "1k6/ppp5/5b2/8/8/8/R7/2K1R3 w - - 0 1",
   "goal": "체크로 몰아서 두 수 메이트를 만들어요.",
   "score": 6.52,
   "witness": [
    7,
    4,
    0,
    4
   ]
  },
  {
   "id": "m2check-06",
   "tier": 2,
   "fen": "8/6k1/1R4pp/8/8/8/2K1b3/3R4 w - - 0 1",
   "goal": "체크로 몰아서 두 수 메이트를 만들어요.",
   "score": 6.76,
   "witness": [
    7,
    3,
    1,
    3
   ]
  },
  {
   "id": "m2check-07",
   "tier": 3,
   "fen": "3b2B1/2k5/1ppp4/8/8/8/8/Q2K4 w - - 0 1",
   "goal": "두 수 메이트! 상대 킹이 피할 곳을 생각해요.",
   "score": 6.77,
   "witness": [
    7,
    0,
    1,
    0
   ]
  },
  {
   "id": "m2check-08",
   "tier": 3,
   "fen": "1k6/2p1Q3/1B6/8/8/5r2/8/6K1 w - - 0 1",
   "goal": "두 수 메이트! 상대 킹이 피할 곳을 생각해요.",
   "score": 6.77,
   "witness": [
    1,
    4,
    1,
    2
   ]
  },
  {
   "id": "m2check-09",
   "tier": 3,
   "fen": "8/5k2/2QnpppB/8/8/4K3/8/8 w - - 0 1",
   "goal": "두 수 메이트! 상대 킹이 피할 곳을 생각해요.",
   "score": 7.27,
   "witness": [
    2,
    2,
    1,
    3
   ]
  },
  {
   "id": "m2check-10",
   "tier": 4,
   "fen": "3k4/2p1p3/4p1N1/1N6/7n/6K1/1Q6/8 w - - 0 1",
   "goal": "체크를 두 번 이어 체크메이트해요.",
   "score": 7.42,
   "witness": [
    6,
    1,
    0,
    7
   ]
  },
  {
   "id": "m2check-11",
   "tier": 4,
   "fen": "1n6/5k2/3Bp2R/6p1/8/8/8/QK6 w - - 0 1",
   "goal": "체크를 두 번 이어 체크메이트해요.",
   "score": 7.54,
   "witness": [
    7,
    0,
    2,
    5
   ]
  },
  {
   "id": "m2check-12",
   "tier": 4,
   "fen": "1k6/Npp4R/8/2p5/8/1QK1b3/8/8 w - - 0 1",
   "goal": "체크를 두 번 이어 체크메이트해요.",
   "score": 7.79,
   "witness": [
    1,
    0,
    2,
    2
   ]
  },
  {
   "id": "m2check-13",
   "tier": 5,
   "fen": "2k5/1ppp2Qn/r7/1Bp5/5N2/1P6/7K/8 w - - 0 1",
   "goal": "말이 많아요. 두 수 메이트를 찾아요.",
   "score": 7.87,
   "witness": [
    1,
    6,
    0,
    6
   ]
  },
  {
   "id": "m2check-14",
   "tier": 5,
   "fen": "7N/7k/4Q1pN/5p1b/5r2/8/1K4P1/8 w - - 0 1",
   "goal": "말이 많아요. 두 수 메이트를 찾아요.",
   "score": 8.32,
   "witness": [
    2,
    4,
    0,
    6
   ]
  },
  {
   "id": "m2check-15",
   "tier": 5,
   "fen": "3k1n2/2p5/1Q2B3/6p1/5Br1/5K2/P7/8 w - - 0 1",
   "goal": "말이 많아요. 두 수 메이트를 찾아요.",
   "score": 8.57,
   "witness": [
    2,
    1,
    1,
    2
   ]
  }
 ],
 "m2-quiet": [
  {
   "id": "m2quiet-01",
   "tier": 1,
   "fen": "3k4/1Rp1p3/8/8/8/3K4/8/4Q3 w - - 0 1",
   "goal": "체크하지 않는 첫 수로 킹의 길을 막고, 다음 수에 메이트!",
   "score": 7.46,
   "witness": [
    7,
    4,
    2,
    4
   ],
   "showHint": true
  },
  {
   "id": "m2quiet-02",
   "tier": 1,
   "fen": "6R1/5k2/4ppp1/8/8/2Q5/3K4/8 w - - 0 1",
   "goal": "체크하지 않는 첫 수로 킹의 길을 막고, 다음 수에 메이트!",
   "score": 8.58,
   "witness": [
    5,
    2,
    0,
    2
   ]
  },
  {
   "id": "m2quiet-03",
   "tier": 1,
   "fen": "6R1/5k2/4ppp1/3Q4/8/8/2K5/8 w - - 0 1",
   "goal": "체크하지 않는 첫 수로 킹의 길을 막고, 다음 수에 메이트!",
   "score": 8.71,
   "witness": [
    3,
    3,
    0,
    3
   ]
  },
  {
   "id": "m2quiet-04",
   "tier": 2,
   "fen": "6k1/2R4p/5R2/7p/8/8/1K6/8 w - - 0 1",
   "goal": "조용한 첫 수 뒤에 메이트해요. 상대가 무엇을 해도!",
   "score": 5.68,
   "witness": [
    2,
    5,
    2,
    3
   ]
  },
  {
   "id": "m2quiet-05",
   "tier": 2,
   "fen": "6k1/7p/8/8/R2R4/8/7n/1K6 w - - 0 1",
   "goal": "조용한 첫 수 뒤에 메이트해요. 상대가 무엇을 해도!",
   "score": 6.99,
   "witness": [
    4,
    0,
    1,
    0
   ]
  },
  {
   "id": "m2quiet-06",
   "tier": 2,
   "fen": "7k/2R4p/8/1b6/8/2K5/8/1R6 w - - 0 1",
   "goal": "조용한 첫 수 뒤에 메이트해요. 상대가 무엇을 해도!",
   "score": 7.46,
   "witness": [
    7,
    1,
    3,
    1
   ]
  },
  {
   "id": "m2quiet-07",
   "tier": 3,
   "fen": "8/k7/pp6/8/4N3/5Q2/1K6/1n6 w - - 0 1",
   "goal": "먼저 킹이 도망갈 칸을 막아요. 그다음 메이트!",
   "score": 8.07,
   "witness": [
    4,
    4,
    2,
    3
   ]
  },
  {
   "id": "m2quiet-08",
   "tier": 3,
   "fen": "7k/1Q3bpp/8/8/8/7K/8/1B6 w - - 0 1",
   "goal": "먼저 킹이 도망갈 칸을 막아요. 그다음 메이트!",
   "score": 8.33,
   "witness": [
    1,
    1,
    1,
    5
   ]
  },
  {
   "id": "m2quiet-09",
   "tier": 3,
   "fen": "k6b/1p6/3Q4/4N3/8/8/8/7K w - - 0 1",
   "goal": "먼저 킹이 도망갈 칸을 막아요. 그다음 메이트!",
   "score": 9.05,
   "witness": [
    3,
    4,
    1,
    3
   ]
  },
  {
   "id": "m2quiet-10",
   "tier": 4,
   "fen": "6R1/5B1k/6pp/8/5p2/8/5Qr1/3K4 w - - 0 1",
   "goal": "체크가 아닌 첫 수를 찾아요. 두 수 메이트예요.",
   "score": 9.11,
   "witness": [
    6,
    5,
    6,
    6
   ]
  },
  {
   "id": "m2quiet-11",
   "tier": 4,
   "fen": "7k/6pp/8/3b4/2pN4/2Q5/1P5K/8 w - - 0 1",
   "goal": "체크가 아닌 첫 수를 찾아요. 두 수 메이트예요.",
   "score": 9.56,
   "witness": [
    4,
    3,
    3,
    5
   ]
  },
  {
   "id": "m2quiet-12",
   "tier": 4,
   "fen": "4k3/5p2/p7/8/1B4b1/1N6/1K6/3Q4 w - - 0 1",
   "goal": "체크가 아닌 첫 수를 찾아요. 두 수 메이트예요.",
   "score": 9.94,
   "witness": [
    7,
    3,
    2,
    3
   ]
  },
  {
   "id": "m2quiet-13",
   "tier": 5,
   "fen": "3k4/1pp1Rq1R/8/1P1B4/8/8/n2K4/8 w - - 0 1",
   "goal": "말이 많아요. 조용한 첫 수로 두 수 메이트!",
   "score": 10.11,
   "witness": [
    1,
    4,
    1,
    5
   ]
  },
  {
   "id": "m2quiet-14",
   "tier": 5,
   "fen": "k7/pp4B1/3R4/p3qP2/8/8/K4nQ1/8 w - - 0 1",
   "goal": "말이 많아요. 조용한 첫 수로 두 수 메이트!",
   "score": 10.48,
   "witness": [
    1,
    6,
    3,
    4
   ]
  },
  {
   "id": "m2quiet-15",
   "tier": 5,
   "fen": "1k6/p1p5/2rp4/N3P3/4QB2/5K2/5n2/8 w - - 0 1",
   "goal": "말이 많아요. 조용한 첫 수로 두 수 메이트!",
   "score": 10.85,
   "witness": [
    4,
    4,
    2,
    2
   ]
  }
 ],
 "m2-sac": [
  {
   "id": "m2sac-01",
   "tier": 1,
   "fen": "7k/1b4pp/2R5/8/Q7/8/K7/8 w - - 0 1",
   "goal": "내 말을 내주는 첫 수! 상대가 잡으면 메이트해요.",
   "score": 5.68,
   "witness": [
    2,
    2,
    0,
    2
   ],
   "showHint": true
  },
  {
   "id": "m2sac-02",
   "tier": 1,
   "fen": "k7/pp6/7R/8/7r/2K5/8/7Q w - - 0 1",
   "goal": "내 말을 내주는 첫 수! 상대가 잡으면 메이트해요.",
   "score": 7.07,
   "witness": [
    2,
    7,
    0,
    7
   ]
  },
  {
   "id": "m2sac-03",
   "tier": 1,
   "fen": "6k1/5ppp/8/4R3/b7/8/6K1/4Q3 w - - 0 1",
   "goal": "내 말을 내주는 첫 수! 상대가 잡으면 메이트해요.",
   "score": 7.32,
   "witness": [
    3,
    4,
    0,
    4
   ]
  },
  {
   "id": "m2sac-04",
   "tier": 2,
   "fen": "k7/pp3b2/8/8/p3Q3/8/7K/6R1 w - - 0 1",
   "goal": "말을 내주고 두 수 메이트를 만들어요.",
   "score": 7.4,
   "witness": [
    7,
    6,
    0,
    6
   ]
  },
  {
   "id": "m2sac-05",
   "tier": 2,
   "fen": "kr6/pp6/1p6/R7/5Q2/8/8/2K5 w - - 0 1",
   "goal": "말을 내주고 두 수 메이트를 만들어요.",
   "score": 7.57,
   "witness": [
    3,
    0,
    1,
    0
   ]
  },
  {
   "id": "m2sac-06",
   "tier": 2,
   "fen": "7k/6pp/p7/8/1R3b2/1Q6/8/6K1 w - - 0 1",
   "goal": "말을 내주고 두 수 메이트를 만들어요.",
   "score": 7.57,
   "witness": [
    4,
    1,
    0,
    1
   ]
  },
  {
   "id": "m2sac-07",
   "tier": 3,
   "fen": "k7/pp6/4n3/8/4R3/Q7/4K3/3n4 w - - 0 1",
   "goal": "잡혀도 괜찮은 첫 수를 찾아요. 그다음 메이트!",
   "score": 7.69,
   "witness": [
    5,
    0,
    0,
    5
   ]
  },
  {
   "id": "m2sac-08",
   "tier": 3,
   "fen": "k7/pp2n1p1/8/8/8/1Q6/8/1KR5 w - - 0 1",
   "goal": "잡혀도 괜찮은 첫 수를 찾아요. 그다음 메이트!",
   "score": 7.94,
   "witness": [
    5,
    1,
    0,
    6
   ]
  },
  {
   "id": "m2sac-09",
   "tier": 3,
   "fen": "1k6/ppp5/5nQ1/8/6R1/8/1r6/3K4 w - - 0 1",
   "goal": "잡혀도 괜찮은 첫 수를 찾아요. 그다음 메이트!",
   "score": 8.19,
   "witness": [
    2,
    6,
    0,
    6
   ]
  },
  {
   "id": "m2sac-10",
   "tier": 4,
   "fen": "k5n1/pp2p3/8/6qN/8/1Q6/6R1/K7 w - - 0 1",
   "goal": "킹을 끌어내는 희생 수를 찾아요.",
   "score": 8.47,
   "witness": [
    5,
    1,
    0,
    6
   ]
  },
  {
   "id": "m2sac-11",
   "tier": 4,
   "fen": "1k6/ppppb3/8/6r1/5Q2/2K1R3/8/B7 w - - 0 1",
   "goal": "킹을 끌어내는 희생 수를 찾아요.",
   "score": 9.09,
   "witness": [
    4,
    5,
    0,
    5
   ]
  },
  {
   "id": "m2sac-12",
   "tier": 4,
   "fen": "1k6/pp6/5B2/8/1p3q1Q/5n2/3R2K1/8 w - - 0 1",
   "goal": "킹을 끌어내는 희생 수를 찾아요.",
   "score": 9.33,
   "witness": [
    2,
    5,
    3,
    4
   ]
  },
  {
   "id": "m2sac-13",
   "tier": 5,
   "fen": "1q3k1b/2R1ppp1/2Q5/8/N5P1/8/8/4nK2 w - - 0 1",
   "goal": "말이 많아요. 내주고 메이트하는 길을 찾아요.",
   "score": 9.37,
   "witness": [
    1,
    2,
    0,
    2
   ]
  },
  {
   "id": "m2sac-14",
   "tier": 5,
   "fen": "3q4/3RB1k1/r5p1/3Q4/7P/7K/8/n7 w - - 0 1",
   "goal": "말이 많아요. 내주고 메이트하는 길을 찾아요.",
   "score": 9.86,
   "witness": [
    1,
    4,
    2,
    5
   ]
  },
  {
   "id": "m2sac-15",
   "tier": 5,
   "fen": "3k4/1qpp2b1/3Q4/7R/1P6/1n2K3/8/4B3 w - - 0 1",
   "goal": "말이 많아요. 내주고 메이트하는 길을 찾아요.",
   "score": 10.24,
   "witness": [
    3,
    7,
    0,
    7
   ]
  }
 ],
 "remove-defender": [
  {
   "id": "defender-01",
   "tier": 1,
   "fen": "5k2/8/5P2/8/8/8/5Rb1/1K2n3 w - - 0 1",
   "goal": "지금 잡으면 손해예요. 첫 수로 흔들고, 두 번째 수에 말을 얻어요.",
   "score": 6,
   "witness": [
    6,
    5,
    6,
    4
   ],
   "showHint": true
  },
  {
   "id": "defender-02",
   "tier": 1,
   "fen": "6k1/Q1n4r/8/8/8/8/1KP5/8 w - - 0 1",
   "goal": "지금 잡으면 손해예요. 첫 수로 흔들고, 두 번째 수에 말을 얻어요.",
   "score": 6.08,
   "witness": [
    1,
    0,
    0,
    1
   ]
  },
  {
   "id": "defender-03",
   "tier": 1,
   "fen": "2B5/6k1/2p3n1/6Q1/8/8/8/K7 w - - 0 1",
   "goal": "지금 잡으면 손해예요. 첫 수로 흔들고, 두 번째 수에 말을 얻어요.",
   "score": 6.103,
   "witness": [
    0,
    2,
    3,
    5
   ]
  },
  {
   "id": "defender-04",
   "tier": 2,
   "fen": "1k6/5p2/8/1N1Q4/8/4qb2/5P2/K7 w - - 0 1",
   "goal": "체크나 공격으로 먼저 흔들어요. 그다음 말을 잡아요.",
   "score": 7.013,
   "witness": [
    3,
    3,
    2,
    3
   ]
  },
  {
   "id": "defender-05",
   "tier": 2,
   "fen": "k2r4/3n4/8/p7/P1RR4/8/2K5/8 w - - 0 1",
   "goal": "체크나 공격으로 먼저 흔들어요. 그다음 말을 잡아요.",
   "score": 7.075,
   "witness": [
    4,
    2,
    1,
    2
   ]
  },
  {
   "id": "defender-06",
   "tier": 2,
   "fen": "4Nk2/7r/1Q5p/P7/8/8/bK6/8 w - - 0 1",
   "goal": "체크나 공격으로 먼저 흔들어요. 그다음 말을 잡아요.",
   "score": 7.103,
   "witness": [
    0,
    4,
    2,
    5
   ]
  },
  {
   "id": "defender-07",
   "tier": 3,
   "fen": "1k6/b7/8/1r2Np2/8/3N4/2K5/Q7 w - - 0 1",
   "goal": "지켜 주는 말을 살펴요. 두 수 만에 말을 얻는 길은?",
   "score": 7.112,
   "witness": [
    3,
    4,
    2,
    2
   ]
  },
  {
   "id": "defender-08",
   "tier": 3,
   "fen": "6k1/2n3r1/3R4/3Np3/8/3B4/1K6/8 w - - 0 1",
   "goal": "지켜 주는 말을 살펴요. 두 수 만에 말을 얻는 길은?",
   "score": 7.117,
   "witness": [
    2,
    3,
    0,
    3
   ]
  },
  {
   "id": "defender-09",
   "tier": 3,
   "fen": "3Q4/7k/b1N5/8/5B2/1r2n3/8/K7 w - - 0 1",
   "goal": "지켜 주는 말을 살펴요. 두 수 만에 말을 얻는 길은?",
   "score": 7.121,
   "witness": [
    0,
    3,
    1,
    4
   ]
  },
  {
   "id": "defender-10",
   "tier": 4,
   "fen": "k7/8/4R3/6r1/P6N/4n2p/B7/6bK w - - 0 1",
   "goal": "상대가 무엇을 해도 두 번째 수에 이득을 보는 첫 수를 찾아요.",
   "score": 8.057,
   "witness": [
    4,
    7,
    5,
    5
   ]
  },
  {
   "id": "defender-11",
   "tier": 4,
   "fen": "k7/1p1n4/4B1R1/8/2B2q2/P7/2K5/2n5 w - - 0 1",
   "goal": "상대가 무엇을 해도 두 번째 수에 이득을 보는 첫 수를 찾아요.",
   "score": 8.097,
   "witness": [
    2,
    6,
    4,
    6
   ]
  },
  {
   "id": "defender-12",
   "tier": 4,
   "fen": "1b6/kq2p3/4B3/2Pn4/8/8/N1Q3K1/8 w - - 0 1",
   "goal": "상대가 무엇을 해도 두 번째 수에 이득을 보는 첫 수를 찾아요.",
   "score": 8.112,
   "witness": [
    6,
    2,
    4,
    0
   ]
  },
  {
   "id": "defender-13",
   "tier": 5,
   "fen": "N4k2/1R2p3/1Q3b2/3r4/1P6/5p2/b1K4P/8 w - - 0 1",
   "goal": "말이 많아요. 두 수 계획으로 말을 얻어요.",
   "score": 9.08,
   "witness": [
    2,
    1,
    2,
    0
   ]
  },
  {
   "id": "defender-14",
   "tier": 5,
   "fen": "1k4r1/4B3/Q3P3/p2q4/3P3B/7p/nK6/8 w - - 0 1",
   "goal": "말이 많아요. 두 수 계획으로 말을 얻어요.",
   "score": 9.1,
   "witness": [
    1,
    4,
    2,
    3
   ]
  },
  {
   "id": "defender-15",
   "tier": 5,
   "fen": "5k2/5r2/7P/3n1p2/1R2p3/7r/1K1P4/2N2Q2 w - - 0 1",
   "goal": "말이 많아요. 두 수 계획으로 말을 얻어요.",
   "score": 9.114,
   "witness": [
    4,
    1,
    0,
    1
   ]
  }
 ],
 "eg-kqk": [
  {
   "id": "kqk-01",
   "tier": 1,
   "fen": "k7/8/K7/8/8/3Q4/8/8 w - - 0 1",
   "goal": "퀸과 킹으로 체크메이트해요.",
   "score": 1.27,
   "limit": 4,
   "distance": 1,
   "showHint": true
  },
  {
   "id": "kqk-02",
   "tier": 1,
   "fen": "7k/2Q1K3/8/8/8/8/8/8 w - - 0 1",
   "goal": "퀸과 킹으로 체크메이트해요.",
   "score": 2.27,
   "limit": 5,
   "distance": 3
  },
  {
   "id": "kqk-03",
   "tier": 1,
   "fen": "8/8/4Q3/8/K7/8/8/1k6 w - - 0 1",
   "goal": "퀸과 킹으로 체크메이트해요.",
   "score": 2.3,
   "limit": 5,
   "distance": 3
  },
  {
   "id": "kqk-04",
   "tier": 2,
   "fen": "8/8/8/3K4/k7/8/7Q/8 w - - 0 1",
   "goal": "퀸으로 상대 킹을 가장자리로 몰아요.",
   "score": 3.29,
   "limit": 6,
   "distance": 5
  },
  {
   "id": "kqk-05",
   "tier": 2,
   "fen": "8/8/3Q4/8/8/5k1K/8/8 w - - 0 1",
   "goal": "퀸으로 상대 킹을 가장자리로 몰아요.",
   "score": 4.27,
   "limit": 8,
   "distance": 7
  },
  {
   "id": "kqk-06",
   "tier": 2,
   "fen": "2K5/8/8/2k5/8/3Q4/8/8 w - - 0 1",
   "goal": "퀸으로 상대 킹을 가장자리로 몰아요.",
   "score": 4.3,
   "limit": 8,
   "distance": 7
  },
  {
   "id": "kqk-07",
   "tier": 3,
   "fen": "8/8/8/2K5/2Q5/8/8/7k w - - 0 1",
   "goal": "퀸은 나이트처럼 한 칸 떨어져 따라가요. 킹을 가장자리로!",
   "score": 5.28,
   "limit": 10,
   "distance": 9
  },
  {
   "id": "kqk-08",
   "tier": 3,
   "fen": "3Q4/3K4/8/8/2k5/8/8/8 w - - 0 1",
   "goal": "퀸은 나이트처럼 한 칸 떨어져 따라가요. 킹을 가장자리로!",
   "score": 6.21,
   "limit": 12,
   "distance": 11
  },
  {
   "id": "kqk-09",
   "tier": 3,
   "fen": "1K6/6k1/8/5Q2/8/8/8/8 w - - 0 1",
   "goal": "퀸은 나이트처럼 한 칸 떨어져 따라가요. 킹을 가장자리로!",
   "score": 6.3,
   "limit": 12,
   "distance": 11
  },
  {
   "id": "kqk-10",
   "tier": 4,
   "fen": "4k3/8/8/Q7/8/8/8/6K1 w - - 0 1",
   "goal": "상대 킹을 상자에 가두고 상자를 줄여요.",
   "score": 7.26,
   "limit": 14,
   "distance": 13
  },
  {
   "id": "kqk-11",
   "tier": 4,
   "fen": "8/8/7k/8/8/2Q5/8/1K6 w - - 0 1",
   "goal": "상대 킹을 상자에 가두고 상자를 줄여요.",
   "score": 7.3,
   "limit": 14,
   "distance": 13
  },
  {
   "id": "kqk-12",
   "tier": 4,
   "fen": "3Q4/8/8/8/6k1/8/K7/8 w - - 0 1",
   "goal": "상대 킹을 상자에 가두고 상자를 줄여요.",
   "score": 8.26,
   "limit": 16,
   "distance": 15
  },
  {
   "id": "kqk-13",
   "tier": 5,
   "fen": "K6Q/8/8/8/4k3/8/8/8 w - - 0 1",
   "goal": "처음부터 끝까지! 퀸과 킹으로 체크메이트.",
   "score": 9.23,
   "limit": 18,
   "distance": 17
  },
  {
   "id": "kqk-14",
   "tier": 5,
   "fen": "6Q1/8/7K/2k5/8/8/8/8 w - - 0 1",
   "goal": "처음부터 끝까지! 퀸과 킹으로 체크메이트.",
   "score": 9.26,
   "limit": 18,
   "distance": 17
  },
  {
   "id": "kqk-15",
   "tier": 5,
   "fen": "7K/8/5Q2/8/8/3k4/8/8 w - - 0 1",
   "goal": "처음부터 끝까지! 퀸과 킹으로 체크메이트.",
   "score": 9.27,
   "limit": 18,
   "distance": 17
  }
 ],
 "eg-krk": [
  {
   "id": "krk-01",
   "tier": 1,
   "fen": "8/8/2R5/8/8/1K6/8/k7 w - - 0 1",
   "goal": "룩과 킹으로 체크메이트해요.",
   "score": 1.2,
   "limit": 4,
   "distance": 1,
   "showHint": true
  },
  {
   "id": "krk-02",
   "tier": 1,
   "fen": "1k6/8/8/K1R5/8/8/8/8 w - - 0 1",
   "goal": "룩과 킹으로 체크메이트해요.",
   "score": 2.18,
   "limit": 5,
   "distance": 3
  },
  {
   "id": "krk-03",
   "tier": 1,
   "fen": "8/2K5/8/k7/3R4/8/8/8 w - - 0 1",
   "goal": "룩과 킹으로 체크메이트해요.",
   "score": 2.21,
   "limit": 5,
   "distance": 3
  },
  {
   "id": "krk-04",
   "tier": 2,
   "fen": "8/8/1R6/8/8/8/7k/4K3 w - - 0 1",
   "goal": "룩으로 줄을 막고 킹으로 다가가요.",
   "score": 3.19,
   "limit": 6,
   "distance": 5
  },
  {
   "id": "krk-05",
   "tier": 2,
   "fen": "8/k7/8/3K4/8/8/6R1/8 w - - 0 1",
   "goal": "룩으로 줄을 막고 킹으로 다가가요.",
   "score": 3.22,
   "limit": 6,
   "distance": 5
  },
  {
   "id": "krk-06",
   "tier": 2,
   "fen": "8/1k6/3K4/8/4R3/8/8/8 w - - 0 1",
   "goal": "룩으로 줄을 막고 킹으로 다가가요.",
   "score": 5.2,
   "limit": 10,
   "distance": 9
  },
  {
   "id": "krk-07",
   "tier": 3,
   "fen": "4R3/8/7k/8/5K2/8/8/8 w - - 0 1",
   "goal": "룩이 상자를 만들고, 킹이 룩을 도와요.",
   "score": 6.21,
   "limit": 12,
   "distance": 11
  },
  {
   "id": "krk-08",
   "tier": 3,
   "fen": "8/8/8/8/R5K1/8/8/2k5 w - - 0 1",
   "goal": "룩이 상자를 만들고, 킹이 룩을 도와요.",
   "score": 8.2,
   "limit": 16,
   "distance": 15
  },
  {
   "id": "krk-09",
   "tier": 3,
   "fen": "8/5K2/4R3/8/5k2/8/8/8 w - - 0 1",
   "goal": "룩이 상자를 만들고, 킹이 룩을 도와요.",
   "score": 9.21,
   "limit": 18,
   "distance": 17
  },
  {
   "id": "krk-10",
   "tier": 4,
   "fen": "k7/8/7R/8/8/8/6K1/8 w - - 0 1",
   "goal": "상자를 한 줄씩 줄여요. 룩이 잡히지 않게!",
   "score": 10.22,
   "limit": 20,
   "distance": 19
  },
  {
   "id": "krk-11",
   "tier": 4,
   "fen": "8/8/8/K7/2R5/8/8/3k4 w - - 0 1",
   "goal": "상자를 한 줄씩 줄여요. 룩이 잡히지 않게!",
   "score": 12.19,
   "limit": 24,
   "distance": 23
  },
  {
   "id": "krk-12",
   "tier": 4,
   "fen": "4K2R/8/8/8/8/8/3k4/8 w - - 0 1",
   "goal": "상자를 한 줄씩 줄여요. 룩이 잡히지 않게!",
   "score": 13.14,
   "limit": 26,
   "distance": 25
  },
  {
   "id": "krk-13",
   "tier": 5,
   "fen": "K7/8/8/6k1/8/8/8/7R w - - 0 1",
   "goal": "처음부터 끝까지! 룩과 킹으로 체크메이트.",
   "score": 14.17,
   "limit": 28,
   "distance": 27
  },
  {
   "id": "krk-14",
   "tier": 5,
   "fen": "8/K7/4k3/8/8/6R1/8/8 w - - 0 1",
   "goal": "처음부터 끝까지! 룩과 킹으로 체크메이트.",
   "score": 14.19,
   "limit": 28,
   "distance": 27
  },
  {
   "id": "krk-15",
   "tier": 5,
   "fen": "8/R7/8/4k3/8/8/1K6/8 w - - 0 1",
   "goal": "처음부터 끝까지! 룩과 킹으로 체크메이트.",
   "score": 14.22,
   "limit": 28,
   "distance": 27
  }
 ],
 "eg-krrk": [
  {
   "id": "krrk-01",
   "tier": 1,
   "fen": "2k5/4R3/8/7R/8/5K2/8/8 w - - 0 1",
   "goal": "두 룩으로 사다리 메이트! 마지막 한두 수예요.",
   "score": 1.2,
   "limit": 5,
   "distance": 1,
   "showHint": true
  },
  {
   "id": "krrk-02",
   "tier": 1,
   "fen": "8/2R5/8/R3K3/8/8/8/1k6 w - - 0 1",
   "goal": "두 룩으로 사다리 메이트! 마지막 한두 수예요.",
   "score": 2.2,
   "limit": 6,
   "distance": 3
  },
  {
   "id": "krrk-03",
   "tier": 1,
   "fen": "8/7k/5K2/8/5R2/8/8/2R5 w - - 0 1",
   "goal": "두 룩으로 사다리 메이트! 마지막 한두 수예요.",
   "score": 2.55,
   "limit": 6,
   "distance": 3
  },
  {
   "id": "krrk-04",
   "tier": 2,
   "fen": "3R4/8/4R3/k7/8/7K/8/8 w - - 0 1",
   "goal": "두 룩이 번갈아 한 줄씩 밀어요.",
   "score": 2.75,
   "limit": 6,
   "distance": 3
  },
  {
   "id": "krrk-05",
   "tier": 2,
   "fen": "6R1/8/3R4/8/3K4/8/8/k7 w - - 0 1",
   "goal": "두 룩이 번갈아 한 줄씩 밀어요.",
   "score": 3.05,
   "limit": 6,
   "distance": 3
  },
  {
   "id": "krrk-06",
   "tier": 2,
   "fen": "8/6R1/4R2K/8/8/8/8/2k5 w - - 0 1",
   "goal": "두 룩이 번갈아 한 줄씩 밀어요.",
   "score": 4,
   "limit": 7,
   "distance": 5
  },
  {
   "id": "krrk-07",
   "tier": 3,
   "fen": "8/8/1K4k1/8/8/8/3R3R/8 w - - 0 1",
   "goal": "사다리처럼 한 줄씩! 룩이 킹 옆에 서지 않게.",
   "score": 4.9,
   "limit": 8,
   "distance": 7
  },
  {
   "id": "krrk-08",
   "tier": 3,
   "fen": "5R2/8/8/3K2R1/1k6/8/8/8 w - - 0 1",
   "goal": "사다리처럼 한 줄씩! 룩이 킹 옆에 서지 않게.",
   "score": 5.3,
   "limit": 8,
   "distance": 7
  },
  {
   "id": "krrk-09",
   "tier": 3,
   "fen": "8/1k6/8/R7/8/3K4/8/R7 w - - 0 1",
   "goal": "사다리처럼 한 줄씩! 룩이 킹 옆에 서지 않게.",
   "score": 6.05,
   "limit": 9,
   "distance": 9
  },
  {
   "id": "krrk-10",
   "tier": 4,
   "fen": "7R/8/2R5/5k2/8/8/8/2K5 w - - 0 1",
   "goal": "킹이 가운데 가까워요. 두 룩으로 가장자리까지 밀어요.",
   "score": 6.9,
   "limit": 10,
   "distance": 11
  },
  {
   "id": "krrk-11",
   "tier": 4,
   "fen": "8/8/3k4/8/5R2/2K5/R7/8 w - - 0 1",
   "goal": "킹이 가운데 가까워요. 두 룩으로 가장자리까지 밀어요.",
   "score": 7.8,
   "limit": 11,
   "distance": 13
  },
  {
   "id": "krrk-12",
   "tier": 4,
   "fen": "8/8/6R1/8/5k2/K7/8/6R1 w - - 0 1",
   "goal": "킹이 가운데 가까워요. 두 룩으로 가장자리까지 밀어요.",
   "score": 8.9,
   "limit": 12,
   "distance": 15
  },
  {
   "id": "krrk-13",
   "tier": 5,
   "fen": "R5K1/8/6R1/8/3k4/8/8/8 w - - 0 1",
   "goal": "가운데에서 시작해요. 두 룩 사다리로 끝까지!",
   "score": 9.25,
   "limit": 12,
   "distance": 15
  },
  {
   "id": "krrk-14",
   "tier": 5,
   "fen": "8/6K1/7R/4k3/8/8/7R/8 w - - 0 1",
   "goal": "가운데에서 시작해요. 두 룩 사다리로 끝까지!",
   "score": 10.05,
   "limit": 14,
   "distance": 17
  },
  {
   "id": "krrk-15",
   "tier": 5,
   "fen": "8/8/6R1/8/4k3/2R5/8/K7 w - - 0 1",
   "goal": "가운데에서 시작해요. 두 룩 사다리로 끝까지!",
   "score": 11.3,
   "limit": 17,
   "distance": 21
  }
 ],
 "eg-kpk": [
  {
   "id": "kpk-01",
   "tier": 1,
   "fen": "8/8/8/5P2/k7/8/8/3K4 w - - 0 1",
   "goal": "폰을 끝 줄까지 보내 퀸을 만들어요.",
   "score": 0.75,
   "limit": 11,
   "distance": 5,
   "showHint": true
  },
  {
   "id": "kpk-02",
   "tier": 1,
   "fen": "8/8/8/2K5/8/5P2/8/6k1 w - - 0 1",
   "goal": "폰을 끝 줄까지 보내 퀸을 만들어요.",
   "score": 1.35,
   "limit": 13,
   "distance": 9
  },
  {
   "id": "kpk-03",
   "tier": 1,
   "fen": "8/8/8/8/2P5/1k6/8/3K4 w - - 0 1",
   "goal": "폰을 끝 줄까지 보내 퀸을 만들어요.",
   "score": 4.25,
   "limit": 12,
   "distance": 7
  },
  {
   "id": "kpk-04",
   "tier": 2,
   "fen": "8/8/1K1P4/7k/8/8/8/8 w - - 0 1",
   "goal": "상대 킹이 폰을 따라잡을 수 있나요? 폰을 퀸으로!",
   "score": 0.45,
   "limit": 10,
   "distance": 3
  },
  {
   "id": "kpk-05",
   "tier": 2,
   "fen": "8/8/5K2/4P3/8/8/8/5k2 w - - 0 1",
   "goal": "상대 킹이 폰을 따라잡을 수 있나요? 폰을 퀸으로!",
   "score": 0.75,
   "limit": 11,
   "distance": 5
  },
  {
   "id": "kpk-06",
   "tier": 2,
   "fen": "8/8/8/K7/2P1k3/8/8/8 w - - 0 1",
   "goal": "상대 킹이 폰을 따라잡을 수 있나요? 폰을 퀸으로!",
   "score": 1.65,
   "limit": 14,
   "distance": 11
  },
  {
   "id": "kpk-07",
   "tier": 3,
   "fen": "8/8/8/8/4K3/2P5/1k6/8 w - - 0 1",
   "goal": "킹이 폰 앞에서 길을 열어 줘요.",
   "score": 4.017,
   "limit": 13,
   "distance": 9
  },
  {
   "id": "kpk-08",
   "tier": 3,
   "fen": "8/6k1/8/8/3P4/3K4/8/8 w - - 0 1",
   "goal": "킹이 폰 앞에서 길을 열어 줘요.",
   "score": 4.75,
   "limit": 16,
   "distance": 15
  },
  {
   "id": "kpk-09",
   "tier": 3,
   "fen": "8/3k4/8/8/4KP2/8/8/8 w - - 0 1",
   "goal": "킹이 폰 앞에서 길을 열어 줘요.",
   "score": 5.25,
   "limit": 16,
   "distance": 15
  },
  {
   "id": "kpk-10",
   "tier": 4,
   "fen": "3k4/8/8/8/4PK2/8/8/8 w - - 0 1",
   "goal": "킹과 킹이 마주 보는 자리(대치)를 생각해요.",
   "score": 5.75,
   "limit": 16,
   "distance": 15
  },
  {
   "id": "kpk-11",
   "tier": 4,
   "fen": "5k2/8/8/8/2P5/8/3K4/8 w - - 0 1",
   "goal": "킹과 킹이 마주 보는 자리(대치)를 생각해요.",
   "score": 6.706,
   "limit": 19,
   "distance": 21
  },
  {
   "id": "kpk-12",
   "tier": 4,
   "fen": "8/8/8/8/8/k7/2P5/3K4 w - - 0 1",
   "goal": "킹과 킹이 마주 보는 자리(대치)를 생각해요.",
   "score": 7.017,
   "limit": 23,
   "distance": 29
  },
  {
   "id": "kpk-13",
   "tier": 5,
   "fen": "1k6/8/8/8/8/1P2K3/8/8 w - - 0 1",
   "goal": "킹을 앞세워 폰을 퀸으로 만들어요.",
   "score": 7.306,
   "limit": 21,
   "distance": 25
  },
  {
   "id": "kpk-14",
   "tier": 5,
   "fen": "8/8/8/8/8/3k4/1P6/K7 w - - 0 1",
   "goal": "킹을 앞세워 폰을 퀸으로 만들어요.",
   "score": 7.65,
   "limit": 24,
   "distance": 31
  },
  {
   "id": "kpk-15",
   "tier": 5,
   "fen": "8/8/1k6/8/1K6/8/6P1/8 w - - 0 1",
   "goal": "킹을 앞세워 폰을 퀸으로 만들어요.",
   "score": 7.807,
   "limit": 25,
   "distance": 33
  }
 ],
 "op-center": [
  {
   "id": "center-01",
   "tier": 1,
   "fen": "rnbqkbnr/pppppp1p/6p1/8/8/3P4/PPP1PPPP/RNBQKBNR w KQkq - 0 1",
   "goal": "가운데 네 칸을 차지하거나 노리는 수를 두어요.",
   "score": 3.457,
   "witness": [
    5,
    3,
    4,
    3
   ],
   "showHint": true
  },
  {
   "id": "center-02",
   "tier": 1,
   "fen": "rnbqkbnr/pppp1ppp/4p3/8/8/5N2/PPPPPPPP/RNBQKB1R w KQkq - 0 1",
   "goal": "가운데 네 칸을 차지하거나 노리는 수를 두어요.",
   "score": 3.605,
   "witness": [
    6,
    3,
    4,
    3
   ]
  },
  {
   "id": "center-03",
   "tier": 1,
   "fen": "rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 1",
   "goal": "가운데 네 칸을 차지하거나 노리는 수를 두어요.",
   "score": 3.904,
   "witness": [
    7,
    1,
    5,
    2
   ]
  },
  {
   "id": "center-04",
   "tier": 2,
   "fen": "rnbqkbnr/pp1pppp1/2p4p/8/8/3P4/PPPBPPPP/RN1QKBNR w KQkq - 0 1",
   "goal": "폰이나 나이트로 가운데를 차지해요.",
   "score": 4.079,
   "witness": [
    5,
    3,
    4,
    3
   ]
  },
  {
   "id": "center-05",
   "tier": 2,
   "fen": "r1bqkbnr/pppppppp/2n5/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 1",
   "goal": "폰이나 나이트로 가운데를 차지해요.",
   "score": 4.321,
   "witness": [
    6,
    4,
    4,
    4
   ]
  },
  {
   "id": "center-06",
   "tier": 2,
   "fen": "rnbqkbnr/1ppp1ppp/4p3/p7/4P3/2N5/PPPP1PPP/R1BQKBNR w KQkq - 0 1",
   "goal": "폰이나 나이트로 가운데를 차지해요.",
   "score": 4.4,
   "witness": [
    6,
    3,
    4,
    3
   ]
  },
  {
   "id": "center-07",
   "tier": 3,
   "fen": "rnbqkb1r/ppppnppp/4p3/8/8/2N1P3/PPPP1PPP/R1BQKBNR w KQkq - 0 1",
   "goal": "가운데를 더 많이 차지하는 수는?",
   "score": 4.736,
   "witness": [
    5,
    4,
    4,
    4
   ]
  },
  {
   "id": "center-08",
   "tier": 3,
   "fen": "rnbqkb1r/pppp1ppp/4p3/3n4/3P4/4PN2/PPP2PPP/RNBQKB1R w KQkq - 0 1",
   "goal": "가운데를 더 많이 차지하는 수는?",
   "score": 4.942,
   "witness": [
    5,
    4,
    4,
    4
   ]
  },
  {
   "id": "center-09",
   "tier": 3,
   "fen": "r1bqk1nr/pppp1ppp/2nb4/4p3/4P3/2N5/PPPPBPPP/R1BQK1NR w KQkq - 0 1",
   "goal": "가운데를 더 많이 차지하는 수는?",
   "score": 5.057,
   "witness": [
    7,
    6,
    5,
    5
   ]
  },
  {
   "id": "center-10",
   "tier": 4,
   "fen": "r1bqkb1r/ppppp1pp/2n2p1n/8/8/3P2P1/PPPNPP1P/R1BQKBNR w KQkq - 0 1",
   "goal": "말을 잃지 않으면서 가운데를 노려요.",
   "score": 5.317,
   "witness": [
    6,
    4,
    4,
    4
   ]
  },
  {
   "id": "center-11",
   "tier": 4,
   "fen": "rn1qkbnr/pppb1ppp/3p4/4p3/4P3/2N5/PPPPNPPP/R1BQKB1R w KQkq - 0 1",
   "goal": "말을 잃지 않으면서 가운데를 노려요.",
   "score": 5.568,
   "witness": [
    6,
    3,
    4,
    3
   ]
  },
  {
   "id": "center-12",
   "tier": 4,
   "fen": "rn1qkbnr/ppp1p1pp/5p2/3p4/3P2b1/2N5/PPPBPPPP/R2QKBNR w KQkq - 0 1",
   "goal": "말을 잃지 않으면서 가운데를 노려요.",
   "score": 5.652,
   "witness": [
    7,
    6,
    5,
    5
   ]
  },
  {
   "id": "center-13",
   "tier": 5,
   "fen": "r2qkb1r/pp2pppp/2n1bn2/2pp4/N1PP4/4P3/PP2BPPP/R1BQK1NR w KQkq - 0 1",
   "goal": "안전하게 가운데를 차지해요.",
   "score": 5.8,
   "witness": [
    5,
    4,
    4,
    4
   ]
  },
  {
   "id": "center-14",
   "tier": 5,
   "fen": "rnbqkb1r/ppp1n1pp/4p3/3p1p2/3P3P/4BN2/PPP1PPP1/RN1QKB1R w KQkq - 0 1",
   "goal": "안전하게 가운데를 차지해요.",
   "score": 6.012,
   "witness": [
    7,
    1,
    5,
    2
   ]
  },
  {
   "id": "center-15",
   "tier": 5,
   "fen": "rnbq1rk1/pp1pbppp/4pn2/1Bp5/3P3P/2N1P3/PPP2PP1/R1BQK1NR w KQ - 0 1",
   "goal": "안전하게 가운데를 차지해요.",
   "score": 6.205,
   "witness": [
    5,
    4,
    4,
    4
   ]
  }
 ],
 "op-develop": [
  {
   "id": "develop-01",
   "tier": 1,
   "fen": "rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1",
   "goal": "집에 있는 나이트나 비숍을 꺼내요.",
   "score": 3.167,
   "witness": [
    7,
    1,
    5,
    2
   ],
   "showHint": true
  },
  {
   "id": "develop-02",
   "tier": 1,
   "fen": "rnbqk1nr/pppp1ppp/4p3/2b5/8/3P1N2/PPP1PPPP/RNBQKB1R w KQkq - 0 1",
   "goal": "집에 있는 나이트나 비숍을 꺼내요.",
   "score": 3.45,
   "witness": [
    7,
    1,
    5,
    2
   ]
  },
  {
   "id": "develop-03",
   "tier": 1,
   "fen": "rnbqkbnr/ppp2ppp/3pp3/8/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq - 0 1",
   "goal": "집에 있는 나이트나 비숍을 꺼내요.",
   "score": 3.813,
   "witness": [
    7,
    1,
    5,
    2
   ]
  },
  {
   "id": "develop-04",
   "tier": 2,
   "fen": "rnbqk1nr/pp1p1ppp/2pbp3/8/8/2NPP3/PPP2PPP/R1BQKBNR w KQkq - 0 1",
   "goal": "작은 말(나이트·비숍)을 꺼내요.",
   "score": 4.134,
   "witness": [
    7,
    2,
    6,
    3
   ]
  },
  {
   "id": "develop-05",
   "tier": 2,
   "fen": "rnbqk2r/ppppnppp/8/1Bb1p3/8/2P1P3/PP1P1PPP/RNBQK1NR w KQkq - 0 1",
   "goal": "작은 말(나이트·비숍)을 꺼내요.",
   "score": 4.421,
   "witness": [
    7,
    6,
    5,
    5
   ]
  },
  {
   "id": "develop-06",
   "tier": 2,
   "fen": "r1bqk1nr/ppppbppp/2n1p3/8/2P5/4P3/PP1PNPPP/RNBQKB1R w KQkq - 0 1",
   "goal": "작은 말(나이트·비숍)을 꺼내요.",
   "score": 4.49,
   "witness": [
    7,
    1,
    5,
    2
   ]
  },
  {
   "id": "develop-07",
   "tier": 3,
   "fen": "r1bqkb1r/ppppnppp/2n5/8/P2Pp3/4P3/1PP1NPPP/RNBQKB1R w KQkq - 0 1",
   "goal": "말을 잃지 않는 칸으로 꺼내요.",
   "score": 4.638,
   "witness": [
    7,
    1,
    5,
    2
   ]
  },
  {
   "id": "develop-08",
   "tier": 3,
   "fen": "r2qkbnr/pppb1ppp/2np4/4p3/2PP4/2N1P3/PP3PPP/R1BQKBNR w KQkq - 0 1",
   "goal": "말을 잃지 않는 칸으로 꺼내요.",
   "score": 4.929,
   "witness": [
    7,
    5,
    6,
    4
   ]
  },
  {
   "id": "develop-09",
   "tier": 3,
   "fen": "rnbqkb1r/pp1p1ppp/4pn2/2p3B1/3P4/7P/PPP1PPP1/RN1QKBNR w KQkq - 0 1",
   "goal": "말을 잃지 않는 칸으로 꺼내요.",
   "score": 5.092,
   "witness": [
    7,
    1,
    5,
    2
   ]
  },
  {
   "id": "develop-10",
   "tier": 4,
   "fen": "rnbqkb1r/pp2npp1/2ppp3/7p/3P4/P1P1P3/1P2NPPP/RNBQKB1R w KQkq - 0 1",
   "goal": "나이트는 가장자리보다 가운데 쪽으로!",
   "score": 5.28,
   "witness": [
    7,
    1,
    6,
    3
   ]
  },
  {
   "id": "develop-11",
   "tier": 4,
   "fen": "r1bqkbnr/1p2pppp/p1n5/3p2B1/2p1P3/1P1P1N2/P1P2PPP/RN1QKB1R w KQkq - 0 1",
   "goal": "나이트는 가장자리보다 가운데 쪽으로!",
   "score": 5.517,
   "witness": [
    7,
    1,
    5,
    2
   ]
  },
  {
   "id": "develop-12",
   "tier": 4,
   "fen": "r1bqkbnr/pp3ppp/1n1pp3/2p5/4N3/3PP3/PPP1NPPP/R1BQKB1R w KQkq - 0 1",
   "goal": "나이트는 가장자리보다 가운데 쪽으로!",
   "score": 5.667,
   "witness": [
    7,
    2,
    6,
    3
   ]
  },
  {
   "id": "develop-13",
   "tier": 5,
   "fen": "r1q1kb1r/p2n1ppp/1ppppn2/5b2/2PP4/1N2PN1P/PP3PP1/R1BQKB1R w KQkq - 0 1",
   "goal": "아직 집에 있는 작은 말을 안전하게 꺼내요.",
   "score": 5.936,
   "witness": [
    7,
    2,
    6,
    3
   ]
  },
  {
   "id": "develop-14",
   "tier": 5,
   "fen": "rnbqk2r/p1p1bppp/1p2pn2/3p2B1/2P1P3/N2P1P1P/PP4P1/R2QKBNR w KQkq - 0 1",
   "goal": "아직 집에 있는 작은 말을 안전하게 꺼내요.",
   "score": 6.028,
   "witness": [
    7,
    5,
    6,
    4
   ]
  },
  {
   "id": "develop-15",
   "tier": 5,
   "fen": "rnbqk1nr/5ppp/p2bp3/1pp5/3PpB2/2P3P1/PP1N1P1P/RN1QKB1R w KQkq - 0 1",
   "goal": "아직 집에 있는 작은 말을 안전하게 꺼내요.",
   "score": 6.226,
   "witness": [
    7,
    5,
    6,
    4
   ]
  }
 ],
 "op-castle": [
  {
   "id": "castle-01",
   "tier": 1,
   "fen": "r2qk1nr/1ppbbpp1/2n5/p2pp2p/N4P2/3PP2N/PPP1B1PP/R1BQK2R w KQkq - 0 1",
   "goal": "캐슬링으로 킹을 안전한 곳으로 옮겨요.",
   "score": 4.167,
   "witness": [
    7,
    4,
    7,
    6
   ],
   "showHint": true
  },
  {
   "id": "castle-02",
   "tier": 1,
   "fen": "r1bqkb1r/p1p2ppp/1pn2n2/3p4/4Pp2/P1NB3N/1PPP2PP/R1BQK2R w KQkq - 0 1",
   "goal": "캐슬링으로 킹을 안전한 곳으로 옮겨요.",
   "score": 4.432,
   "witness": [
    7,
    4,
    7,
    6
   ]
  },
  {
   "id": "castle-03",
   "tier": 1,
   "fen": "r1bq1bnr/ppp2kpp/5p2/3ppN2/1n2P3/3P4/PPP1BPPP/RNBQK2R w KQ - 0 1",
   "goal": "캐슬링으로 킹을 안전한 곳으로 옮겨요.",
   "score": 4.447,
   "witness": [
    7,
    4,
    7,
    6
   ]
  },
  {
   "id": "castle-04",
   "tier": 2,
   "fen": "rnbq1rk1/p3bpp1/1ppppn1p/8/1P6/N1PPB1PP/P2QPPB1/R3K1NR w KQ - 0 1",
   "goal": "킹을 두 칸 옮기면 룩이 넘어와요. 캐슬링!",
   "score": 4.682,
   "witness": [
    7,
    4,
    7,
    2
   ]
  },
  {
   "id": "castle-05",
   "tier": 2,
   "fen": "rnbqkb1r/p3n1pp/1pp1p3/5p2/2PP4/3B1N1P/PP1P1PP1/RNBQK2R w KQkq - 0 1",
   "goal": "킹을 두 칸 옮기면 룩이 넘어와요. 캐슬링!",
   "score": 4.771,
   "witness": [
    7,
    4,
    7,
    6
   ]
  },
  {
   "id": "castle-06",
   "tier": 2,
   "fen": "r2q1rk1/pppb1pp1/2nppn1p/8/1b1P1B2/4PN2/PPPNBPPP/R2QK2R w KQ - 0 1",
   "goal": "킹을 두 칸 옮기면 룩이 넘어와요. 캐슬링!",
   "score": 4.879,
   "witness": [
    7,
    4,
    7,
    6
   ]
  },
  {
   "id": "castle-07",
   "tier": 3,
   "fen": "r3k1nr/p1pqp2p/bp1p1ppb/8/Nn1P4/P1P1PN2/1P2BPPP/R1BQK2R w KQkq - 0 1",
   "goal": "캐슬링할 수 있을 때 해요.",
   "score": 5.132,
   "witness": [
    7,
    4,
    7,
    6
   ]
  },
  {
   "id": "castle-08",
   "tier": 3,
   "fen": "r1bqk1nr/1p3p1p/p2bp3/2np2pQ/2p2P2/2NPPN2/PPPBB1PP/R3K2R w KQkq - 0 1",
   "goal": "캐슬링할 수 있을 때 해요.",
   "score": 5.322,
   "witness": [
    7,
    4,
    7,
    6
   ]
  },
  {
   "id": "castle-09",
   "tier": 3,
   "fen": "r2qk1nr/pp1b1ppp/2n1pb2/2PpP1B1/1PB4P/2N5/P1P1NPP1/R2QK2R w KQkq - 0 1",
   "goal": "캐슬링할 수 있을 때 해요.",
   "score": 5.611,
   "witness": [
    7,
    4,
    7,
    6
   ]
  },
  {
   "id": "castle-10",
   "tier": 4,
   "fen": "r1b1kr2/1pppnpp1/2nbpq2/p6p/3P4/2P1PN2/PP1NBPPP/R1BQK2R w KQq - 0 1",
   "goal": "어느 쪽으로 캐슬링할 수 있나요?",
   "score": 5.679,
   "witness": [
    7,
    4,
    7,
    6
   ]
  },
  {
   "id": "castle-11",
   "tier": 4,
   "fen": "2rqkb1r/pppnppp1/n6p/3bN3/2BPp1Q1/2N5/PPPB1PPP/R3K2R w KQk - 0 1",
   "goal": "어느 쪽으로 캐슬링할 수 있나요?",
   "score": 5.864,
   "witness": [
    7,
    4,
    7,
    6
   ]
  },
  {
   "id": "castle-12",
   "tier": 4,
   "fen": "r2qk1nr/pp1nb1pp/2p2p2/4pb2/2BP3P/2N1PN2/PP1B1PP1/R2QK2R w KQkq - 0 1",
   "goal": "어느 쪽으로 캐슬링할 수 있나요?",
   "score": 6.213,
   "witness": [
    7,
    4,
    7,
    6
   ]
  },
  {
   "id": "castle-13",
   "tier": 5,
   "fen": "r1bq1rk1/1p1nb1pp/4p3/pB1p1p2/Q1NPnP2/P1P1P2P/1P1B2P1/RN2K2R w KQ - 0 1",
   "goal": "말이 많아요. 캐슬링으로 킹을 지켜요.",
   "score": 6.346,
   "witness": [
    7,
    4,
    7,
    6
   ]
  },
  {
   "id": "castle-14",
   "tier": 5,
   "fen": "r1bq1rk1/p2nn1pp/2p5/1pbpppB1/P3P3/2NP1N1P/1PP1BPP1/R2QK2R w KQ - 0 1",
   "goal": "말이 많아요. 캐슬링으로 킹을 지켜요.",
   "score": 6.405,
   "witness": [
    7,
    4,
    7,
    6
   ]
  },
  {
   "id": "castle-15",
   "tier": 5,
   "fen": "r2q1rk1/p1p3pp/1p2pn2/n1P2b2/3Pp3/b3PN2/PP1BBPPP/R1Q1K2R w KQ - 0 1",
   "goal": "말이 많아요. 캐슬링으로 킹을 지켜요.",
   "score": 6.482,
   "witness": [
    7,
    4,
    7,
    6
   ]
  }
 ],
 "op-trap": [
  {
   "id": "trap-01",
   "tier": 1,
   "fen": "rnb1k1nr/pppp1ppp/5q2/2b1p3/4P1P1/3B4/PPPP1P1P/RNBQK1NR w KQkq - 0 1",
   "goal": "상대가 다음 수에 체크메이트를 노려요! 막아요.",
   "score": 3.99,
   "witness": [
    6,
    5,
    5,
    5
   ],
   "showHint": true
  },
  {
   "id": "trap-02",
   "tier": 1,
   "fen": "r1b1k1nr/pppp1ppp/2n5/2b1p3/4P1Pq/2N5/PPPPNP1P/R1BQKB1R w KQkq - 0 1",
   "goal": "상대가 다음 수에 체크메이트를 노려요! 막아요.",
   "score": 4.25,
   "witness": [
    6,
    3,
    5,
    3
   ]
  },
  {
   "id": "trap-03",
   "tier": 1,
   "fen": "rnb1k1nr/pppp1ppp/8/2b1p3/4P2q/2NB4/PPPP1PPP/R1BQK1NR w KQkq - 0 1",
   "goal": "상대가 다음 수에 체크메이트를 노려요! 막아요.",
   "score": 4.557,
   "witness": [
    6,
    6,
    5,
    6
   ]
  },
  {
   "id": "trap-04",
   "tier": 2,
   "fen": "rnb1k1nr/pppp1ppp/4p3/2b5/6Pq/1P6/PBPPPP1P/RN1QKBNR w KQkq - 0 1",
   "goal": "초반 함정이에요. 상대 퀸이 노리는 칸을 막아요.",
   "score": 4.7,
   "witness": [
    6,
    3,
    5,
    3
   ]
  },
  {
   "id": "trap-05",
   "tier": 2,
   "fen": "rnb1k1nr/pppp1ppp/8/2b1p3/4P2q/3B4/PPPP1PPP/RNBQK1NR w KQkq - 0 1",
   "goal": "초반 함정이에요. 상대 퀸이 노리는 칸을 막아요.",
   "score": 4.91,
   "witness": [
    6,
    6,
    5,
    6
   ]
  },
  {
   "id": "trap-06",
   "tier": 2,
   "fen": "rnb1k1nr/pppp1ppp/8/2b1p3/4P1Pq/3B4/PPPP1P1P/RNBQK1NR w KQkq - 0 1",
   "goal": "초반 함정이에요. 상대 퀸이 노리는 칸을 막아요.",
   "score": 5.136,
   "witness": [
    7,
    3,
    6,
    4
   ]
  },
  {
   "id": "trap-07",
   "tier": 3,
   "fen": "r1b1k1nr/pppp1ppp/2n5/2b1p3/4P2q/3P4/PPPBNPPP/RN1QKB1R w KQkq - 0 1",
   "goal": "체크메이트 위협을 찾아 막아요.",
   "score": 5.243,
   "witness": [
    5,
    3,
    4,
    3
   ]
  },
  {
   "id": "trap-08",
   "tier": 3,
   "fen": "rnb1k1nr/pppp1ppp/8/2b1p3/4P1Pq/2N5/PPPP1P1P/R1BQKBNR w KQkq - 0 1",
   "goal": "체크메이트 위협을 찾아 막아요.",
   "score": 5.359,
   "witness": [
    6,
    3,
    4,
    3
   ]
  },
  {
   "id": "trap-09",
   "tier": 3,
   "fen": "rnb1k1nr/pppp1ppp/8/2b1p3/2B1P1Pq/8/PPPP1P1P/RNBQK1NR w KQkq - 0 1",
   "goal": "체크메이트 위협을 찾아 막아요.",
   "score": 5.557,
   "witness": [
    6,
    3,
    4,
    3
   ]
  },
  {
   "id": "trap-10",
   "tier": 4,
   "fen": "rnb1k1nr/pppp1ppp/8/2b1p3/4P1Pq/8/PPPP1P1P/RNBQKBNR w KQkq - 0 1",
   "goal": "막으면서 내 말도 잃지 않게!",
   "score": 5.7,
   "witness": [
    6,
    3,
    4,
    3
   ]
  },
  {
   "id": "trap-11",
   "tier": 4,
   "fen": "r1b1k1nr/pppp1ppp/2n5/2b1p3/P3P1Pq/8/1PPPNP1P/RNBQKB1R w KQkq - 0 1",
   "goal": "막으면서 내 말도 잃지 않게!",
   "score": 5.829,
   "witness": [
    6,
    3,
    5,
    3
   ]
  },
  {
   "id": "trap-12",
   "tier": 4,
   "fen": "rnb1k1nr/pppp1ppp/4p3/2b5/4P2q/8/PPPPBPPP/RNBQK1NR w KQkq - 0 1",
   "goal": "막으면서 내 말도 잃지 않게!",
   "score": 5.91,
   "witness": [
    6,
    3,
    5,
    3
   ]
  },
  {
   "id": "trap-13",
   "tier": 5,
   "fen": "rnb1k1nr/pppp1ppp/8/2b1p3/4P1Pq/N7/PPPP1P1P/R1BQKBNR w KQkq - 0 1",
   "goal": "상대의 노림수를 찾아 막아요.",
   "score": 6.2,
   "witness": [
    6,
    3,
    4,
    3
   ]
  },
  {
   "id": "trap-14",
   "tier": 5,
   "fen": "rnb1k1nr/pppp1ppp/4p3/2b5/4P2q/3B4/PPPPNPPP/RNBQK2R w KQkq - 0 1",
   "goal": "상대의 노림수를 찾아 막아요.",
   "score": 6.333,
   "witness": [
    6,
    4,
    5,
    6
   ]
  },
  {
   "id": "trap-15",
   "tier": 5,
   "fen": "rnb1k1nr/pppp1ppp/4pq2/2b5/8/1P1P4/P1PNPPPP/R1BQKBNR w KQkq - 0 1",
   "goal": "상대의 노림수를 찾아 막아요.",
   "score": 6.702,
   "witness": [
    5,
    3,
    4,
    3
   ]
  }
 ]
};
const COURSE_DRILL_BANDS = {"m2-check":[[4.07,7.02],[4.94,6.64],[5.32,7.27],[6.22,7.92],[7.11,9.07]],"m2-quiet":[[5.92,8.58],[5.31,7.83],[6.5,9.28],[8.23,9.96],[9.85,11.32]],"m2-sac":[[5.62,7.57],[6.12,7.69],[6.49,8.19],[7.27,9.59],[7.67,9.62]],"remove-defender":[[5.978,6.112],[6.986,7.114],[7.042,7.121],[8.033,8.114],[9.057,9.125]],"eg-kqk":[[1.25,2.32],[3.26,4.32],[5.26,6.31],[7.25,8.29],[9.23,9.28]],"eg-krk":[[1.17,2.22],[3.17,5.22],[6.17,9.22],[10.19,13.19],[14.16,15.18]],"eg-krrk":[[1.15,2.65],[2.3,4.05],[4.75,6.5],[6.6,9.6],[9,11.5]],"eg-kpk":[[0.75,4.779],[0.15,3.572],[3.872,5.506],[5.061,7.306],[5.361,7.807]],"op-center":[[3.373,3.75],[3.955,4.567],[4.671,5.158],[5.121,5.75],[5.754,6.284]],"op-develop":[[3.15,3.91],[3.573,4.583],[4.485,5.2],[5.159,5.771],[5.812,6.326]],"op-castle":[[4.145,4.652],[4.629,5.086],[5.096,5.611],[5.652,6.213],[6.121,6.56]],"op-trap":[[3.908,4.636],[4.25,5.136],[4.75,5.926],[5.307,6.057],[5.908,6.764]]};
