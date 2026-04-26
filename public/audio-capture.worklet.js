class AudioCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      // Transfer one mono channel frame for realtime streaming.
      this.port.postMessage(input[0]);
    }
    return true;
  }
}

registerProcessor("audio-capture-processor", AudioCaptureProcessor);
