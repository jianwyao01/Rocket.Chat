/**
 * Whether this browser can blur a camera background the way {@link BackgroundBlurProcessor} does it.
 *
 * Its own file, away from the processor, because this is the question a menu asks before anyone has chosen anything:
 * importing the processor to ask would fetch MediaPipe for a call that may never blur. Nothing here downloads.
 *
 * Every one of these fails quietly rather than throwing, which is why each is asked rather than assumed. The canvas
 * filter especially: a browser that has never heard of it accepts the assignment, drops it, and every later draw
 * succeeds — leaving an unblurred picture that claims to be blurred.
 */
export const supportsBackgroundBlur = (): boolean => {
	if (typeof document === 'undefined' || !('captureStream' in HTMLCanvasElement.prototype)) {
		return false;
	}

	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');
	if (!context) {
		return false;
	}

	context.filter = 'blur(4px)';
	const filters = context.filter === 'blur(4px)';

	// MediaPipe's GPU delegate wants WebGL2. Its CPU one is too slow at these sizes to be worth offering.
	return filters && Boolean(canvas.getContext('webgl2'));
};
