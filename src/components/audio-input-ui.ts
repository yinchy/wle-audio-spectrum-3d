import {Component, Property, Object3D} from '@wonderlandengine/api';
import {AudioSpectrum3D} from './audio-spectrum-3d.js';

/**
 * AudioInputUI
 *
 * Injects a minimal HTML overlay into the page that lets the user:
 *   - Grant microphone access and start live visualisation
 *   - Pick a local audio file (MP3, WAV, OGG, FLAC) for playback
 */
export class AudioInputUI extends Component {
    static TypeName = 'audio-input-ui';

    static Properties = {
        visualiserObject: Property.object(),
    };

    visualiserObject!: Object3D | null;

    private _audioEl: HTMLAudioElement | null = null;
    private _uiRoot: HTMLDivElement | null = null;

    start(): void {
        this._buildUI();
    }

    onDestroy(): void {
        this._uiRoot?.remove();
        this._audioEl?.remove();
    }

    private _buildUI(): void {
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
            if (!vis) return;
            try {
                stopBtn.style.display = 'inline-block';
                fileName.textContent = 'Live microphone';
                await vis.connectMicrophone();
            } catch (err) {
                stopBtn.style.display = 'none';
                fileName.textContent = `Mic error: ${(err as any)?.message ?? String(err)}`;
            }
        });

        fileInput.addEventListener('change', () => {
            const file = fileInput.files?.[0];
            if (!file || !this._audioEl) return;

            const url = URL.createObjectURL(file);
            this._audioEl.src = url;
            this._audioEl.loop = false;

            const vis = this._getVisualiser();
            if (vis) {
                vis.connectAudioElement(this._audioEl!);
                this._audioEl!.play().catch(console.error);
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

    private _getVisualiser(): AudioSpectrum3D | null {
        if (!this.visualiserObject) return null;
        return this.visualiserObject.getComponent(AudioSpectrum3D) as AudioSpectrum3D | null;
    }
}