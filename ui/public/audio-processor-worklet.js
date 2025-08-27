const MIN_INT16 = -0x8000;
const MAX_INT16 = 0x7fff;

class PCMAudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
    }

    process(inputs, outputs, parameters) {
        const inputChannels = inputs[0];
        if (!inputChannels || inputChannels.length === 0) {
            return true;
        }
        let monoFloat32Data;
        if (inputChannels.length === 1) {
            monoFloat32Data = inputChannels[0];
        } else {
            const channelCount = inputChannels.length;
            const length = inputChannels[0].length;
            monoFloat32Data = new Float32Array(length);

            for (let c = 0; c < channelCount; c++) {
                const channelData = inputChannels[c];
                for (let i = 0; i < length; i++) {
                    monoFloat32Data[i] += channelData[i];
                }
            }
            for (let i = 0; i < length; i++) {
                monoFloat32Data[i] /= channelCount;
            }
        }

        const int16Buffer = this.float32ToInt16(monoFloat32Data);

        this.port.postMessage(new Int16Array(int16Buffer));

        return true;
    }

    float32ToInt16(float32Array) {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            let val = Math.round(float32Array[i] * MAX_INT16);
            val = Math.max(MIN_INT16, Math.min(MAX_INT16, val));
            int16Array[i] = val;
        }
        return int16Array;
    }
}

registerProcessor("audio-processor-worklet", PCMAudioProcessor);
