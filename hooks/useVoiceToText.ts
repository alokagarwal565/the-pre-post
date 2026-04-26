import { useState, useRef, useCallback } from 'react';

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const MODEL_NAME = "gemini-3.1-flash-live-preview";
const WS_BASE = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";

export function useVoiceToText(
  onTranscriptUpdate: (text: string) => void,
  onTurnComplete: (text: string) => void
) {
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const socketRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const captureNodeRef = useRef<AudioWorkletNode | null>(null);
  const currentTurnTextRef = useRef("");

  const stop = useCallback(async () => {
    setIsLive(false);

    if (captureNodeRef.current) {
      captureNodeRef.current.disconnect();
      captureNodeRef.current.port.onmessage = null;
      captureNodeRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioCtxRef.current) {
      await audioCtxRef.current.close();
      audioCtxRef.current = null;
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
      socketRef.current.close(1000, "Client stop");
    }
    socketRef.current = null;
  }, []);

  // ... (downsampleTo16kHz, floatTo16BitPCM, base64FromBytes same as before)
  const downsampleTo16kHz = (input: Float32Array, inputSampleRate: number) => {
    if (inputSampleRate === 16000) return input;
    const sampleRateRatio = inputSampleRate / 16000;
    const newLength = Math.round(input.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      let accum = 0;
      let count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < input.length; i += 1) {
        accum += input[i];
        count += 1;
      }
      result[offsetResult] = count > 0 ? accum / count : 0;
      offsetResult += 1;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  };

  const floatTo16BitPCM = (float32Array: Float32Array) => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i += 1) {
      let sample = Math.max(-1, Math.min(1, float32Array[i]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(i * 2, sample, true);
    }
    return new Uint8Array(buffer);
  };

  const base64FromBytes = (bytes: Uint8Array) => {
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return btoa(binary);
  };

  const start = useCallback(async () => {
    if (!API_KEY) {
      setError("API key is missing");
      return;
    }

    setError(null);
    currentTurnTextRef.current = "";

    try {
      const url = `${WS_BASE}?key=${encodeURIComponent(API_KEY)}`;
      const socket = new WebSocket(url);
      socketRef.current = socket;

      await new Promise<void>((resolve, reject) => {
        socket.onopen = () => resolve();
        socket.onerror = () => reject(new Error("WebSocket connection failed"));
      });

      socket.onmessage = async (event) => {
        let msg;
        try {
          if (typeof event.data === 'string') {
            msg = JSON.parse(event.data);
          } else {
            msg = JSON.parse(await event.data.text());
          }
        } catch {
          return;
        }

        if (msg.setupComplete) {
          setIsLive(true);
        }

        if (msg.serverContent) {
          const sc = msg.serverContent;
          
          if (sc.inputTranscription?.text) {
            currentTurnTextRef.current = sc.inputTranscription.text;
            onTranscriptUpdate(sc.inputTranscription.text);
          }

          if (sc.turnComplete) {
            if (currentTurnTextRef.current) {
              onTurnComplete(currentTurnTextRef.current);
            }
            currentTurnTextRef.current = "";
            onTranscriptUpdate("");
          }
        }

        if (msg.error) {
          setError(msg.error.message || "Live API error");
          stop();
        }
      };

      const setupPayload = {
        model: `models/${MODEL_NAME}`,
        generationConfig: {
          responseModalities: ["AUDIO"],
        },
        inputAudioTranscription: {},
      };

      socket.send(JSON.stringify({ setup: setupPayload }));

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          noiseSuppression: true,
          echoCancellation: true,
        }
      });
      mediaStreamRef.current = mediaStream;

      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;
      const sourceNode = audioCtx.createMediaStreamSource(mediaStream);

      await audioCtx.audioWorklet.addModule("/audio-capture.worklet.js");

      const captureNode = new AudioWorkletNode(audioCtx, "audio-capture-processor");
      captureNodeRef.current = captureNode;

      captureNode.port.onmessage = (e) => {
        if (socket.readyState !== WebSocket.OPEN) return;
        
        const float32Chunk = new Float32Array(e.data);
        const downsampled = downsampleTo16kHz(float32Chunk, audioCtx.sampleRate);
        const pcmBytes = floatTo16BitPCM(downsampled);
        const b64 = base64FromBytes(pcmBytes);

        socket.send(JSON.stringify({
          realtimeInput: {
            audio: {
              data: b64,
              mimeType: "audio/pcm"
            }
          }
        }));
      };

      sourceNode.connect(captureNode);
    } catch (err: any) {
      setError(err.message || "Failed to start voice input");
      stop();
    }
  }, [onTranscriptUpdate, onTurnComplete, stop]);

  return {
    isLive,
    error,
    start,
    stop,
  };
}
