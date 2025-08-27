import styled from "styled-components";

export const PhoneShape = styled.div`
  max-width: 428px;
  width: 100vw;
  display: flex;
  flex-direction: column;
  height: 100svh;
  box-sizing: border-box;
  overflow: hidden;
`;

export const FlexScreen = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 20px 20px 30px 20px;
  box-sizing: border-box;
  justify-content: center;
`;

export const MessageShape = styled.div`
  position: relative;
  width: 100%;
  margin: 0px auto;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  border-radius: 16px;
  padding: 0 20px;
  background-color: #fafafa;
  border: 3px solid white;
`;

export const MessagesContainer = styled.div`
  flex-grow: 1;
  flex-basis: 0;
  overflow-y: scroll;
  -ms-overflow-style: none;
`;

export const Content = styled.div`
  position: relative;
  width: 75%;
`;

export const Bubble = styled.div`
  position: relative;
  width: 100%;
  height: auto;
  margin-bottom: 24px;
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const SelectWrapper = styled.div`
  position: relative;
  display: inline-block;
  width: 100%;
  padding: 0 20px;

  select {
    appearance: none;
    width: 100%;
    padding: 12px;
    margin-top: 24px;
    border: none;
    border-radius: 10px;
    background-color: #e0e0e0;
    font-size: 12px;

    &:focus-visible {
      outline: none;
    }
  }
`;

export const BubbleTime = styled.div`
  position: relative;
  width: 20%;
`;
