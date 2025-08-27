// components/AudioWave.tsx
import React from "react";
import styled, { keyframes } from "styled-components";

const waveAnim = keyframes`
  0% { height: 10%; }
  50% { height: 100%; }
  100% { height: 10%; }
`;

const WaveContainer = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 40px;
  width: 100%;
`;

const Bar = styled.div<{ delay: string; active: boolean }>`
  flex: 1;
  margin: 0 2px;
  border-radius: 2px;
  background: ${(props) => (props.active ? "#3c76f1" : "#ff3c3c")};
  animation: ${waveAnim} 1s infinite;
  animation-delay: ${(props) => props.delay};
  transition: background-color 0.5s ease;   // chuyển màu mượt
`;

interface Props {
  isSpeaker: boolean;
  bars?: number;
}

const AudioWave: React.FC<Props> = ({ isSpeaker, bars = 10 }) => {
  return (
    <WaveContainer>
      {Array.from({ length: bars }).map((_, i) => (
        <Bar key={i} delay={`${i * 0.1}s`} active={isSpeaker} />
      ))}
    </WaveContainer>
  );
};

export default AudioWave;
