import type { LocalVideoTrack } from 'livekit-client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { BackgroundBlurProcessor } from './backgroundBlurProcessor';
import { supportsBackgroundBlur } from './backgroundBlurSupport';
import type { BlurLevel } from '../../conference/hooks/useCallPreferences';
import { useBackgroundBlurPreference } from '../../conference/hooks/useCallPreferences';

/** Which way of blurring is doing it. The camera's own effect has no strengths to choose between. */
type Blur = 'camera' | 'processor';

/**
 * How strong each level is, as a fraction of the frame's height.
 *
 * A fraction rather than a number of pixels: the same track is watched at whatever size the other end's tile happens
 * to be, so what has to hold across resolutions is the blur *relative to the picture*. Twelve pixels on a 360p frame
 * and thirty-six on 1080p are the same photograph; pinning it to pixels would make every level three times lighter
 * as the camera got better.
 *
 * Three, because "on" is not a useful amount: a little softens a room, a lot hides it, and people want different
 * ones of those. Tuned by eye against Meet at the same resolution — light is a hint of separation, strong hides the
 * room behind you.
 */
export const BLUR_STRENGTH: Record<Exclude<BlurLevel, 'none'>, number> = { light: 0.012, medium: 0.024, strong: 0.048 };

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
 * **Ours**, via {@link BackgroundBlurProcessor}: MediaPipe segmentation over every frame, composited on a canvas at
 * full frame size. This one takes a strength, and changing it is a number on the running processor — no rebuild, no
 * re-publish — so only the first choice in a call is slow.
 */
export const useBackgroundBlur = (videoTrack: LocalVideoTrack | undefined) => {
	const { blurLevel: preferred, selectBlurLevel } = useBackgroundBlurPreference();

	const processorRef = useRef<BackgroundBlurProcessor | null>(null);
	const blurRef = useRef<Blur | null>(null);
	const trackRef = useRef<LocalVideoTrack | undefined>(videoTrack);
	trackRef.current = videoTrack;

	const [blur, setBlur] = useState<Blur | null>(null);
	const [available, setAvailable] = useState(false);
	const [level, setLevel] = useState<BlurLevel>(preferred);
	const levelRef = useRef<BlurLevel>(level);
	levelRef.current = level;
	const [pending, setPending] = useState(false);

	const cameraCanBlur = useCallback((track: LocalVideoTrack) => {
		const capabilities = track.mediaStreamTrack?.getCapabilities?.() as { backgroundBlur?: boolean[] } | undefined;
		return Boolean(capabilities?.backgroundBlur?.includes(true));
	}, []);

	// When the track goes away (camera toggled off), keep the blur UI available at whatever level it was — the user
	// should still be able to pick a strength while the camera is off, and it will be applied when the camera returns.
	// Only the processor needs to be stopped; the preference and availability survive.
	useEffect(() => {
		if (!videoTrack) {
			const processor = processorRef.current;
			processorRef.current = null;
			if (processor) {
				// Track is already gone; just drop the processor reference.
				processor.setStrength(0);
			}
			return;
		}

		let cancelled = false;

		void (async () => {
			if (cameraCanBlur(videoTrack)) {
				blurRef.current = 'camera';
				setBlur('camera');
				setAvailable(true);
				if (levelRef.current !== 'none') {
					void videoTrack.mediaStreamTrack
						?.applyConstraints({ backgroundBlur: true } as any)
						.catch((err: unknown) => console.warn('could not re-apply camera blur', err));
				}
				return;
			}

			if (cancelled) {
				return;
			}

			if (!supportsBackgroundBlur()) {
				return;
			}

			blurRef.current = 'processor';
			setBlur('processor');
			setAvailable(true);

			// Re-apply the processor at the remembered level when the camera comes back.
			const currentLevel = levelRef.current;
			if (currentLevel !== 'none') {
				const strength = BLUR_STRENGTH[currentLevel];
				try {
					const { BackgroundBlurProcessor } = await import('./backgroundBlurProcessor');
					if (cancelled) return;
					const processor = new BackgroundBlurProcessor(strength);
					await videoTrack.setProcessor(processor);
					processorRef.current = processor;
				} catch (err) {
					console.warn('background blur could not be re-applied', err);
					setLevel('none');
				}
			}
		})();

		return () => {
			cancelled = true;
			const processor = processorRef.current;
			processorRef.current = null;
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
			if (pending || next === level) {
				return;
			}

			selectBlurLevel(next);

			const track = trackRef.current;
			if (!track) {
				setLevel(next);
				return;
			}

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
					const strength = next === 'none' ? 0 : BLUR_STRENGTH[next];
					const existing = processorRef.current;

					if (existing) {
						// A number on a processor that is already running: instant, and the camera stays published, which
						// is why turning blur off leaves it attached and passing frames through rather than detaching.
						existing.setStrength(strength);
						setLevel(next);
						return;
					}

					if (next === 'none') {
						setLevel('none');
						return;
					}

					const { BackgroundBlurProcessor } = await import('./backgroundBlurProcessor');
					const processor = new BackgroundBlurProcessor(strength);
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
