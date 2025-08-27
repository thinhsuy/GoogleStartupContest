import React from "react";
import styled, { keyframes } from "styled-components";

const floatAnimation = keyframes`
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
  100% {
    transform: translateY(0);
  }
`;

const waveAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0 #5388f2;
  }
  70% {
    box-shadow: 0 0 0 10px rgba(52, 152, 219, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(52, 152, 219, 0);
  }
`;

export const CustomToolTip = styled.div`animation: ${floatAnimation} 3s ease-in-out infinite;
`

// Styled component for the button with floating and wave animations
export const StartFloatingButton = styled.button`
    position: relative;
    width: 65px;
    height: 65px;
    background-color: ${(props) => props.disabled ? "lightgray" : "#3C76F1"};
    color: white;
    padding: 15px 30px;
    font-size: 18px;
    border: 3px solid white;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0px 0px 13px 6px rgba(16, 76, 232, 0.2);
    transition: background-color 0.3s ease;
    display: flex;
    justify-content: center;
    align-items: center;

    animation: ${floatAnimation} 3s ease-in-out infinite;

    &::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 120%;
        height: 120%;
        border-radius: 50%;
        z-index: -1;
        animation: ${waveAnimation} 2s ease-out infinite;
        box-shadow: 0 0 0 0 rgba(52, 152, 219, 0.7);
    }
`;


export const StopFloatingButton = styled.button`
  position: relative;
  width: 65px;
  height: 65px;
  background: #fe8800;
  background: ${(props) => props.disabled ? "lightgray": "linear-gradient(240deg, #fe8800 0%, #feae00 100%)"};
  color: white;
  font-size: 18px;
    border: 3px solid white;
  border-radius: 50%;
  cursor: pointer;
    box-shadow: 0px 0px 13px 6px rgba(232, 146, 16, 0.2);
  transition: background-color 0.3s ease;

  animation: ${floatAnimation} 3s ease-in-out infinite;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 120%;
    height: 120%;
    border-radius: 50%;
    z-index: -1;
    animation: ${waveAnimation} 2s ease-out infinite;
    box-shadow: 0 0 0 0 rgba(52, 152, 219, 0.7);
  }
`;
