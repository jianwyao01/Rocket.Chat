import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';
import type { MPMask } from '@mediapipe/tasks-vision';
import type { Track, TrackProcessor, VideoProcessorOptions } from 'livekit-client';

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
 * Both are fetched from Google's CDN on first use, so a workspace with no way out to the internet gets a caught
 * failure and no blur. Serving them from `public/`, as the RNNoise assets are, is what would fix that.
 */
export const SEGMENTER_MODELS = {
	multiclass: {
		url: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite',
		input: { width: 256, height: 256 },
	},
	selfie: {
		url: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter_landscape/float16/latest/selfie_segmenter_landscape.tflite',
		input: { width: 256, height: 144 },
	},
} as const;

/** The one in use. One line to change, and everything below reads the model rather than assuming anything about it. */
export const SEGMENTER = SEGMENTER_MODELS.multiclass;

/**
 * MediaPipe's WASM, which has to match the version of `@mediapipe/tasks-vision` this app depends on — it is the
 * runtime for the JS in the package, not an independent thing. Keep the two in step when the package moves.
 *
 * Both this and the model come from a CDN, so a workspace with no way out to the internet gets a caught failure and
 * no blur. Serving them from `public/`, as the RNNoise assets are, is what would fix that.
 */
export const SEGMENTER_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';

/**
 * Which numbers in the mask mean "the person", as a lookup table over every possible category.
 *
 * Read from the labels the model reports rather than assumed, because the answer is not the same between models and
 * is the opposite of what it looks like in one of them. The landscape model reports a single label — `selfie` — at
 * index **0** and paints everything else 255, so its marked pixels are the *background*; treating them as the subject
 * blurs the person and leaves the room sharp, which is exactly what it did the first time. The multiclass model
 * reports `background` at 0 and five kinds of person after it.
 *
 * One rule covers both: everything that is not called `background` is the person. A table rather than a set because
 * this is read once per pixel of the mask.
 */
export const subjectCategories = (labels: string[]): Uint8Array => {
	const table = new Uint8Array(256);

	labels.forEach((label, category) => {
		if (label !== 'background') {
			table[category] = 255;
		}
	});

	// A model that names nothing at all: better a blurred background than a blurred face.
	if (!labels.length) {
		table[0] = 255;
	}

	return table;
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

/** How wide the feather along the edge of the subject is, as a fraction of frame height. */
const EDGE_SOFTNESS = 0.006;

/**
 * Blurs the background of a camera track, and nothing else.
 *
 * This is MediaPipe's image segmenter driving a plain 2D canvas, in place of `@livekit/track-processors`. The library
 * works, and was what this feature shipped on first, but it composites the background into a texture at **a quarter
 * of the frame's size** and stretches it back — a 480×270 background on a 1080p frame. That upscale, not the blur
 * radius, is what read as "low quality", and no radius could get past it because the factor is a constant in the
 * library. This does the same segmentation and composites at full frame size.
 *
 * The compositing is three draws, and the browser's own blur does the expensive part:
 *
 * 1. the frame, sharp;
 * 2. the mask over it as `destination-in`, so only the subject is left, feathered along the edge;
 * 3. the frame again as `destination-over`, blurred, filling in everything behind.
 *
 * `ctx.filter` is a real Gaussian at full resolution, and Skia runs it on the GPU — which is the whole reason this
 * is short enough to be worth owning. It is also why {@link isSupported} insists on it rather than assuming: where
 * the filter is ignored, every draw still succeeds and the result is an unblurred frame that claims to be blurred.
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
	readonly name = 'rocket-chat-background-blur';

	processedTrack?: MediaStreamTrack;

	private strength: number;

	private segmenter?: ImageSegmenter;

	private source?: HTMLVideoElement;

	private ownsSource = false;

	private canvas?: HTMLCanvasElement;

	private context?: CanvasRenderingContext2D | null;

	private mask?: { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D; image: ImageData };

	/** Which category numbers in this model's mask are the person. See {@link subjectCategories}. */
	private subject: Uint8Array = new Uint8Array(256);

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

		const { width, height } = await this.dimensions();

		// The canvas has to be in the document for its captured stream to keep producing frames — an offscreen one
		// stalls in some browsers — but nobody should see it.
		this.canvas = document.createElement('canvas');
		this.canvas.width = width;
		this.canvas.height = height;
		this.canvas.style.display = 'none';
		document.body.appendChild(this.canvas);

		this.context = this.canvas.getContext('2d');
		if (!this.context) {
			throw new Error('background blur needs a 2D canvas');
		}
		// The mask is small and gets stretched over the whole frame, so how it is stretched matters.
		this.context.imageSmoothingEnabled = true;
		this.context.imageSmoothingQuality = 'high';

		// No frame rate: a captured stream with none takes a frame every time the canvas is drawn on, which is once
		// per frame that arrives.
		[this.processedTrack] = this.canvas.captureStream().getVideoTracks();

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
			outputCategoryMask: true,
			outputConfidenceMasks: false,
		});

		this.subject = subjectCategories(this.segmenter.getLabels());

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

		const { width, height } = await this.dimensions();
		this.resize(width, height);

		this.stopped = false;
		this.schedule();
	}

	async destroy(): Promise<void> {
		this.stopped = true;
		this.unschedule();

		this.processedTrack?.stop();
		this.processedTrack = undefined;

		this.canvas?.remove();
		this.canvas = undefined;
		this.context = undefined;
		this.mask = undefined;
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
	private async dimensions(): Promise<{ width: number; height: number }> {
		const { source } = this;
		if (!source) {
			throw new Error('background blur has no camera to read');
		}

		if (source.videoWidth && source.videoHeight) {
			return { width: source.videoWidth, height: source.videoHeight };
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

		return { width: source.videoWidth || 640, height: source.videoHeight || 360 };
	}

	private resize(width: number, height: number): void {
		if (!this.canvas || (this.canvas.width === width && this.canvas.height === height)) {
			return;
		}

		this.canvas.width = width;
		this.canvas.height = height;
		// Resizing a canvas resets its context, including how it stretches the mask.
		if (this.context) {
			this.context.imageSmoothingEnabled = true;
			this.context.imageSmoothingQuality = 'high';
		}
	}

	private schedule(): void {
		const { source } = this;
		if (!source || this.stopped) {
			return;
		}

		const step = () => {
			this.render();
			this.schedule();
		};

		// Driven by the camera's own frames where the browser will say when they arrive, so the output has the same
		// rate as the input and no frame is drawn twice.
		if ('requestVideoFrameCallback' in source) {
			this.frameRequest = source.requestVideoFrameCallback(step);
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
		const { context } = this;
		if (!source || !context || this.stopped || !source.videoWidth) {
			return;
		}

		this.resize(source.videoWidth, source.videoHeight);

		if (!this.strength) {
			// Pass-through. Frames have to keep coming — the room is publishing this canvas — but nothing is segmented,
			// so turning blur off costs a copy rather than a model.
			context.filter = 'none';
			context.globalCompositeOperation = 'copy';
			context.drawImage(source, 0, 0, context.canvas.width, context.canvas.height);
			return;
		}

		this.segment();
		this.composite();
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
				if (result.categoryMask) {
					this.readMask(result.categoryMask);
				}
				result.close();
				this.segmenting = false;
			});
		} catch (err) {
			this.segmenting = false;
			console.warn('background blur could not segment a frame', err);
		}
	}

	/**
	 * Turns the segmenter's answer into something a canvas can cut with: a mask-sized bitmap whose alpha is the
	 * subject.
	 *
	 * Only the alpha channel is written; the colours are never read, since `destination-in` cares about nothing else.
	 * At the model's own size this is a few tens of thousands of pixels either way — under a millisecond.
	 */
	private readMask(mask: MPMask): void {
		const values = mask.getAsUint8Array();

		if (this.mask?.canvas.width !== mask.width || this.mask?.canvas.height !== mask.height) {
			const canvas = document.createElement('canvas');
			canvas.width = mask.width;
			canvas.height = mask.height;
			const context = canvas.getContext('2d');
			if (!context) {
				return;
			}
			this.mask = { canvas, context, image: context.createImageData(mask.width, mask.height) };
		}

		const { image, context } = this.mask;
		for (let index = 0; index < values.length; index++) {
			image.data[index * 4 + 3] = this.subject[values[index]];
		}
		context.putImageData(image, 0, 0);
	}

	private composite(): void {
		const { source } = this;
		const { context } = this;
		if (!source || !context) {
			return;
		}

		const { width, height } = context.canvas;
		const radius = Math.max(1, Math.round(this.strength * height));
		const feather = Math.max(1, Math.round(EDGE_SOFTNESS * height));

		context.filter = 'none';
		context.globalCompositeOperation = 'copy';
		context.drawImage(source, 0, 0, width, height);

		if (this.mask) {
			// Keep the subject, and only the subject. The mask is blurred as it is stretched up, which is what stops
			// the boundary looking cut out with scissors.
			context.filter = `blur(${feather}px)`;
			context.globalCompositeOperation = 'destination-in';
			context.drawImage(this.mask.canvas, 0, 0, width, height);
		}

		// Everything behind, blurred. Drawn a radius larger on every side: a blur samples past the edge of what it is
		// given, so a frame drawn to size would fade out around its own border, and the overlap also pushes the
		// subject's own smeared outline outwards instead of leaving it as a halo.
		context.filter = `blur(${radius}px)`;
		context.globalCompositeOperation = 'destination-over';
		context.drawImage(source, -radius, -radius, width + radius * 2, height + radius * 2);

		context.filter = 'none';
		context.globalCompositeOperation = 'source-over';
	}
}
