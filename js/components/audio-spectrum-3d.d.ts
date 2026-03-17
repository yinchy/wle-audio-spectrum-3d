import { Component } from '@wonderlandengine/api';
/**
 * AudioSpectrum3D
 *
 * Creates `barCount` box-shaped Object3Ds at startup and scales them every
 * frame according to the FFT magnitude data from a connected audio source.
 *
 * Wire up a source by calling:
 *   - connectMicrophone()         — live mic via getUserMedia
 *   - connectAudioElement(el)     — an <audio> or <video> DOM element
 */
export declare class AudioSpectrum3D extends Component {
    static TypeName: string;
    static Properties: {
        barCount: import("@wonderlandengine/api").ComponentProperty;
        barWidth: import("@wonderlandengine/api").ComponentProperty;
        barSpacing: import("@wonderlandengine/api").ComponentProperty;
        maxBarHeight: import("@wonderlandengine/api").ComponentProperty;
        lerpSpeed: import("@wonderlandengine/api").ComponentProperty;
        barMaterial: import("@wonderlandengine/api").ComponentProperty;
        fftSize: import("@wonderlandengine/api").ComponentProperty;
    };
    barCount: number;
    barWidth: number;
    barSpacing: number;
    maxBarHeight: number;
    lerpSpeed: number;
    barMaterial: any;
    fftSize: number;
    private _bars;
    private _currentHeights;
    private _freqData;
    private _source;
    private _cubeMesh;
    start(): Promise<void>;
    update(dt: number): void;
    onDestroy(): void;
    connectMicrophone(): Promise<void>;
    connectAudioElement(el: HTMLMediaElement): void;
    private _makeAnalyser;
    private _disconnectSource;
    private _spawnBars;
    private _buildUnitCube;
    private _hsvToRgb;
}
