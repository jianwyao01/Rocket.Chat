import { supportsBackgroundBlur } from './backgroundBlurSupport';

type FakeCanvas = { getContext: (kind: string) => unknown };

const canvasThat = ({
	filters = true,
	webgl2 = true,
	twoD = true,
}: {
	filters?: boolean;
	webgl2?: boolean;
	twoD?: boolean;
}): FakeCanvas => {
	const context = {
		_filter: 'none',
		get filter() {
			return this._filter;
		},
		// A browser that does not know canvas filters accepts the assignment and keeps the old value.
		set filter(next: string) {
			if (filters) {
				this._filter = next;
			}
		},
	};

	return {
		getContext: (kind: string) => {
			if (kind === '2d') {
				return twoD ? context : null;
			}
			return kind === 'webgl2' && webgl2 ? {} : null;
		},
	};
};

const use = (canvas: FakeCanvas) => jest.spyOn(document, 'createElement').mockReturnValue(canvas as unknown as HTMLElement);

beforeEach(() => {
	Object.defineProperty(HTMLCanvasElement.prototype, 'captureStream', { value: jest.fn(), configurable: true });
});

afterEach(() => {
	jest.restoreAllMocks();
	delete (HTMLCanvasElement.prototype as { captureStream?: unknown }).captureStream;
});

it('says yes where the canvas can filter, capture and reach WebGL2', () => {
	use(canvasThat({}));

	expect(supportsBackgroundBlur()).toBe(true);
});

// The whole reason this is asked rather than assumed: assigning an unknown filter throws nothing and every later
// draw succeeds, so believing it would publish a sharp background under a menu that says "strong".
it('says no where the canvas quietly drops the filter it was given', () => {
	use(canvasThat({ filters: false }));

	expect(supportsBackgroundBlur()).toBe(false);
});

// MediaPipe's GPU delegate needs it, and its CPU one cannot hold 30fps at these sizes.
it('says no without WebGL2', () => {
	use(canvasThat({ webgl2: false }));

	expect(supportsBackgroundBlur()).toBe(false);
});

it('says no where a canvas cannot be captured as a track', () => {
	use(canvasThat({}));
	delete (HTMLCanvasElement.prototype as { captureStream?: unknown }).captureStream;

	expect(supportsBackgroundBlur()).toBe(false);
});

it('says no where there is no 2D context to be had', () => {
	use(canvasThat({ twoD: false }));

	expect(supportsBackgroundBlur()).toBe(false);
});
