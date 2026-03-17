import { Property, Component, MeshComponent, Mesh, MeshIndexType, MeshAttribute } from '@wonderlandengine/api';

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
class AudioSpectrum3D extends Component {
    constructor() {
        super(...arguments);
        this._bars = [];
        this._currentHeights = new Float32Array(0);
        this._freqData = new Uint8Array(0);
        this._source = null;
        this._cubeMesh = null;
    }
    async start() {
        this._cubeMesh = this._buildUnitCube();
        this._spawnBars();
    }
    update(dt) {
        if (!this._source)
            return;
        const { analyser } = this._source;
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
            const pos = bar.getPositionLocal(new Array(3));
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
    onDestroy() {
        this._disconnectSource();
    }
    async connectMicrophone() {
        this._disconnectSource();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        const context = new AudioContext();
        const source = context.createMediaStreamSource(stream);
        const analyser = this._makeAnalyser(context);
        source.connect(analyser);
        this._source = { context, analyser, micStream: stream };
    }
    connectAudioElement(el) {
        this._disconnectSource();
        const context = new AudioContext();
        const source = context.createMediaElementSource(el);
        const analyser = this._makeAnalyser(context);
        source.connect(analyser);
        analyser.connect(context.destination);
        this._source = { context, analyser };
    }
    _makeAnalyser(context) {
        const analyser = context.createAnalyser();
        analyser.fftSize = this.fftSize;
        analyser.smoothingTimeConstant = 0.7;
        this._freqData = new Uint8Array(analyser.frequencyBinCount);
        return analyser;
    }
    _disconnectSource() {
        if (!this._source)
            return;
        this._source.micStream?.getTracks().forEach(t => t.stop());
        this._source.context.close().catch(() => { });
        this._source = null;
    }
    _spawnBars() {
        const totalWidth = this.barCount * this.barWidth + (this.barCount - 1) * this.barSpacing;
        const startX = -totalWidth / 2 + this.barWidth / 2;
        this._currentHeights = new Float32Array(this.barCount);
        for (let i = 0; i < this.barCount; i++) {
            const bar = this.engine.scene.addObject(this.object);
            const mesh = bar.addComponent(MeshComponent);
            mesh.mesh = this._cubeMesh;
            if (this.barMaterial)
                mesh.material = this.barMaterial;
            const x = startX + i * (this.barWidth + this.barSpacing);
            bar.setPositionLocal([x, 0.0005, 0]);
            bar.setScalingLocal([this.barWidth, 0.001, this.barWidth]);
            this._bars.push(bar);
        }
    }
    _buildUnitCube() {
        const engine = this.engine;
        const positions = new Float32Array([
            -0.5, -0.5, 0.5,
            0.5, -0.5, 0.5,
            0.5, 0.5, 0.5,
            -0.5, 0.5, 0.5,
            -0.5, -0.5, -0.5,
            0.5, -0.5, -0.5,
            0.5, 0.5, -0.5,
            -0.5, 0.5, -0.5,
        ]);
        const indices = new Uint16Array([
            0, 1, 2, 2, 3, 0,
            1, 5, 6, 6, 2, 1,
            5, 4, 7, 7, 6, 5,
            4, 0, 3, 3, 7, 4,
            3, 2, 6, 6, 7, 3,
            4, 5, 1, 1, 0, 4,
        ]);
        const mesh = new Mesh(engine, {
            indexData: indices,
            indexType: MeshIndexType.UnsignedShort,
            vertexCount: 8,
        });
        const posAttr = mesh.attribute(MeshAttribute.Position);
        for (let v = 0; v < 8; v++) {
            posAttr.set(v, [positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]]);
        }
        return mesh;
    }
    _hsvToRgb(h, s, v) {
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
AudioSpectrum3D.TypeName = 'audio-spectrum-3d';
AudioSpectrum3D.Properties = {
    barCount: Property.int(64),
    barWidth: Property.float(0.08),
    barSpacing: Property.float(0.04),
    maxBarHeight: Property.float(4.0),
    lerpSpeed: Property.float(12.0),
    barMaterial: Property.material(),
    fftSize: Property.int(1024),
};

/**
 * AudioInputUI
 *
 * Injects a minimal HTML overlay into the page that lets the user:
 *   - Grant microphone access and start live visualisation
 *   - Pick a local audio file (MP3, WAV, OGG, FLAC) for playback
 */
class AudioInputUI extends Component {
    constructor() {
        super(...arguments);
        this._audioEl = null;
        this._uiRoot = null;
    }
    start() {
        this._buildUI();
    }
    onDestroy() {
        this._uiRoot?.remove();
        this._audioEl?.remove();
    }
    _buildUI() {
        const style = document.createElement('style');
        style.textContent = `
            #wle-audio-ui {
                position: fixed;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 12px;
                align-items: center;
                z-index: 9999;
                font-family: system-ui, sans-serif;
            }
            #wle-audio-ui button, #wle-audio-ui label {
                padding: 10px 20px;
                border-radius: 8px;
                border: none;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                color: #fff;
                transition: background 0.2s;
            }
            #wle-audio-mic-btn  { background: #e74c3c; }
            #wle-audio-mic-btn:hover  { background: #c0392b; }
            #wle-audio-file-label { background: #2980b9; }
            #wle-audio-file-label:hover { background: #1a6a9a; }
            #wle-audio-stop-btn { background: #555; display: none; }
            #wle-audio-stop-btn:hover { background: #333; }
            #wle-audio-filename {
                color: #fff;
                font-size: 13px;
                text-shadow: 0 1px 3px rgba(0,0,0,0.8);
                max-width: 200px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        `;
        document.head.appendChild(style);
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'audio/*';
        fileInput.style.display = 'none';
        fileInput.id = 'wle-audio-file-input';
        document.body.appendChild(fileInput);
        this._audioEl = document.createElement('audio');
        this._audioEl.style.display = 'none';
        this._audioEl.crossOrigin = 'anonymous';
        document.body.appendChild(this._audioEl);
        this._uiRoot = document.createElement('div');
        this._uiRoot.id = 'wle-audio-ui';
        const micBtn = document.createElement('button');
        micBtn.id = 'wle-audio-mic-btn';
        micBtn.textContent = '🎤 Microphone';
        const fileLabel = document.createElement('label');
        fileLabel.id = 'wle-audio-file-label';
        fileLabel.htmlFor = 'wle-audio-file-input';
        fileLabel.textContent = '🎵 Load Audio';
        const stopBtn = document.createElement('button');
        stopBtn.id = 'wle-audio-stop-btn';
        stopBtn.textContent = '⏹ Stop';
        const fileName = document.createElement('span');
        fileName.id = 'wle-audio-filename';
        this._uiRoot.appendChild(micBtn);
        this._uiRoot.appendChild(fileLabel);
        this._uiRoot.appendChild(stopBtn);
        this._uiRoot.appendChild(fileName);
        document.body.appendChild(this._uiRoot);
        micBtn.addEventListener('click', async () => {
            const vis = this._getVisualiser();
            if (!vis)
                return;
            stopBtn.style.display = 'inline-block';
            fileName.textContent = 'Live microphone';
            await vis.connectMicrophone();
        });
        fileInput.addEventListener('change', () => {
            const file = fileInput.files?.[0];
            if (!file || !this._audioEl)
                return;
            const url = URL.createObjectURL(file);
            this._audioEl.src = url;
            this._audioEl.loop = false;
            const vis = this._getVisualiser();
            if (vis) {
                vis.connectAudioElement(this._audioEl);
                this._audioEl.play().catch(console.error);
                stopBtn.style.display = 'inline-block';
                fileName.textContent = file.name;
            }
        });
        stopBtn.addEventListener('click', () => {
            this._audioEl?.pause();
            stopBtn.style.display = 'none';
            fileName.textContent = '';
        });
    }
    _getVisualiser() {
        if (!this.visualiserObject)
            return null;
        return this.visualiserObject.getComponent(AudioSpectrum3D);
    }
}
AudioInputUI.TypeName = 'audio-input-ui';
AudioInputUI.Properties = {
    visualiserObject: Property.object(),
};

export { AudioInputUI, AudioSpectrum3D };
//# sourceMappingURL=bundle.js.map
