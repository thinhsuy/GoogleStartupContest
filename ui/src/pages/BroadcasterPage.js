import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { FaChevronLeft } from "react-icons/fa";
import { ToastContainer } from "react-toastify";
import { IoMicOutline } from "react-icons/io5";
import { PiWaveform } from "react-icons/pi";
import { Tooltip } from "react-tooltip";
import {
    CustomToolTip,
    StartFloatingButton,
    StopFloatingButton,
} from './RecordButton.js';
import {
    PhoneShape, 
    FlexScreen,
    MessageShape,
    MessagesContainer,
    Content,
    Bubble,
    BubbleTime,
    SelectWrapper
} from './../components/BroadcastScreen.js';
import useAudioRecorder from "../hooks/useAudioRecorder.tsx";
import { useAppWebSocket } from "../hooks/useWebsocket.jsx";
import AudioWave from "./../components/AudioWave.tsx";
import { SAMPLE_RATE } from "../config/variables.js";

function presentMessage(data, language, lastMessageRef) {
  return data.map((value, index) => {
    const isLastMessage = index === data.length - 1;
    return (
      <div
        key={value.broadcast_id}
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          overflowX: "hidden",
        }}
      >
        <Bubble
          key={index}
          style={{ color: value.isDone ? "#3C76F1" : "black" }}
          ref={isLastMessage ? lastMessageRef : null}
        >
          <Content>
            {value.translated ? value.translated[language] : value.content}
          </Content>
          <BubbleTime>{value.created_at}</BubbleTime>
        </Bubble>
      </div>
    );
  });
}

const BroadcasterPage = () => {
    const [userId, setUserId] = useState("6188f770-a1c1-426a-b15b-471ed7be18c7");
    const [sessionId, setSessionId] = useState("GOOGLE-CONTEST");
    const [selectedLanguage, setselectedLanguage] = useState({ key: "vi", code: "vi-VN" });
    const [outputLanguages, setOutputLanguages] = useState(["en", "ko", "ja"]);
    const [data, setData] = useState([
        {
            broadcast_id: "123",
            isDone: true,
            created_at: "10:00",
            content: "Okay, let's get this code working with conversation history! You're on the right track by having the self.history attribute, but we need to make sure it's being used correctly with the start_chat method."
        }
    ]);
    const [isRecognizing, setIsRecognizing] = useState(false);
    const [devices, setDevices] = useState([]);
    const [isRecordAvailable, setIsRecordAvailable] = useState(true);
    const lastMessageRef = useRef(null);
    const [showChatScreen, setShowChatScreen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [voiceFilterResponse, setVoiceFilterResponse] = useState(null);

    const sendUserAudio = (base64str) => {
        // if (isConnected) {
        // sendMessage(
        //     JSON.stringify({
        //     type: "voice.classification.filter",
        //     audio_str: base64str,
        //     }),
        // );
        sendMessage(
            JSON.stringify(
                {
                    "type": "voice.translation.buffer.append",
                    "audio_str": base64str,
                    "sample_rate": SAMPLE_RATE
                }
            )
        )
        // }
    };

    const { start: startAudioRecording, stop: stopAudioRecording } = useAudioRecorder(
        { onAudioRecorded: sendUserAudio }
    );

    useEffect(() => {
        if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
        }
    }, [data]);

    useEffect(() => {
        if (!showChatScreen && lastMessageRef.current && data.length) {
        lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [showChatScreen, data.length]);


    const startRecognition = async () => {
        startAudioRecording();
        setIsRecognizing(true);
        sendMessage(
            JSON.stringify({
                type: "voice.translation.buffer.start"
            })
        );
    };

    const stopRecognition = async () => {
        setIsRecognizing(false);
        await stopAudioRecording();
        sendMessage(
            JSON.stringify({
                type: "voice.translation.buffer.stop"
            })
        );
    };

    const { sendMessage, isConnecting, isConnected, reconnect } = useAppWebSocket(
        "ws://localhost:8080/ws/v1/translate/",
        selectedLanguage?.key,
        sessionId,
        {
        onMessage: async (event) => {
            const message = event.data;
            try {
                const object = JSON.parse(message);
                setMessages((prevMessages) => [...prevMessages, object]);
                console.log(object);
                if (object.type === "voice.classification.filter.response") {
                    setVoiceFilterResponse(object);
                }

                if (
                    object.type === "broadcast-translating" ||
                    object.type === "broadcast-translated" ||
                    object.type === "broadcast-revised"
                ) {
                    setData((prevData) => {
                        const exists = prevData.some(
                        (broadcast) => broadcast.broadcast_id === object.broadcast_id,
                        );

                        if (!exists) {
                        return [...prevData, object];
                        } else {
                        return prevData.map((broadcast) =>
                            broadcast.broadcast_id === object.broadcast_id
                            ? { ...broadcast, translated: object.translated } // Update existing object
                            : broadcast,
                        );
                        }
                    });
                }
                if (object.type === "broadcast-audio-noti") {
                    setData((prevData) =>
                        prevData.map((broadcast) =>
                        broadcast.id === object.broadcast_id
                            ? { ...broadcast, isDone: true }
                            : broadcast,
                        ),
                    );
                }
            } catch (err) {
                console.error("Error compressed file:", err);
            }
        },
        onOpen: () => {
            sendMessage(
                JSON.stringify({
                    type: "voice.classification.register",
                    user_id: userId,
                    threshold: 0.2
                })
            )
            sendMessage(
                JSON.stringify({
                    type: "voice.translation.session.update",
                    session_id: sessionId,
                    user_id: userId,
                    input_language: selectedLanguage.code,
                    output_languages: outputLanguages,
                    silence_timeout: 500

                })
            )
        },
        onClose: () => { },
        onError: (error) => console.error("WebSocket error:", error),
        maxRetries: 100,
        minUptime: 1000,
        },
    );

    return (
        <>
            {/* <ConnectingOverlay isConnecting={isConnecting} /> */}
            <div
                style={{
                    display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
            padding: "20px 0",
            height: "100svh",
            }}
        >
            <PhoneShape>
            {/* Show time remaining */}
            <div
                style={{
                marginTop: 15,
                marginBottom: -5,
                display: "flex",
                padding: "0 5px",
                flexDirection: "row",
                width: "100%",
                justifyContent: "center",
                alignItems: "center",
                }}
            >
                <div style={{ width: 15 }}></div>
            </div>


            {/* Other UI components */}
            <div
                style={{
                marginTop: 15,
                marginBottom: 24,
                display: "flex",
                padding: "0 20px",
                flexDirection: "row",
                width: "100%",
                justifyContent: "space-between",
                alignItems: "center",
                }}
            >
                <div onClick={() => {}} style={{ width: 30 }}>
                    <FaChevronLeft color="black" size={18} />
                </div>
                <div style={{ width: 30 }}></div>
            </div>

            <div
                style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0 20px",
                marginBottom: "12px",
                }}
            >
                <h2
                style={{
                    width: "100%",
                    maxHeight: "30px",
                    fontWeight: 700,
                    fontSize: "24px",
                    height: "auto",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    textAlign: "left",
                    margin: "0 auto",
                    color: "#000000",
                }}
                >
                    This is MVP for Google Contest
                </h2>
            </div>
            
            <div
                style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                padding: "0 20px",
                }}
            >
                <ToastContainer />
                {data.length ? (
                    <MessageShape>
                        <div
                        style={{
                            color: "black",
                            paddingTop: 14,
                            paddingBottom: 14,
                            fontSize: 16,
                            fontWeight: 600,
                        }}
                        >
                            Realtime Transcript
                        </div>
                        <MessagesContainer>
                        <div>
                            {data.length > 0
                            ? presentMessage(data, selectedLanguage.key, lastMessageRef)
                            : ""}
                        </div>
                        </MessagesContainer>
                    </MessageShape>
                ) : (
                <div
                    style={{
                    flex: 1,
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    }}
                >
                    Welcome speaker, let say something
                </div>
                )}
                <SelectWrapper>
                <div style={{
                    width: "100%",
                    height: "40px",
                }}>
                    {voiceFilterResponse && isRecognizing ? (
                        <AudioWave isSpeaker={voiceFilterResponse.is_speaker[0]} bars={15} />
                    ) : null}

                </div>
                <Tooltip
                    id="speech-classification"
                    placement="bottom"
                    style={{
                    zIndex: 999999999,
                    opacity: 1,
                    backgroundColor: "rgb(0, 0, 0)",
                    }}
                >
                    <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        whiteSpace: "nowrap",
                        textWrap: "pretty",
                        maxWidth: "300px",
                        height: "fit-content",
                    }}
                    >
                    <p>empty</p>
                    </div>
                </Tooltip>
                </SelectWrapper>
                <FlexScreen>
                <div
                    style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    }}
                >
                    {!isRecognizing && (
                        <CustomToolTip
                            className="customTooltip"
                            style={{
                            position: "relative",
                            backgroundColor: "#D9D9D9",
                            color: "#000000",
                            padding: "4px 16px",
                            borderRadius: "16px",
                            textAlign: "center",
                            width: "fit-content",
                            margin: "0 auto",
                            marginBottom: 20,
                            fontSize: 10,
                            }}
                        >
                            Tap to Speak
                            <div
                            style={{
                                position: "absolute",
                                bottom: "-10px",
                                left: "50%",
                                transform: "translateX(-50%)",
                                width: "0",
                                height: "0",
                                borderLeft: "10px solid transparent",
                                borderRight: "10px solid transparent",
                                borderTop: "10px solid #D9D9D9",
                            }}
                            />
                        </CustomToolTip>
                    )}
                    {!isRecognizing ? (
                        <StartFloatingButton
                            disabled={!isRecordAvailable}
                            onClick={startRecognition}
                        >
                            <IoMicOutline fontSize={30} style={{ position: "absolute" }} />
                        </StartFloatingButton>
                        ) : (
                        <StopFloatingButton
                            disabled={!isRecordAvailable}
                            onClick={stopRecognition}
                            style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
                        >
                            <IoMicOutline fontSize={30} style={{ position: "absolute" }} />
                        </StopFloatingButton>
                    )}
                </div>
                </FlexScreen>
            </div>
            </PhoneShape>
        </div>
        </>
    );
}

export default BroadcasterPage;