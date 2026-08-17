import { Box, RadioButton } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { forwardRef, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ActionButton } from '.';
import { useMediaCallView } from '../context/MediaCallViewContext';
import { SYSTEM_DEFAULT_DEVICE_ID, deviceName, orderDevices } from '../utils/deviceLabels';

type CameraPickerButtonProps = {
	secondary?: boolean;
	small?: boolean;
} & Omit<ComponentProps<typeof ActionButton>, 'label' | 'icon'>;

// Mirrors DevicePicker's button-wrapper trick: strip the rogue `small: true`
// GenericMenu passes when disabled and stamp our own chevron-down icon.
const CameraPickerButton = forwardRef<HTMLButtonElement, CameraPickerButtonProps>(function CameraPickerButton(
	{ secondary = false, small: _small, ...props },
	ref,
) {
	return <ActionButton secondary={secondary} flexShrink={1} flexGrow={0} {...props} label='Camera options' icon='chevron-up' ref={ref} />;
});

// Lightweight in-component enumeration: ui-contexts' useAvailableDevices only
// covers audio, but the in-call view needs videoinput selection so we go to
// the platform directly. In an active call the camera permission is already
// granted (or will have been when the user toggled the camera on), so labels
// are populated.
const useAvailableVideoInputs = () => {
	const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
	useEffect(() => {
		if (!navigator.mediaDevices?.enumerateDevices) return undefined;
		let cancelled = false;
		const refresh = () => {
			navigator.mediaDevices
				.enumerateDevices()
				.then((list) => {
					if (cancelled) return;
					setDevices(list.filter((d) => d.kind === 'videoinput'));
				})
				.catch(() => undefined);
		};
		refresh();
		// Browsers fire `devicechange` on hot-plug / disconnect / OS-level
		// default changes; refresh so the menu reflects reality.
		navigator.mediaDevices.addEventListener?.('devicechange', refresh);
		return () => {
			cancelled = true;
			navigator.mediaDevices.removeEventListener?.('devicechange', refresh);
		};
	}, []);
	return devices;
};

// eslint-disable-next-line react/no-multi-comp
const CameraPicker = ({ secondary = true, danger = false, className }: { secondary?: boolean; danger?: boolean; className?: string }) => {
	const { t } = useTranslation();
	const { onVideoInputChange, currentCameraDeviceId } = useMediaCallView();
	const devices = useAvailableVideoInputs();

	// The system default first, its duplicate dropped, and every name without the USB id the browser tacks on.
	const ordered = useMemo(() => orderDevices(devices), [devices]);

	// What is in use when nothing has been picked is the first on offer, which is what makes clicking it a no-op
	// below rather than a switch to the camera already running.
	const currentId = currentCameraDeviceId ?? ordered[0]?.deviceId;

	const items: GenericMenuItemProps[] = ordered.map((device) => {
		const name = deviceName(device.label) || t('Default');

		return {
			id: `${device.deviceId}-videoinput`,
			content: (
				<Box title={name} fontSize={14} display='flex' flexDirection='column' minWidth={0}>
					<Box is='span' withTruncatedText>
						{name}
					</Box>
					{/* Said on its own line, as a fact about the device rather than part of its name. */}
					{device.deviceId === SYSTEM_DEFAULT_DEVICE_ID && (
						<Box is='span' fontScale='c1' color='hint'>
							{t('System')} {t('Default').toLowerCase()}
						</Box>
					)}
				</Box>
			),
			addon: <RadioButton checked={device.deviceId === currentId} />,
		};
	});

	const sections = [{ title: t('Camera'), items }];

	// Hide entirely if the transport doesn't expose camera switching (P2P
	// today) — rendering a chevron that does nothing is worse than no chevron.
	const disabled = !onVideoInputChange || items.length === 0;

	const [isOpen, setIsOpen] = useSafely(useState(false));

	return (
		<GenericMenu
			title={disabled ? t('Device_settings_not_supported_by_browser') : t('Camera')}
			sections={sections}
			disabled={disabled}
			placement='top-end'
			selectionMode='single'
			isOpen={isOpen}
			onOpenChange={setIsOpen}
			className={className}
			onAction={(deviceId) => {
				if (typeof deviceId !== 'string') return;
				if (!deviceId.endsWith('-videoinput')) return;
				const id = deviceId.slice(0, -'-videoinput'.length);
				// Picking the camera already in use is not a change, and putting it through the switch anyway tore the
				// running track down and came back with a black frame. Nothing to do is nothing to do.
				if (id === currentId) return;
				onVideoInputChange?.(id);
			}}
			button={<CameraPickerButton secondary={secondary} danger={danger} />}
		/>
	);
};

export default CameraPicker;
