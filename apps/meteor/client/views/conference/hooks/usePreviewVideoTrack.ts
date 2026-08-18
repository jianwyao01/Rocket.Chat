import type { LocalVideoTrack } from 'livekit-client';
import { createLocalVideoTrack } from 'livekit-client';
import { useEffect, useState } from 'react';

import type { BlurLevel, VideoQuality } from './useCallPreferences';
import type { BackgroundBlurProcessor } from '../../videoConference/livekit/backgroundBlurProcessor';
import { BLUR_STRENGTH } from '../../videoConference/livekit/useBackgroundBlur';

/** The same presets the in-call picker uses, so a resolution means the same thing on both screens. */
const RESOLUTIONS: Record<Exclude<VideoQuality, 'auto'>, { width: number; height: number }> = {
	h1080: { width: 1920, height: 1080 },
	h720: { width: 1280, height: 720 },
	h360: { width: 640, height: 360 },
	h180: { width: 320, height: 180 },
};

/**
 * The camera for the preflight, as a **LiveKit track** rather than a bare `getUserMedia` stream.
 *
 * This is what lets the preflight tell the truth about background blur. Blur is a `TrackProcessor`, and a processor
 * needs a `LocalTrack` to attach to — no room required, since MediaPipe blur has nothing to ask a server. Built this
 * way, the preview runs the *same* processor with the *same* radius the call will use, so what is on this screen is
 * what the call sends. A raw stream could only ever have shown an unblurred picture next to a blurred promise.
 *
 * It is also what makes the resolution choice real here rather than notional: the track is created with it.
 *
 * The track is stopped when this unmounts, so the camera light goes out if the user walks away. Handing it to the
 * room instead — `publishTrack` takes a pre-created track — would remove the re-acquire between this screen and the
 * call, and with it the flicker on entry and the need to re-apply blur on join. That is the next step, and it is why
 * this returns the track itself rather than a stream.
 */
export const usePreviewVideoTrack = (
	enabled: boolean,
	{ deviceId, quality, blurLevel }: { deviceId?: string; quality: VideoQuality; blurLevel: BlurLevel },
): { track?: LocalVideoTrack; error: boolean } => {
	const [track, setTrack] = useState<LocalVideoTrack | undefined>();
	const [error, setError] = useState(false);

	// The camera is opened for the device and the resolution, and *not* for the blur: blur is applied to a track that
	// already exists, so changing it must not re-open the camera.
	useEffect(() => {
		if (!enabled) {
			setTrack(undefined);
			return;
		}

		let cancelled = false;
		let opened: LocalVideoTrack | undefined;

		void createLocalVideoTrack({
			...(deviceId && { deviceId: { exact: deviceId } }),
			...(quality !== 'auto' && { resolution: RESOLUTIONS[quality] }),
		})
			.then((next) => {
				opened = next;
				if (cancelled) {
					next.stop();
					return;
				}
				setError(false);
				setTrack(next);
			})
			.catch(() => {
				if (!cancelled) {
					setError(true);
					setTrack(undefined);
				}
			});

		return () => {
			cancelled = true;
			// Stopped rather than left running: a preview nobody is looking at should not keep the camera light on.
			opened?.stop();
		};
	}, [enabled, deviceId, quality]);

	// Blur, applied to whichever track is current. Switched where a processor is already loaded, so moving between
	// strengths costs nothing after the first — the same arrangement as in the call.
	useEffect(() => {
		if (!track) {
			return;
		}

		let cancelled = false;

		void (async () => {
			try {
				const strength = blurLevel === 'none' ? 0 : BLUR_STRENGTH[blurLevel];
				const existing = track.getProcessor() as BackgroundBlurProcessor | undefined;

				if (existing) {
					// Already segmenting: a strength is a number to it, so moving between levels here is instant, the
					// same as it is in the call.
					existing.setStrength(strength);
					return;
				}

				if (blurLevel === 'none') {
					return;
				}

				const { BackgroundBlurProcessor } = await import('../../videoConference/livekit/backgroundBlurProcessor');
				if (cancelled) {
					return;
				}

				await track.setProcessor(new BackgroundBlurProcessor(strength));
			} catch (err) {
				// MediaPipe comes from a CDN. Failing here means an unblurred preview, which is the truth.
				console.warn('background blur could not be previewed', err);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [track, blurLevel]);

	return { track, error };
};
