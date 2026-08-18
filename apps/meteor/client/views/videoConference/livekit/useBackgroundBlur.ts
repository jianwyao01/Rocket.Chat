import type { BackgroundProcessorWrapper } from '@livekit/track-processors';
import type { LocalVideoTrack } from 'livekit-client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { BlurLevel } from '../../conference/hooks/useCallPreferences';
import { useBackgroundBlurPreference } from '../../conference/hooks/useCallPreferences';

/** Which way of blurring is doing it. The camera's own effect has no strengths to choose between. */
type Blur = 'camera' | 'processor';

/**
 * How strong each level is, in pixels of blur radius. Three, because "on" is not a useful amount: a little softens
 * a room, and a lot hides it, and people want different ones of those.
 */
const RADIUS: Record<Exclude<BlurLevel, 'none'>, number> = { light: 5, medium: 12, strong: 25 };

/**
 * Blurring the background of the local camera, at a strength the user picks.
 *
 * Two ways of doing it, and which one runs is whichever can:
 *
 * **The camera's own**, via the `backgroundBlur` constraint — free, done by the platform before the frames reach
 * us, and available on ChromeOS and capable Windows hardware. It is asked for through `getCapabilities()` rather
 * than by trying it, because `applyConstraints` resolves happily for a constraint the browser has never heard of.
 * It has no strength to choose: it is on or off, so picking any level turns it on.
 *
 * **Ours**, via `@livekit/track-processors`: MediaPipe segmentation over every frame. This one takes the radius,
 * and switching between strengths keeps the segmenter loaded — `switchTo` rather than a rebuild — so changing your
 * mind costs nothing after the first time.
 */
export const useBackgroundBlur = (videoTrack: LocalVideoTrack | undefined) => {
	const { blurLevel: preferred, selectBlurLevel } = useBackgroundBlurPreference();

	const processorRef = useRef<BackgroundProcessorWrapper | null>(null);
	const blurRef = useRef<Blur | null>(null);
	const trackRef = useRef<LocalVideoTrack | undefined>(videoTrack);
	trackRef.current = videoTrack;

	const [blur, setBlur] = useState<Blur | null>(null);
	const [available, setAvailable] = useState(false);
	const [level, setLevel] = useState<BlurLevel>('none');
	const [pending, setPending] = useState(false);

	const cameraCanBlur = useCallback((track: LocalVideoTrack) => {
		const capabilities = track.mediaStreamTrack?.getCapabilities?.() as { backgroundBlur?: boolean[] } | undefined;
		return Boolean(capabilities?.backgroundBlur?.includes(true));
	}, []);

	useEffect(() => {
		if (!videoTrack) {
			setAvailable(false);
			setLevel('none');
			setBlur(null);
			return;
		}

		let cancelled = false;

		void (async () => {
			if (cameraCanBlur(videoTrack)) {
				blurRef.current = 'camera';
				setBlur('camera');
				setAvailable(true);
				setLevel(videoTrack.mediaStreamTrack?.getSettings?.().backgroundBlur ? 'medium' : 'none');
				return;
			}

			try {
				const { supportsBackgroundProcessors } = await import('@livekit/track-processors');
				if (cancelled) {
					return;
				}

				if (!supportsBackgroundProcessors()) {
					setAvailable(false);
					return;
				}

				// Nothing is downloaded for the *option* — the model and the WASM arrive when a level is picked, so a
				// call nobody blurs pays nothing for it being offered. See the note in `select` about arriving with a
				// remembered level.
				blurRef.current = 'processor';
				setBlur('processor');
				setAvailable(true);
				setLevel('none');
			} catch (err) {
				console.warn('background blur is unavailable', err);
				if (!cancelled) {
					setAvailable(false);
				}
			}
		})();

		return () => {
			cancelled = true;
			const processor = processorRef.current;
			processorRef.current = null;
			blurRef.current = null;
			setBlur(null);
			setAvailable(false);
			setLevel('none');
			if (processor) {
				void videoTrack.stopProcessor?.().catch(() => undefined);
			}
		};
	}, [videoTrack, cameraCanBlur]);

	/**
	 * Picks a strength, or none.
	 *
	 * A remembered level is still not applied on arrival: starting blur republishes the camera, which brings the
	 * effect above round again, and its cleanup stops the processor it just started. That is why this is the only
	 * place blur begins.
	 */
	const select = useCallback(
		(next: BlurLevel) => {
			const track = trackRef.current;
			if (!track || pending || next === level) {
				return;
			}

			selectBlurLevel(next);

			if (blurRef.current === 'camera') {
				// One effect, no strengths: any level means on.
				const on = next !== 'none';
				void track.mediaStreamTrack
					?.applyConstraints({ backgroundBlur: on })
					// Read back rather than assumed, since the request resolves either way.
					.then(() => setLevel(track.mediaStreamTrack?.getSettings?.().backgroundBlur ? next : 'none'))
					.catch((err: unknown) => console.warn('the camera would not change its background blur', err));
				return;
			}

			setPending(true);
			void (async () => {
				try {
					const options =
						next === 'none' ? ({ mode: 'disabled' } as const) : ({ mode: 'background-blur', blurRadius: RADIUS[next] } as const);
					const existing = processorRef.current;

					if (existing) {
						// The segmenter and its model stay loaded, so changing strength is instant.
						await existing.switchTo(options);
						setLevel(next);
						return;
					}

					if (next === 'none') {
						setLevel('none');
						return;
					}

					const { BackgroundProcessor } = await import('@livekit/track-processors');
					// eslint-disable-next-line new-cap
					const processor = BackgroundProcessor(options);
					await track.setProcessor(processor);
					processorRef.current = processor;
					setLevel(next);
				} catch (err) {
					// The model and the WASM come from a CDN, so this is where a workspace with no way out lands —
					// with blur off, which is the truth, rather than a level claiming to be applied.
					console.warn('background blur could not be started', err);
					setLevel('none');
				} finally {
					setPending(false);
				}
			})();
		},
		[level, pending, selectBlurLevel],
	);

	return useMemo(
		() => ({
			/** Whether there is any way to blur at all. */
			available,
			/** The strength in use. `none` means the camera is going out untouched. */
			level,
			/** Which levels can be picked. The camera's own effect has one strength, so it offers only medium. */
			levels: blur === 'camera' ? ['none', 'medium'] : ['none', 'light', 'medium', 'strong'],
			/** Whether the camera or we are doing it. */
			blur,
			/** True while ours is starting, which is the one slow moment. */
			pending,
			/** What was remembered from last time, for anyone who wants to offer it. */
			preferred,
			select,
		}),
		[available, level, blur, pending, preferred, select],
	);
};
