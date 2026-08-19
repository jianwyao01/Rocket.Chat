import {
	captureCanvasTrack,
	personConfidence,
	refreshCapturedTrack,
	requestCapturedFrame,
	stabilizeConfidenceMask,
	videoDimensions,
} from './backgroundBlurProcessor';

it('uses the inverse background confidence for the multiclass model', () => {
	expect(personConfidence(['background', 'hair', 'body-skin', 'face-skin', 'clothes', 'others'])).toEqual({ index: 0, invert: true });
});

it('uses the selfie confidence directly for the landscape model', () => {
	expect(personConfidence(['selfie'])).toEqual({ index: 0, invert: false });
});

it('falls back to the first direct confidence mask for an unknown model', () => {
	expect(personConfidence([])).toEqual({ index: 0, invert: false });
});

it('preserves continuous confidence instead of reducing the matte to two categories', () => {
	expect(stabilizeConfidenceMask(new Float32Array([0, 0.25, 0.5, 0.75, 1]), undefined, false)).toEqual(
		new Uint8Array([0, 5, 128, 250, 255]),
	);
});

it('can derive person alpha from background confidence', () => {
	expect(stabilizeConfidenceMask(new Float32Array([0, 0.25, 1]), undefined, true)).toEqual(new Uint8Array([255, 250, 0]));
});

it('removes weak foreground confidence that would leak sharp room details over the blur', () => {
	expect(stabilizeConfidenceMask(new Float32Array([0.1, 0.2, 0.3]), undefined, false)).toEqual(new Uint8Array([0, 0, 19]));
});

it('damps small confidence jitter but accepts real motion immediately', () => {
	const previous = new Uint8Array([128, 0]);
	const next = stabilizeConfidenceMask(new Float32Array([0.6, 1]), previous, false);

	expect(next[0]).toBe(174);
	expect(next[1]).toBe(255);
});

it('uses replacement-track dimensions instead of a stale video element after a resolution change', () => {
	expect(videoDimensions({ width: 640, height: 360 }, { videoWidth: 1280, videoHeight: 720 })).toEqual({ width: 640, height: 360 });
});

it('falls back to video dimensions when track settings are not available', () => {
	expect(videoDimensions({}, { videoWidth: 320, videoHeight: 180 })).toEqual({ width: 320, height: 180 });
});

it('recreates the captured output track when the canvas resolution changes', () => {
	const current = { stop: jest.fn() } as unknown as MediaStreamTrack;
	const replacement = { requestFrame: jest.fn() } as unknown as MediaStreamTrack;
	const captureStream = jest.fn(() => ({ getVideoTracks: () => [replacement] }));
	const canvas = { captureStream } as unknown as HTMLCanvasElement;

	expect(refreshCapturedTrack(canvas, current, true)).toBe(replacement);
	expect(current.stop).toHaveBeenCalledTimes(1);
	expect(captureStream).toHaveBeenCalledWith(0);
});

it('keeps the captured output track while dimensions stay unchanged', () => {
	const current = { stop: jest.fn() } as unknown as MediaStreamTrack;
	const canvas = { captureStream: jest.fn() } as unknown as HTMLCanvasElement;

	expect(refreshCapturedTrack(canvas, current, false)).toBe(current);
	expect(current.stop).not.toHaveBeenCalled();
	expect(canvas.captureStream).not.toHaveBeenCalled();
});

it('falls back to automatic canvas capture where manual frame requests are unavailable', () => {
	const manual = { stop: jest.fn() } as unknown as MediaStreamTrack;
	const automatic = {} as MediaStreamTrack;
	const captureStream = jest
		.fn()
		.mockReturnValueOnce({ getVideoTracks: () => [manual] })
		.mockReturnValueOnce({ getVideoTracks: () => [automatic] });

	expect(captureCanvasTrack({ captureStream } as unknown as HTMLCanvasElement)).toBe(automatic);
	expect(captureStream).toHaveBeenNthCalledWith(1, 0);
	expect(captureStream).toHaveBeenNthCalledWith(2);
	expect(manual.stop).toHaveBeenCalledTimes(1);
});

it('explicitly publishes each completed WebGL frame to the canvas capture track', () => {
	const requestFrame = jest.fn();
	const track = { requestFrame } as unknown as MediaStreamTrack;

	requestCapturedFrame(track);

	expect(requestFrame).toHaveBeenCalledTimes(1);
});
