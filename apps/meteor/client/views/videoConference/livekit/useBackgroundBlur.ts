import type { BackgroundProcessorWrapper } from '@livekit/track-processors';
import type { LocalVideoTrack } from 'livekit-client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useBackgroundBlurPreference } from '../../conference/hooks/useCallPreferences';

/** Which of the two ways of blurring is doing it, once we know one can. */
type Blur = 'camera' | 'processor';

/** Enough to soften a room without turning the caller into a cut-out. */
const BLUR_RADIUS = 12;

/**
 * Blurring the background of the local camera, and the switch for it.
 *
 * Two ways of doing it, and which one runs is whichever can:
 *
 * **The camera's own**, via the `backgroundBlur` constraint. Free — the effect is done by the operating system
 * before the frames ever reach us, so it costs no CPU of ours and no download. It exists only where the platform
 * provides it: ChromeOS, and Windows where the hardware does. It is asked for through `getCapabilities()` rather
 * than by trying it, because `applyConstraints` **resolves happily for a constraint the browser has never heard
 * of** — an unrecognised non-required constraint is dropped, per spec. Trying it and believing the result is how
 * you ship a switch that reports success and blurs nothing.
 *
 * **Ours**, via `@livekit/track-processors`: MediaPipe's selfie segmentation over every frame, replacing the
 * published track. It works anywhere with the modern APIs, and it is not free — it segments each frame on the CPU
 * or GPU, and it fetches its WASM and model from a CDN the first time. So it is the fallback rather than the
 * default choice, and it is only started when someone asks for blur.
 *
 * Off by default for that reason, and because a blurred background is a deliberate look rather than a sensible
 * default. The answer is remembered, since whoever wants it wants it every time.
 */
export const useBackgroundBlur = (videoTrack: LocalVideoTrack | undefined) => {
	const { backgroundBlur: preferred, toggleBackgroundBlur } = useBackgroundBlurPreference();

	const processorRef = useRef<BackgroundProcessorWrapper | null>(null);
	const blurRef = useRef<Blur | null>(null);
	const [blur, setBlur] = useState<Blur | null>(null);
	const [available, setAvailable] = useState(false);
	const [enabled, setEnabled] = useState(false);
	// Segmenting frames is expensive to start, so the switch says so while it is starting rather than looking stuck.
	const [pending, setPending] = useState(false);

	const preferredRef = useRef(preferred);
	preferredRef.current = preferred;

	/** Set up alongside the track, so the switch can start blur without repeating how. */
	const startProcessorBlurRef = useRef<(() => Promise<void>) | null>(null);

	/** Whether the camera itself can do it. Asked of the track's capabilities, never of `applyConstraints`. */
	const cameraCanBlur = useCallback((track: LocalVideoTrack) => {
		const capabilities = track.mediaStreamTrack?.getCapabilities?.() as { backgroundBlur?: boolean[] } | undefined;
		return Boolean(capabilities?.backgroundBlur?.includes(true));
	}, []);

	useEffect(() => {
		if (!videoTrack) {
			setAvailable(false);
			setEnabled(false);
			setBlur(null);
			return;
		}

		let cancelled = false;

		/** Loads the segmenter and puts it in the camera's path. The slow one; `pending` covers it. */
		const startProcessorBlur = async () => {
			setPending(true);
			try {
				const { BackgroundProcessor } = await import('@livekit/track-processors');
				if (cancelled) {
					return;
				}

				// eslint-disable-next-line new-cap
				const processor = BackgroundProcessor({ mode: 'background-blur', blurRadius: BLUR_RADIUS });
				await videoTrack.setProcessor(processor);
				if (cancelled) {
					void videoTrack.stopProcessor?.().catch(() => undefined);
					return;
				}

				processorRef.current = processor;
				setEnabled(true);
			} catch (err) {
				// The model and the WASM come from a CDN, so this is where a workspace with no way out to the
				// internet lands — with blur off, which is the honest outcome, rather than a switch claiming it is on.
				console.warn('background blur could not be started', err);
				setEnabled(false);
			} finally {
				setPending(false);
			}
		};

		startProcessorBlurRef.current = startProcessorBlur;

		void (async () => {
			if (cameraCanBlur(videoTrack)) {
				blurRef.current = 'camera';
				setBlur('camera');
				setAvailable(true);
				setEnabled(Boolean(videoTrack.mediaStreamTrack?.getSettings?.().backgroundBlur));
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

				blurRef.current = 'processor';
				setBlur('processor');
				setAvailable(true);
				setEnabled(false);

				// Nothing is downloaded or started for the *option* — a call nobody blurs pays nothing for it being
				// offered.
				//
				// A remembered "yes" is deliberately *not* acted on here yet. Starting blur republishes the camera
				// track, which brings this effect round again, and its cleanup then stops the processor it just
				// started: the switch ends up reading on with a perfectly sharp background behind it. Better to ask
				// once per call than to claim something untrue. Applying it on arrival needs the setup to key off
				// something that survives the republish — the publication's sid rather than the track object.
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
			setEnabled(false);
			if (processor) {
				void videoTrack.stopProcessor?.().catch(() => undefined);
			}
		};
	}, [videoTrack, cameraCanBlur]);

	const toggle = useCallback(() => {
		if (!videoTrack || pending) {
			return;
		}

		const next = !enabled;
		toggleBackgroundBlur();

		if (blurRef.current === 'camera') {
			// Applied *and then read back*: the request resolves whether or not anything happened, so what the track
			// says about itself afterwards is the only honest answer.
			void videoTrack.mediaStreamTrack
				?.applyConstraints({ backgroundBlur: next })
				.then(() => setEnabled(Boolean(videoTrack.mediaStreamTrack?.getSettings?.().backgroundBlur)))
				.catch((err: unknown) => {
					console.warn('the camera would not change its background blur', err);
					setEnabled(Boolean(videoTrack.mediaStreamTrack?.getSettings?.().backgroundBlur));
				});
			return;
		}

		const existing = processorRef.current;
		if (existing) {
			// Switched rather than torn down and rebuilt: the segmenter and its model stay loaded, so turning blur
			// back on is instant instead of another download and another cold start.
			setPending(true);
			void existing
				.switchTo(next ? { mode: 'background-blur', blurRadius: BLUR_RADIUS } : { mode: 'disabled' })
				.then(() => setEnabled(next))
				.catch((err: unknown) => console.warn('background blur would not switch', err))
				.finally(() => setPending(false));
			return;
		}

		if (!next) {
			setEnabled(false);
			return;
		}

		void startProcessorBlurRef.current?.();
	}, [videoTrack, enabled, pending, toggleBackgroundBlur]);

	return useMemo(
		() => ({
			/** Whether there is any way to blur at all. */
			available,
			enabled,
			/** Whether it is being done by the camera or by us. */
			blur,
			/** True while ours is starting up, which is the one slow moment in this. */
			pending,
			toggle,
		}),
		[available, enabled, blur, pending, toggle],
	);
};
