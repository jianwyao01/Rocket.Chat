import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';
import type { MPMask } from '@mediapipe/tasks-vision';
import type { Track, TrackProcessor, VideoProcessorOptions } from 'livekit-client';

import { BackgroundBlurRenderer } from './backgroundBlurRenderer';
import { supportsBackgroundBlur } from './backgroundBlurSupport';

/**
 * The two MediaPipe segmenters worth using here, and which one we use.
 *
 * `input` is the size the model itself works at. It matters because we hand the segmenter a frame scaled to exactly
 * that — see the note in `render` — so the mask comes back at this size rather than the camera's, and the difference
 * is the difference between blur costing 20ms a frame and 94ms.
 *
 * - **multiclass** names six things (background, hair, body-skin, face-skin, clothes, others) at 256×256. It holds an
 *   edge around hair far better than the two-class model, which is what makes it worth the other two costs: it is
 *   **15.6 MB** against 244 KB, and roughly twice the work per frame.
 * - **selfie** is one class at 256×144 — the landscape shape a call actually is, cheap, and blunter around hair.
 *
 * Both are served from `public/mediapipe/`, alongside the WASM runtime, so airgapped workspaces work out of the box.
 */
export const SEGMENTER_MODELS = {
	multiclass: {
		url: '/mediapipe/selfie_multiclass_256x256.tflite',
		input: { width: 256, height: 256 },
	},
	selfie: {
		url: '/mediapipe/selfie_segmenter_landscape.tflite',
		input: { width: 256, height: 144 },
	},
} as const;

/** The one in use. One line to change, and everything below reads the model rather than assuming anything about it. */
export const SEGMENTER = SEGMENTER_MODELS.multiclass;

/**
 * MediaPipe's WASM, which has to match the version of `@mediapipe/tasks-vision` this app depends on — it is the
 * runtime for the JS in the package, not an independent thing. Keep the two in step when the package moves.
 *
 * Served from `public/mediapipe/wasm/`, copied from the npm package at build time. When `@mediapipe/tasks-vision`
 * is updated, re-copy the wasm directory contents.
 */
export const SEGMENTER_WASM = '/mediapipe/wasm';

/**
 * Which confidence mask describes the person, and whether it has to be read inside out.
 *
 * The multiclass model reports `background` and five parts of a person, so `1 - background` is the complete person.
 * The landscape model reports `selfie` directly. Reading this from the model labels keeps both models interchangeable.
 *
 * Confidence rather than category masks matters at the boundary: 60% confidence around a strand of hair becomes 60%
 * opacity instead of a hard verdict which no amount of later feathering can reconstruct.
 */
export const personConfidence = (labels: string[]): { index: number; invert: boolean } => {
	const background = labels.indexOf('background');
	return background < 0 ? { index: 0, invert: false } : { index: background, invert: true };
};

/**
 * Converts model confidence to an alpha matte and damps small frame-to-frame changes without trailing real motion.
 * Large changes are accepted immediately; only low-amplitude uncertainty, which appears as edge flicker, is averaged.
 */
export const stabilizeConfidenceMask = (values: Float32Array, previous: Uint8Array | undefined, invert: boolean): Uint8Array => {
	const next = new Uint8Array(values.length);

	for (let index = 0; index < values.length; index++) {
		const rawConfidence = Math.max(0, Math.min(1, invert ? 1 - values[index] : values[index]));
		// A semantic model assigns a little non-background probability to hard room details such as lettering, plants
		// and chair edges. Using that raw value as opacity mixes a faint sharp frame over the blur everywhere, which
		// reads as a halo. Suppress weak classifications while retaining a continuous midpoint for hair and soft edges.
		const normalized = Math.max(0, Math.min(1, (rawConfidence - 0.2) / 0.6));
		const confidence = normalized * normalized * (3 - 2 * normalized);
		const current = Math.round(confidence * 255);
		if (previous?.length !== values.length) {
			next[index] = current;
			continue;
		}

		const old = previous[index];
		const difference = Math.abs(current - old);
		let response = 0.35;
		if (difference >= 96) {
			response = 1;
		} else if (difference >= 32) {
			response = 0.75;
		}
		next[index] = Math.round(old + (current - old) * response);
	}

	return next;
};

/** Prefer the replacement track's dimensions because a reused video element can still report the previous frame size. */
export const videoDimensions = (
	settings: Pick<MediaTrackSettings, 'width' | 'height'>,
	source: Pick<HTMLVideoElement, 'videoWidth' | 'videoHeight'>,
): { width: number; height: number } | undefined => {
	if (settings.width && settings.height) {
		return { width: settings.width, height: settings.height };
	}
	if (source.videoWidth && source.videoHeight) {
		return { width: source.videoWidth, height: source.videoHeight };
	}
	return undefined;
};

/** Prefer deterministic manual capture, with automatic capture as the compatibility fallback. */
export const captureCanvasTrack = (canvas: Pick<HTMLCanvasElement, 'captureStream'>): MediaStreamTrack | undefined => {
	const manual = canvas.captureStream(0).getVideoTracks()[0];
	const capture = manual as unknown as { requestFrame?: () => void } | undefined;
	if (capture?.requestFrame) {
		return manual;
	}

	// A zero-frame-rate track without requestFrame could never publish anything.
	manual?.stop();
	return canvas.captureStream().getVideoTracks()[0];
};

/** Canvas capture tracks are not portable across backing-store resizes in Chromium; recapture at the new size. */
export const refreshCapturedTrack = (
	canvas: Pick<HTMLCanvasElement, 'captureStream'>,
	current: MediaStreamTrack | undefined,
	resolutionChanged: boolean,
): MediaStreamTrack | undefined => {
	if (!resolutionChanged) {
		return current;
	}

	current?.stop();
	return captureCanvasTrack(canvas);
};

/** Canvas capture is manual so every completed WebGL render becomes exactly one outgoing video frame. */
export const requestCapturedFrame = (track: MediaStreamTrack | undefined): void => {
	const capture = track as unknown as { requestFrame?: () => void } | undefined;
	capture?.requestFrame?.();
};

/**
 * How often the mask is worked out again, in milliseconds.
 *
 * Not every frame. A segmentation is the expensive part of this by an order of magnitude — about 20ms of the 22ms a
 * blurred 1080p frame costs with the multiclass model — and it is the one part that does not have to happen at the
 * frame rate: between segmentations the last mask is reused, which is invisible on a talking head and shows only as
 * a soft edge trailing a fast wave. 20Hz halves the cost of the heavy model and leaves the cheap one untouched.
 *
 * `0` segments every frame.
 */
const SEGMENT_INTERVAL = 50;

/**
 * Blurs the background of a camera track, and nothing else.
 *
 * MediaPipe provides a low-resolution confidence matte and {@link BackgroundBlurRenderer} refines and composites it
 * on WebGL2. The renderer keeps the important stages on GPU: a joint bilateral upsample aligns the matte with camera
 * edges, a weighted separable blur excludes foreground colours, and the final blend happens at full frame size.
 *
 * This differs from both earlier implementations:
 *
 * - a binary category mask threw away partial coverage around hair before compositing began;
 * - blurring the complete frame let the person's colours bleed outwards into a halo;
 * - enlarging the blurred source to hide its canvas border moved the background relative to the sharp subject.
 *
 * Strength is a fraction of frame height — what has to look the same across resolutions is the blur *relative to
 * the picture*, since the same track is watched at whatever size the other end's tile happens to be. It can be
 * changed at any time with {@link setStrength} — the next frame uses it, so moving between levels costs nothing and
 * never re-publishes.
 *
 * Strength `0` is pass-through: frames keep flowing, untouched, and the segmenter is left alone. That is what
 * "no blur" does while the processor stays attached, since detaching a processor re-publishes the camera.
 */
export class BackgroundBlurProcessor implements TrackProcessor<Track.Kind.Video, VideoProcessorOptions> {
	/** Bump when an existing development-session processor must be reconstructed rather than updated in place. */
	static readonly revision = 6;

	readonly name = 'rocket-chat-background-blur';

	readonly revision = BackgroundBlurProcessor.revision;

	processedTrack?: MediaStreamTrack;

	private strength: number;

	private segmenter?: ImageSegmenter;

	private source?: HTMLVideoElement;

	private ownsSource = false;

	private canvas?: HTMLCanvasElement;

	private renderer?: BackgroundBlurRenderer;

	/** Which confidence mask is the person. See {@link personConfidence}. */
	private person = { index: 0, invert: false };

	/** Last matte at model resolution, used only to remove low-amplitude temporal flicker. */
	private temporalMask?: Uint8Array;

	/** The frame, scaled to what the model works at — what actually gets segmented. */
	private small?: { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D };

	private lastSegment = 0;

	private segmenting = false;

	private lastTimestamp = 0;

	private frameRequest?: number;

	private timer?: ReturnType<typeof setTimeout>;

	private stopped = false;

	constructor(strength = 0) {
		this.strength = strength;
	}

	/** Whether this browser can do it. The asking is in {@link supportsBackgroundBlur}, which a menu can call cheaply. */
	static get isSupported(): boolean {
		return supportsBackgroundBlur();
	}

	async init(options: VideoProcessorOptions): Promise<void> {
		this.stopped = false;

		this.source = options.element instanceof HTMLVideoElement ? options.element : document.createElement('video');
		this.ownsSource = this.source !== options.element;
		this.source.muted = true;
		this.source.playsInline = true;
		this.source.autoplay = true;
		this.source.srcObject = new MediaStream([options.track]);
		await this.source.play().catch(() => undefined);

		const { width, height } = await this.dimensions(options.track);

		// The canvas has to be in the document for its captured stream to keep producing frames — an offscreen one
		// stalls in some browsers — but nobody should see it.
		this.canvas = document.createElement('canvas');
		this.canvas.style.display = 'none';
		document.body.appendChild(this.canvas);
		this.renderer = new BackgroundBlurRenderer(this.canvas);
		this.renderer.resize(width, height);

		// Manual capture avoids depending on Chromium's canvas-dirty heuristic. That heuristic can stop observing WebGL
		// updates after a backing-store resize, leaving lower-resolution previews stuck on their initial black frame.
		this.processedTrack = captureCanvasTrack(this.canvas);

		const small = document.createElement('canvas');
		small.width = SEGMENTER.input.width;
		small.height = SEGMENTER.input.height;
		const smallContext = small.getContext('2d');
		if (!smallContext) {
			throw new Error('background blur needs a 2D canvas');
		}
		this.small = { canvas: small, context: smallContext };

		const files = await FilesetResolver.forVisionTasks(SEGMENTER_WASM);
		this.segmenter = await ImageSegmenter.createFromOptions(files, {
			baseOptions: { modelAssetPath: SEGMENTER.url, delegate: 'GPU' },
			runningMode: 'VIDEO',
			outputCategoryMask: false,
			outputConfidenceMasks: true,
		});

		this.person = personConfidence(this.segmenter.getLabels());

		this.schedule();
	}

	/**
	 * Follows the track being replaced — a camera swap, or a new resolution.
	 *
	 * The canvas, its captured stream and the loaded segmenter all survive, so what the room is publishing does not
	 * change and nothing has to be renegotiated. Only where the frames come from does.
	 */
	async restart(options: VideoProcessorOptions): Promise<void> {
		this.unschedule();

		if (!this.source || !this.canvas) {
			return this.init(options);
		}

		this.source.srcObject = new MediaStream([options.track]);
		await this.source.play().catch(() => undefined);

		const { width, height } = await this.dimensions(options.track);
		const resolutionChanged = this.canvas.width !== width || this.canvas.height !== height;
		this.resize(width, height);
		if (resolutionChanged) {
			// Chromium can leave a canvas capture track black after its backing store changes size. LiveKit reads
			// processedTrack after restart() returns, so hand it a fresh capture at the new dimensions for sender and preview.
			this.processedTrack = refreshCapturedTrack(this.canvas, this.processedTrack, true);
			this.temporalMask = undefined;
			this.lastSegment = 0;
		}

		this.stopped = false;
		this.schedule();
	}

	async destroy(): Promise<void> {
		this.stopped = true;
		this.unschedule();

		this.processedTrack?.stop();
		this.processedTrack = undefined;

		this.renderer?.destroy();
		this.renderer = undefined;
		this.canvas?.remove();
		this.canvas = undefined;
		this.temporalMask = undefined;
		this.small = undefined;

		if (this.source) {
			this.source.srcObject = null;
			if (this.ownsSource) {
				this.source.remove();
			}
			this.source = undefined;
		}

		this.segmenter?.close();
		this.segmenter = undefined;
	}

	/** Blur, as a fraction of frame height. `0` passes frames through untouched. */
	setStrength(strength: number): void {
		this.strength = strength;
	}

	/** Waits for the camera to say how big its picture is, which it does not know the instant it is handed over. */
	private async dimensions(track?: MediaStreamTrack): Promise<{ width: number; height: number }> {
		const { source } = this;
		if (!source) {
			throw new Error('background blur has no camera to read');
		}

		const current = videoDimensions(track?.getSettings() ?? {}, source);
		if (current) {
			return current;
		}

		await new Promise<void>((resolve) => {
			const done = () => {
				source.removeEventListener('loadeddata', done);
				resolve();
			};
			source.addEventListener('loadeddata', done);
			// A camera that never fires the event should not leave a call without video for ever.
			setTimeout(done, 3000);
		});

		return videoDimensions(track?.getSettings() ?? {}, source) ?? { width: 640, height: 360 };
	}

	private resize(width: number, height: number): void {
		if (!this.canvas || (this.canvas.width === width && this.canvas.height === height)) {
			return;
		}

		this.renderer?.resize(width, height);
	}

	private schedule(): void {
		const { source } = this;
		if (!source || this.stopped) {
			return;
		}

		const step = () => {
			if (this.timer !== undefined) {
				clearTimeout(this.timer);
				this.timer = undefined;
			}
			this.frameRequest = undefined;
			this.render();
			this.schedule();
		};

		// Driven by the camera's own frames where the browser will say when they arrive, so the output has the same
		// rate as the input and no frame is drawn twice. Chromium can strand that callback when the video's srcObject
		// changes resolution, so a watchdog keeps the canvas stream alive until frame callbacks resume.
		if ('requestVideoFrameCallback' in source) {
			this.frameRequest = source.requestVideoFrameCallback(step);
			this.timer = setTimeout(() => {
				if (this.frameRequest !== undefined) {
					source.cancelVideoFrameCallback?.(this.frameRequest);
				}
				step();
			}, 100);
			return;
		}

		this.timer = setTimeout(step, 1000 / 30);
	}

	private unschedule(): void {
		if (this.frameRequest !== undefined) {
			this.source?.cancelVideoFrameCallback?.(this.frameRequest);
			this.frameRequest = undefined;
		}
		if (this.timer !== undefined) {
			clearTimeout(this.timer);
			this.timer = undefined;
		}
	}

	private render(): void {
		const { source } = this;
		const { renderer } = this;
		if (!source || !renderer || this.stopped || !source.videoWidth) {
			return;
		}

		if (this.strength) {
			this.segment();
		}
		const radius = this.strength ? Math.max(1, Math.round(this.strength * (this.canvas?.height ?? source.videoHeight))) : 0;
		renderer.render(source, radius);
		requestCapturedFrame(this.processedTrack);
	}

	/**
	 * Works out where the person is, if it is time to.
	 *
	 * The frame is scaled down to the model's own input size first, and *that* is what gets segmented. It costs a draw
	 * and saves an enormous amount: MediaPipe hands back a mask the size of what it was given, and reading a
	 * 1920×1080 mask off the GPU took 60ms a frame where a 256×256 one takes under one. Nothing is lost by it — the
	 * model resizes its input to exactly this size anyway, so a frame-sized mask was only ever its own output
	 * stretched back up, and we stretch it ourselves when compositing.
	 */
	private segment(): void {
		const { source, small } = this;
		if (!source || !small || !this.segmenter) {
			return;
		}

		const now = performance.now();
		if (now - this.lastSegment < SEGMENT_INTERVAL) {
			return;
		}

		// One at a time: asking for another segmentation while one is in flight throws, and the last mask is a frame
		// old at worst.
		if (this.segmenting) {
			return;
		}

		this.segmenting = true;
		this.lastSegment = now;

		small.context.drawImage(source, 0, 0, small.canvas.width, small.canvas.height);

		const timestamp = Math.max(this.lastTimestamp + 1, now);
		this.lastTimestamp = timestamp;

		try {
			this.segmenter.segmentForVideo(small.canvas, timestamp, (result) => {
				try {
					const confidence = result.confidenceMasks?.[this.person.index];
					if (confidence) {
						this.readMask(confidence);
					}
				} finally {
					result.close();
					this.segmenting = false;
				}
			});
		} catch (err) {
			this.segmenting = false;
			console.warn('background blur could not segment a frame', err);
		}
	}

	/**
	 * Keeps the model's probability at each pixel, stabilizes only small changes, and uploads the matte for GPU edge
	 * refinement. The renderer performs the full-resolution guided upsample; this method stays at model resolution.
	 */
	private readMask(mask: MPMask): void {
		this.temporalMask = stabilizeConfidenceMask(mask.getAsFloat32Array(), this.temporalMask, this.person.invert);
		this.renderer?.uploadMask(this.temporalMask, mask.width, mask.height);
	}
}
