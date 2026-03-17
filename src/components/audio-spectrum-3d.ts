import {
    Component,
    MeshComponent,
    Object3D,
    Property,
    WonderlandEngine,
    Mesh,
    MeshIndexType,
    MeshAttribute,
} from '@wonderlandengine/api';

interface ActiveSource {
    context: AudioContext;
    analyser: AnalyserNode;
    micStream?: MediaStream;
}

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
export class AudioSpectrum3D extends Component {
    static TypeName = 'audio-spectrum-3d';

    static Properties = {
        barCount:     Property.int(64),
        barWidth:     Property.float(0.08),
        barSpacing:   Property.float(0.04),
        maxBarHeight: Property.float(4.0),
        lerpSpeed:    Property.float(12.0),
        barMaterial:  Property.material(),
        fftSize:      Property.int(1024),
    };

    barCount!: number;
    barWidth!: number;
    barSpacing!: number;
    maxBarHeight!: number;
    lerpSpeed!: number;
    barMaterial!: any;
    fftSize!: number;

    private _bars: Object3D[] = [];
    private _currentHeights: Float32Array = new Float32Array(0);
    private _freqData: Uint8Array = new Uint8Array(0);
    private _source: ActiveSource | null = null;
    private _cubeMesh: Mesh | null = null;

    async start(): Promise<void> {
        this._cubeMesh = this._buildUnitCube();
        this._spawnBars();
    }

    update(dt: number): void {
        if (!this._source) return;
        const {analyser} = this._source;
        analyser.getByteFrequencyData(this._freqData);

        const lerp = Math.min(1, this.lerpSpeed * dt);
        const barBins = Math.floor(this._freqData.length / 2);

        for (let i = 0; i < this._bars.length; i++) {
            const binIndex = Math.floor((i / this._bars.length) * barBins);
            const target = (this._freqData[binIndex] / 255) * this.maxBarHeight;
            this._currentHeights[i] += (target - this._currentHeights[i]) * lerp;

            const h = Math.max(0.001, this._currentHeights[i]);
            const bar = this._bars[i];

            bar.setScalingLocal([this.barWidth, h, this.barWidth]);

            const pos = bar.getPositionLocal(new Array(3) as [number, number, number]);
            pos[1] = h / 2;
            bar.setPositionLocal(pos);

            if (this.barMaterial && 'diffuseColor' in this.barMaterial) {
                const hue = i / this._bars.length;
                const brightness = 0.4 + 0.6 * (this._freqData[binIndex] / 255);
                const [r, g, b] = this._hsvToRgb(hue * 0.66, 1, brightness);
                this.barMaterial.diffuseColor = [r, g, b, 1];
            }
        }
    }

    onDestroy(): void {
        this._disconnectSource();
    }

    async connectMicrophone(): Promise<void> {
        this._disconnectSource();
        const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: false});
        const context = new AudioContext();
        const source = context.createMediaStreamSource(stream);
        const analyser = this._makeAnalyser(context);
        source.connect(analyser);
        this._source = {context, analyser, micStream: stream};
    }

    connectAudioElement(el: HTMLMediaElement): void {
        this._disconnectSource();
        const context = new AudioContext();
        const source = context.createMediaElementSource(el);
        const analyser = this._makeAnalyser(context);
        source.connect(analyser);
        analyser.connect(context.destination);
        this._source = {context, analyser};
    }

    private _makeAnalyser(context: AudioContext): AnalyserNode {
        const analyser = context.createAnalyser();
        analyser.fftSize = this.fftSize;
        analyser.smoothingTimeConstant = 0.7;
        this._freqData = new Uint8Array(analyser.frequencyBinCount);
        return analyser;
    }

    private _disconnectSource(): void {
        if (!this._source) return;
        this._source.micStream?.getTracks().forEach(t => t.stop());
        this._source.context.close().catch(() => {});
        this._source = null;
    }

    private _spawnBars(): void {
        const totalWidth = this.barCount * this.barWidth + (this.barCount - 1) * this.barSpacing;
        const startX = -totalWidth / 2 + this.barWidth / 2;
        this._currentHeights = new Float32Array(this.barCount);

        for (let i = 0; i < this.barCount; i++) {
            const bar = (this.engine as WonderlandEngine).scene.addObject(this.object);
            const mesh = bar.addComponent(MeshComponent)!;
            mesh.mesh = this._cubeMesh!;
            if (this.barMaterial) mesh.material = this.barMaterial;

            const x = startX + i * (this.barWidth + this.barSpacing);
            bar.setPositionLocal([x, 0.0005, 0]);
            bar.setScalingLocal([this.barWidth, 0.001, this.barWidth]);
            this._bars.push(bar);
        }
    }

    private _buildUnitCube(): Mesh {
        const engine = this.engine as WonderlandEngine;

        const positions = new Float32Array([
            -0.5, -0.5,  0.5,
             0.5, -0.5,  0.5,
             0.5,  0.5,  0.5,
            -0.5,  0.5,  0.5,
            -0.5, -0.5, -0.5,
             0.5, -0.5, -0.5,
             0.5,  0.5, -0.5,
            -0.5,  0.5, -0.5,
        ]);

        const indices = new Uint16Array([
            0,1,2, 2,3,0,
            1,5,6, 6,2,1,
            5,4,7, 7,6,5,
            4,0,3, 3,7,4,
            3,2,6, 6,7,3,
            4,5,1, 1,0,4,
        ]);

        const mesh = new Mesh(engine, {
            indexData: indices,
            indexType: MeshIndexType.UnsignedShort,
            vertexCount: 8,
        });

        const posAttr = mesh.attribute(MeshAttribute.Position)!;
        for (let v = 0; v < 8; v++) {
            posAttr.set(v, [positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]]);
        }

        return mesh;
    }

    private _hsvToRgb(h: number, s: number, v: number): [number, number, number] {
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: return [v, t, p];
            case 1: return [q, v, p];
            case 2: return [p, v, t];
            case 3: return [p, q, v];
            case 4: return [t, p, v];
            case 5: return [v, p, q];
        }
        return [0, 0, 0];
    }
}
