import { Component, Object3D } from '@wonderlandengine/api';
/**
 * AudioInputUI
 *
 * Injects a minimal HTML overlay into the page that lets the user:
 *   - Grant microphone access and start live visualisation
 *   - Pick a local audio file (MP3, WAV, OGG, FLAC) for playback
 */
export declare class AudioInputUI extends Component {
    static TypeName: string;
    static Properties: {
        visualiserObject: import("@wonderlandengine/api").ComponentProperty;
    };
    visualiserObject: Object3D | null;
    private _audioEl;
    private _uiRoot;
    start(): void;
    onDestroy(): void;
    private _buildUI;
    private _getVisualiser;
}
