import type { KrispNoiseFilterProcessor } from '@livekit/krisp-noise-filter';
import type { LocalAudioTrack } from 'livekit-client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useNoiseSuppressionPreference } from '../../conference/hooks/useCallPreferences';

/** Which filter is actually doing the work, once we know one can. */
type Filter = 'krisp' | 'browser';

/**
 * Noise cancelling on the local microphone, and the switch for it.
 *
 * There are two filters here, and which one is used is not a preference — it is whichever can actually run.
 *
 * **Krisp** is the good one, and it is licensed through LiveKit Cloud. On a self-hosted LiveKit its `setEnabled`
 * calls an authentication endpoint that answers 404, leaves `isEnabled()` false, and filters nothing. That is worth
 * knowing because the failure is silent and looks exactly like success: the processor attaches, the WASM worklet
 * starts, and the audio graph is rebuilt to route every sample through a filter that has been switched off. So the
 * result of `setEnabled` is *checked*, and a filter that would not turn on is destroyed rather than left in the
 * path adding latency for nothing.
 *
 * **The browser's own** noise suppression is the fallback, and on a self-hosted workspace it is what everyone
 * actually gets. It is a constraint on the microphone rather than a processor, so switching it means restarting the
 * track — a brief gap in the audio, which is why it is not used to switch Krisp on and off where Krisp works.
 *
 * Krisp is only attached at all once the track is *published*: LiveKit calls a processor's `onPublish` from a
 * listener it registers at publication, so one attached earlier sits there doing nothing.
 */
export const useNoiseSuppression = (audioTrack: LocalAudioTrack | undefined) => {
	const { noiseSuppression: preferred, toggleNoiseSuppression } = useNoiseSuppressionPreference();

	const processorRef = useRef<KrispNoiseFilterProcessor | null>(null);
	const filterRef = useRef<Filter | null>(null);
	// The same answer as the ref, in state: the ref is what the switch below reads, and this is what the menu shows.
	// Which filter is running is worth saying out loud — the two do not sound alike, and someone wondering why a
	// call sounds the way it does should not have to guess which one they got.
	const [filter, setFilter] = useState<Filter | null>(null);
	const [available, setAvailable] = useState(false);
	// What the microphone is actually doing, which is not the preference until there is a filter to tell.
	const [enabled, setEnabled] = useState(false);

	// Read through a ref inside the effect below: setting the filter up must not start over every time the user
	// flicks the switch — that is what the switch itself is for.
	const preferredRef = useRef(preferred);
	preferredRef.current = preferred;

	useEffect(() => {
		if (!audioTrack) {
			setAvailable(false);
			setEnabled(false);
			setFilter(null);
			return;
		}

		let cancelled = false;

		/** Settle on the browser's own, which is a constraint on the microphone rather than a processor. */
		const fallBackToBrowser = async (on: boolean) => {
			filterRef.current = 'browser';
			setFilter('browser');
			// Whatever the microphone was created with is the truth until the switch is used, and LiveKit's own audio
			// defaults ask for suppression — so this reports the preference rather than restarting the track to
			// enforce it, which would cost a gap in the audio on the way into every call.
			setAvailable(true);
			setEnabled(on);
		};

		void (async () => {
			try {
				const { KrispNoiseFilter, isKrispNoiseFilterSupported } = await import('@livekit/krisp-noise-filter');
				if (cancelled) {
					return;
				}

				if (!isKrispNoiseFilterSupported()) {
					await fallBackToBrowser(preferredRef.current);
					return;
				}

				// eslint-disable-next-line new-cap
				const processor = KrispNoiseFilter();
				await audioTrack.setProcessor(processor);
				if (cancelled) {
					void processor.destroy().catch(() => undefined);
					return;
				}

				// The moment of truth, and the reason this is not fire-and-forget: `setEnabled` is where Krisp
				// authenticates, and where a workspace without an entitlement for it is turned down.
				let krispWorks = false;
				try {
					await processor.setEnabled(true);
					krispWorks = processor.isEnabled();
				} catch (err) {
					console.info('krisp noise cancelling is not available to this workspace, using the browser’s own', err);
				}

				if (cancelled) {
					void processor.destroy().catch(() => undefined);
					return;
				}

				if (!krispWorks) {
					// Out of the path entirely rather than left switched off: every sample would still be routed
					// through its worklet, which costs latency and gives nothing back.
					void processor.destroy().catch(() => undefined);
					await audioTrack.stopProcessor?.().catch(() => undefined);
					await fallBackToBrowser(preferredRef.current);
					return;
				}

				processorRef.current = processor;
				filterRef.current = 'krisp';
				setFilter('krisp');
				setAvailable(true);

				if (!preferredRef.current) {
					await processor.setEnabled(false);
				}
				setEnabled(processor.isEnabled());
			} catch (err) {
				// Quality of life, not load-bearing: a microphone with no filter is still a microphone. The browser's
				// own is still worth offering, since it needs nothing but the track.
				console.warn('noise cancelling could not be set up', err);
				if (!cancelled) {
					void fallBackToBrowser(preferredRef.current);
				}
			}
		})();

		return () => {
			cancelled = true;
			const processor = processorRef.current;
			processorRef.current = null;
			filterRef.current = null;
			setFilter(null);
			setAvailable(false);
			setEnabled(false);
			if (processor) {
				void processor.destroy().catch(() => undefined);
				void audioTrack.stopProcessor?.().catch(() => undefined);
			}
		};
	}, [audioTrack]);

	const toggle = useCallback(() => {
		const next = !enabled;

		// Remembered either way: whoever turns this off has a reason that will still hold on their next call.
		toggleNoiseSuppression();

		if (filterRef.current === 'krisp' && processorRef.current) {
			const processor = processorRef.current;
			void processor
				.setEnabled(next)
				.then(() => setEnabled(processor.isEnabled()))
				.catch((err: unknown) => {
					console.warn('could not switch noise cancelling', err);
					setEnabled(processor.isEnabled());
				});
			return;
		}

		// The browser's own is a property of the microphone, so switching it means asking for the microphone again.
		// Optimistic, and corrected if the request is refused: the alternative is a switch that does nothing for a
		// second and then moves, which reads as a switch that did not work.
		setEnabled(next);
		void audioTrack?.restartTrack({ noiseSuppression: next, echoCancellation: true, autoGainControl: true }).catch((err: unknown) => {
			console.warn('could not switch the browser’s noise suppression', err);
			setEnabled(!next);
		});
	}, [audioTrack, enabled, toggleNoiseSuppression]);

	// Held steady across renders, because the call's context value is built from it and pushed up to the provider
	// above: a fresh object here made that value new on every render, which turned the push into a loop —
	// "Maximum update depth exceeded", 76 times, from an effect that only meant to report a change.
	return useMemo(
		() => ({
			/** Whether there is anything to switch. False until a filter is settled on. */
			available,
			enabled,
			/** Which one ended up doing the work, so the menu can say so. */
			filter,
			toggle,
		}),
		[available, enabled, filter, toggle],
	);
};
