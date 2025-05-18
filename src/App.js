import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// 전체화면 대응: 창 크기 사용
const getGameWidth = () => window.innerWidth;
const getGameHeight = () => window.innerHeight;

const BIRD_SIZE = 90;
const GRAVITY = 2;
const JUMP_HEIGHT = 60;
const PIPE_WIDTH = 100;
const PIPE_GAP = 240;
const OBSTACLE_COUNT_ON_SCREEN = 5;

function getRandomPipeY(gameHeight) {
  // 파이프의 상단 위치를 무작위로 반환
  const min = 50;
  const max = gameHeight - PIPE_GAP - 50;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function App() {
  const [gameWidth, setGameWidth] = useState(getGameWidth());
  const [gameHeight, setGameHeight] = useState(getGameHeight());
  const OBSTACLE_DISTANCE = gameWidth / OBSTACLE_COUNT_ON_SCREEN;
  const [birdY, setBirdY] = useState(getGameHeight() / 2);
  const [velocity, setVelocity] = useState(0);
  const [pipes, setPipes] = useState(
    Array.from({ length: OBSTACLE_COUNT_ON_SCREEN }, (_, i) => ({
      x: getGameWidth() + i * (getGameWidth() / OBSTACLE_COUNT_ON_SCREEN),
      y: getRandomPipeY(getGameHeight())
    }))
  );
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [bgX, setBgX] = useState(0);
  const gameRef = useRef();

  // 새 점프
  const handleJump = () => {
    if (!gameOver) {
      setVelocity(-JUMP_HEIGHT / 8);
    } else {
      // 게임 오버 상태에서 스페이스바 누르면 재시작
      restartGame();
    }
  };

  // 키보드 이벤트
  useEffect(() => {
    const onSpace = (e) => {
      if (e.code === 'Space') {
        handleJump();
      }
    };
    window.addEventListener('keydown', onSpace);
    return () => window.removeEventListener('keydown', onSpace);
    // eslint-disable-next-line
  }, [gameOver]);

  // 게임 루프
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setBirdY((prev) => Math.max(prev + velocity + GRAVITY, 0));
      setVelocity((v) => v + GRAVITY / 8);
      setPipes((prevPipes) => {
        let newPipes = prevPipes.map((pipe) => ({ ...pipe, x: pipe.x - 7 }));
        // 각 장애물이 화면을 벗어나면 오른쪽 끝으로 재배치
        newPipes = newPipes.map((pipe) =>
          pipe.x < -PIPE_WIDTH
            ? { x: Math.max(...newPipes.map(p => p.x)) + OBSTACLE_DISTANCE, y: getRandomPipeY(gameHeight) }
            : pipe
        );
        return newPipes;
      });
      setBgX((prev) => prev - 0.5); // 배경을 천천히 왼쪽으로 이동
    }, 20);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [velocity, gameOver, gameWidth, gameHeight]);

  // 충돌 및 점수 체크
  useEffect(() => {
    if (gameOver) return;
    const birdBox = {
      top: birdY,
      bottom: birdY + BIRD_SIZE,
      left: 60,
      right: 60 + BIRD_SIZE,
    };
    pipes.forEach((pipe) => {
      // Holy Firewall 실제 시각 영역(중앙 16px)만 충돌 체크
      const visibleLeft = pipe.x + (PIPE_WIDTH - 16) / 2;
      const visibleRight = pipe.x + (PIPE_WIDTH + 16) / 2;
      // 파이프 상단, 하단
      const pipeTop = {
        top: 0,
        bottom: pipe.y,
        left: visibleLeft,
        right: visibleRight,
      };
      const pipeBottom = {
        top: pipe.y + PIPE_GAP,
        bottom: gameHeight,
        left: visibleLeft,
        right: visibleRight,
      };
      // 충돌 체크
      if (
        (birdBox.right > pipeTop.left &&
          birdBox.left < pipeTop.right &&
          birdBox.top < pipeTop.bottom) ||
        (birdBox.right > pipeBottom.left &&
          birdBox.left < pipeBottom.right &&
          birdBox.bottom > pipeBottom.top)
      ) {
        setGameOver(true);
      }
      // 바닥/천장 충돌
      if (birdY + BIRD_SIZE > gameHeight || birdY < 0) {
        setGameOver(true);
      }
      // 점수 체크
      if (
        pipe.x + PIPE_WIDTH < birdBox.left &&
        !pipe.passed
      ) {
        pipe.passed = true;
        setScore((s) => s + 1);
      }
    });
    // eslint-disable-next-line
  }, [birdY, pipes, gameOver, gameWidth, gameHeight]);

  // 게임 재시작
  const restartGame = () => {
    setBirdY(gameHeight / 2);
    setVelocity(0);
    setPipes(
      Array.from({ length: OBSTACLE_COUNT_ON_SCREEN }, (_, i) => ({
        x: gameWidth + i * OBSTACLE_DISTANCE,
        y: getRandomPipeY(gameHeight)
      }))
    );
    setScore(0);
    setGameOver(false);
    setBgX(0);
  };

  // 창 크기 변경 시 전체화면 대응
  useEffect(() => {
    const handleResize = () => {
      setGameWidth(getGameWidth());
      setGameHeight(getGameHeight());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className="App"
      style={{ background: '#fff', minHeight: '100vh', fontFamily: "'Press Start 2P', 'VT323', 'Pixel', 'monospace'" }}
      tabIndex={0}
      ref={gameRef}
      onClick={handleJump}
    >
      <h1 style={{ fontFamily: "'Press Start 2P', 'VT323', 'Pixel', 'monospace'" }}>Flappy Bird</h1>
      <div
        style={{
          position: 'relative',
          width: '100vw',
          height: '100vh',
          margin: '0 auto',
          background: `url('/background2.png') ${bgX}px center/cover no-repeat`,
          overflow: 'hidden',
        }}
      >
        {/* 픽셀아트 사이버펑크 캐릭터 */}
        <div
          style={{
            position: 'absolute',
            left: 60,
            top: birdY,
            width: BIRD_SIZE,
            height: BIRD_SIZE,
            pointerEvents: 'none',
          }}
        >
          <img
            src="/bird.png"
            alt="bird"
            width={BIRD_SIZE}
            height={BIRD_SIZE}
            style={{
              width: BIRD_SIZE,
              height: BIRD_SIZE,
              imageRendering: 'pixelated',
              display: 'block',
            }}
          />
        </div>
        {/* 파이프 */}
        {pipes.map((pipe, idx) => (
          <React.Fragment key={idx}>
            {/* 위 Holy Firewall 장애물 */}
            <div
              style={{
                position: 'absolute',
                left: pipe.x,
                top: 0,
                width: PIPE_WIDTH,
                height: pipe.y,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                pointerEvents: 'none',
              }}
            >
              <svg
                width={PIPE_WIDTH}
                height={pipe.y}
                viewBox="0 0 32 128"
                style={{ imageRendering: 'pixelated', background: 'none' }}
                shapeRendering="crispEdges"
              >
                {/* Neon Glow Background */}
                <rect x="4" y="0" width="24" height="128" fill="#ffd700" opacity="0.15"/>
                <rect x="0" y="0" width="32" height="128" fill="#ff0040" opacity="0.07"/>
                {/* Main Barrier */}
                <rect x="8" y="0" width="16" height="128" fill="#ffd700"/>
                {/* Red Neon Borders */}
                <rect x="8" y="0" width="16" height="2" fill="#ff0040"/>
                <rect x="8" y="126" width="16" height="2" fill="#ff0040"/>
                <rect x="8" y="0" width="2" height="128" fill="#ff0040"/>
                <rect x="22" y="0" width="2" height="128" fill="#ff0040"/>
                {/* Sacred Geometric Pattern (Hexagon) */}
                <polygon points="16,16 20,20 20,28 16,32 12,28 12,20" fill="#fffbe6" opacity="0.7"/>
                {/* Sacred Cross */}
                <rect x="15" y="50" width="2" height="20" fill="#fffbe6"/>
                <rect x="12" y="58" width="8" height="2" fill="#fffbe6"/>
                {/* Glitching Circuit Symbols */}
                <rect x="10" y="24" width="2" height="8" fill="#ff0040" opacity="0.7"/>
                <rect x="20" y="40" width="2" height="12" fill="#fff" opacity="0.5"/>
                <rect x="12" y="80" width="8" height="2" fill="#ff0040" opacity="0.5"/>
                <rect x="18" y="100" width="2" height="10" fill="#fff" opacity="0.7"/>
                {/* Moving Code Lines (static for pixel art) */}
                <rect x="14" y="10" width="1" height="16" fill="#fff" opacity="0.7"/>
                <rect x="17" y="60" width="1" height="20" fill="#ffd700" opacity="0.7"/>
                {/* Glitch Breaks */}
                <rect x="8" y="64" width="16" height="2" fill="#ff0040" opacity="0.3"/>
                <rect x="8" y="90" width="8" height="2" fill="#fff" opacity="0.2"/>
                {/* Sacred Triangle */}
                <polygon points="16,110 20,120 12,120" fill="#fffbe6" opacity="0.5"/>
              </svg>
            </div>
            {/* 아래 Holy Firewall 장애물 */}
            <div
              style={{
                position: 'absolute',
                left: pipe.x,
                top: pipe.y + PIPE_GAP,
                width: PIPE_WIDTH,
                height: gameHeight - pipe.y - PIPE_GAP,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                pointerEvents: 'none',
              }}
            >
              <svg
                width={PIPE_WIDTH}
                height={gameHeight - pipe.y - PIPE_GAP}
                viewBox="0 0 32 128"
                style={{ imageRendering: 'pixelated', background: 'none' }}
                shapeRendering="crispEdges"
              >
                {/* Neon Glow Background */}
                <rect x="4" y="0" width="24" height="128" fill="#ffd700" opacity="0.15"/>
                <rect x="0" y="0" width="32" height="128" fill="#ff0040" opacity="0.07"/>
                {/* Main Barrier */}
                <rect x="8" y="0" width="16" height="128" fill="#ffd700"/>
                {/* Red Neon Borders */}
                <rect x="8" y="0" width="16" height="2" fill="#ff0040"/>
                <rect x="8" y="126" width="16" height="2" fill="#ff0040"/>
                <rect x="8" y="0" width="2" height="128" fill="#ff0040"/>
                <rect x="22" y="0" width="2" height="128" fill="#ff0040"/>
                {/* Sacred Geometric Pattern (Hexagon) */}
                <polygon points="16,16 20,20 20,28 16,32 12,28 12,20" fill="#fffbe6" opacity="0.7"/>
                {/* Sacred Cross */}
                <rect x="15" y="50" width="2" height="20" fill="#fffbe6"/>
                <rect x="12" y="58" width="8" height="2" fill="#fffbe6"/>
                {/* Glitching Circuit Symbols */}
                <rect x="10" y="24" width="2" height="8" fill="#ff0040" opacity="0.7"/>
                <rect x="20" y="40" width="2" height="12" fill="#fff" opacity="0.5"/>
                <rect x="12" y="80" width="8" height="2" fill="#ff0040" opacity="0.5"/>
                <rect x="18" y="100" width="2" height="10" fill="#fff" opacity="0.7"/>
                {/* Moving Code Lines (static for pixel art) */}
                <rect x="14" y="10" width="1" height="16" fill="#fff" opacity="0.7"/>
                <rect x="17" y="60" width="1" height="20" fill="#ffd700" opacity="0.7"/>
                {/* Glitch Breaks */}
                <rect x="8" y="64" width="16" height="2" fill="#ff0040" opacity="0.3"/>
                <rect x="8" y="90" width="8" height="2" fill="#fff" opacity="0.2"/>
                {/* Sacred Triangle */}
                <polygon points="16,110 20,120 12,120" fill="#fffbe6" opacity="0.5"/>
              </svg>
            </div>
          </React.Fragment>
        ))}
        {/* 점수 (중앙 상단) */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 0,
            width: '100%',
            textAlign: 'center',
            fontSize: 32,
            color: '#fff',
            textShadow: '2px 2px 8px #333',
            fontWeight: 'bold',
            fontFamily: "'Press Start 2P', 'VT323', 'Pixel', 'monospace'",
          }}
        >
          {score}
        </div>
        {/* 게임 오버 */}
        {gameOver && (
          <div
            style={{
              position: 'absolute',
              top: '40%',
              left: 0,
              width: '100%',
              textAlign: 'center',
              color: 'red',
              fontSize: 36,
              fontWeight: 'bold',
              textShadow: '2px 2px 8px #fff',
              fontFamily: "'Press Start 2P', 'VT323', 'Pixel', 'monospace'",
            }}
          >
            GAME OVER<br />
            <span style={{ fontSize: 20, color: '#fff', fontFamily: "'Press Start 2P', 'VT323', 'Pixel', 'monospace'" }}>
              Press SPACE or click to restart
            </span>
          </div>
        )}
      </div>
      <div style={{ marginTop: 20, color: '#333', fontFamily: "'Press Start 2P', 'VT323', 'Pixel', 'monospace'" }}>
        <b>How to play:</b> Press SPACE or click to jump
      </div>
    </div>
  );
}

export default App;
