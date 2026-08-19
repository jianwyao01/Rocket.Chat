import { supportsBackgroundBlur } from './backgroundBlurSupport';

type FakeCanvas = { getContext: (kind: string) => unknown };

const canvasThat = ({ webgl2 = true }: { webgl2?: boolean } = {}): FakeCanvas => ({
	getContext: (kind: string) => (kind === 'webgl2' && webgl2 ? {} : null),
});

const use = (canvas: FakeCanvas) => jest.spyOn(document, 'createElement').mockReturnValue(canvas as unknown as HTMLElement);

beforeEach(() => {
	Object.defineProperty(HTMLCanvasElement.prototype, 'captureStream', { value: jest.fn(), configurable: true });
});

afterEach(() => {
	jest.restoreAllMocks();
	delete (HTMLCanvasElement.prototype as { captureStream?: unknown }).captureStream;
});

it('says yes where the canvas can be captured and reach WebGL2', () => {
	use(canvasThat());

	expect(supportsBackgroundBlur()).toBe(true);
});

// MediaPipe's GPU delegate needs it, and its CPU one cannot hold 30fps at these sizes.
it('says no without WebGL2', () => {
	use(canvasThat({ webgl2: false }));

	expect(supportsBackgroundBlur()).toBe(false);
});

it('says no where a canvas cannot be captured as a track', () => {
	use(canvasThat());
	delete (HTMLCanvasElement.prototype as { captureStream?: unknown }).captureStream;

	expect(supportsBackgroundBlur()).toBe(false);
});
