import { Box, RadioButton } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useAvailableDevices, useSelectedDevices } from '@rocket.chat/ui-contexts';
import type { ComponentProps, MouseEvent } from 'react';
import { forwardRef, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ActionButton } from '.';
import VoiceActivity from './VoiceActivity';
import { useMediaCallView } from '../context/MediaCallViewContext';
import { useDeviceGroups } from '../hooks/useDeviceGroups';
import { useDevicePermissionPrompt2, stopTracks } from '../hooks/useDevicePermissionPrompt';
import { useAudioLevel } from '../providers/useAudioLevel';
import { SYSTEM_DEFAULT_DEVICE_ID, deviceName, isSameDevice, orderAudioDevices } from '../utils/deviceLabels';

export type DevicePickerButtonProps = {
	secondary?: boolean;
	small?: boolean;
	chevron?: boolean;
	/** How loud the microphone this picker belongs to is hearing, from 0 to 1. Shown in place of the chevron. */
	level?: number;
	/** Whether that microphone is off, in which case there is no activity to show and the chevron stays. */
	micMuted?: boolean;
} & Omit<ComponentProps<typeof ActionButton>, 'label' | 'icon'>;

// GenericMenu for some reason passes `small: true` when the button is disabled (??).
// so this is just a wrapper to stop that from happening.
// `chevron` renders the compact in-strip variant (small chevron-down) used
// when the picker sits inline next to its associated control (mic / camera);
// without it we keep the original "customize" cog icon.
const DevicePickerButton = forwardRef<HTMLButtonElement, DevicePickerButtonProps>(function DevicePickerButton(
	{ secondary = false, chevron = false, small: _small, level = 0, micMuted = false, ...props },
	ref,
) {
	// A live microphone shows what it is hearing rather than a chevron: three dots waiting, rising as someone
	// talks. The button still opens the same menu — nothing is lost — and the strip gains the one thing a caller
	// wondering whether they are being heard actually wants to know, without costing any room to say it. A muted
	// mic has nothing to show, so there the chevron stays.
	const showActivity = chevron && !micMuted;
	const restingIcon = chevron ? 'chevron-up' : 'customize';

	return (
		<ActionButton
			secondary={secondary}
			flexShrink={1}
			flexGrow={0}
			{...props}
			label={chevron ? 'Device options' : 'customize'}
			icon={showActivity ? <VoiceActivity level={level} size={16} /> : restingIcon}
			ref={ref}
		/>
	);
});

const getDefaultDeviceItem = (label: string, type: 'input' | 'output') => ({
	content: (
		<Box is='span' title={label} fontSize={14}>
			{label}
		</Box>
	),
	addon: <RadioButton onChange={() => undefined} checked={true} disabled />,
	id: `default-${type}`,
});

export type DevicePickerProps = {
	secondary?: boolean;
	className?: string;
	chevron?: boolean;
	/**
	 * Whether the device this selector belongs to is off. It takes the same colour as that toggle so the two
	 * halves read as one control rather than a red button with a grey tail.
	 */
	danger?: boolean;
};

// eslint-disable-next-line react/no-multi-comp
const DevicePicker = ({ secondary = false, chevron = false, danger = false, className }: DevicePickerProps) => {
	const { t } = useTranslation();

	const { onDeviceChange, sessionState, streams } = useMediaCallView();

	// Measured here rather than passed in: this is the picker for the local microphone, so the level it shows is
	// the one thing it can always work out for itself. A muted mic never moves, whatever it is still hearing.
	const micLevel = useAudioLevel(sessionState?.muted ? null : (streams?.localMicrophone?.stream ?? null));

	const availableDevices = useAvailableDevices();
	const selectedAudioDevices = useSelectedDevices();

	// Which hardware each id belongs to, so the system default's duplicate can be told from a second device that
	// merely shares its name.
	const deviceGroups = useDeviceGroups();

	// The system default first, wherever the browser happened to put it: it is what will be used if nothing is
	// picked, so it is what should be under the cursor.
	const availableInputDevice = orderAudioDevices(availableDevices?.audioInput ?? [], deviceGroups).map<GenericMenuItemProps>((device) => {
		if (!device.id || !device.label) {
			return getDefaultDeviceItem(t('Default'), 'input');
		}

		// Named without the USB vendor:product pair the browser tacks on, and without the "Default - " prefix,
		// which is said on its own line instead.
		const name = deviceName(device.label) || t('Default');

		return {
			id: `${device.id}-input`,
			content: (
				<Box title={name} fontSize={14} display='flex' flexDirection='column' minWidth={0}>
					<Box is='span' withTruncatedText>
						{name}
					</Box>
					{device.id === SYSTEM_DEFAULT_DEVICE_ID && (
						<Box is='span' fontScale='c1' color='hint'>
							{t('System')} {t('Default').toLowerCase()}
						</Box>
					)}
				</Box>
			),
			// Matched by hardware, not by id: this list keeps the `default` alias while the app's selection is usually
			// the concrete twin of it, so comparing ids alone left the microphone in use looking unselected.
			addon: <RadioButton checked={isSameDevice(device.id, selectedAudioDevices?.audioInput?.id, deviceGroups)} />,
		};
	});

	const availableOutputDevice = orderAudioDevices(availableDevices?.audioOutput ?? [], deviceGroups).map<GenericMenuItemProps>((device) => {
		if (!device.id || !device.label) {
			return getDefaultDeviceItem(t('Default'), 'output');
		}

		const name = deviceName(device.label) || t('Default');

		return {
			id: `${device.id}-output`,
			content: (
				<Box title={name} fontSize={14} display='flex' flexDirection='column' minWidth={0}>
					<Box is='span' withTruncatedText>
						{name}
					</Box>
					{device.id === SYSTEM_DEFAULT_DEVICE_ID && (
						<Box is='span' fontScale='c1' color='hint'>
							{t('System')} {t('Default').toLowerCase()}
						</Box>
					)}
				</Box>
			),
			addon: <RadioButton checked={isSameDevice(device.id, selectedAudioDevices?.audioOutput?.id, deviceGroups)} />,
			onClick(e?: MouseEvent<HTMLElement>) {
				e?.preventDefault();
				e?.stopPropagation();
			},
		};
	});

	const micSection = {
		title: t('Microphone'),
		items: availableInputDevice,
	};

	const speakerSection = {
		title: t('Speaker'),
		items: availableOutputDevice,
	};

	const disabled = availableOutputDevice.length === 0 && availableInputDevice.length === 0;

	const [isOpen, setIsOpen] = useSafely(useState(false));

	const requestPermission = useDevicePermissionPrompt2();

	const onOpenChange = useCallback(
		(isOpen: boolean) => {
			if (!isOpen) {
				setIsOpen(false);
				return;
			}

			void requestPermission({
				actionType: 'device-change',
			}).then((stream) => {
				stopTracks(stream);
				setIsOpen(true);
			});
		},
		[requestPermission, setIsOpen],
	);

	return (
		<GenericMenu
			title={disabled ? t('Device_settings_not_supported_by_browser') : t('Device_settings_lowercase')}
			sections={[micSection, speakerSection]}
			disabled={disabled}
			placement='top-end'
			selectionMode='multiple'
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			className={className}
			onAction={(deviceId) => {
				if (typeof deviceId !== 'string') {
					return;
				}

				if (deviceId.includes('-input')) {
					const id = deviceId.replace('-input', '');
					// Choosing the device already in use is not a change; putting it through the switch anyway restarts a
					// track that was working.
					if (id === selectedAudioDevices?.audioInput?.id) {
						return;
					}
					const device = availableDevices?.audioInput?.find((device) => device.id === id);
					if (device) {
						onDeviceChange(device);
					}
					return;
				}

				if (deviceId.includes('-output')) {
					const id = deviceId.replace('-output', '');
					if (id === selectedAudioDevices?.audioOutput?.id) {
						return;
					}
					const device = availableDevices?.audioOutput?.find((device) => device.id === id);
					if (device) {
						onDeviceChange(device);
					}
					return;
				}

				console.warn('Device Picker - Failed to select device: Invalid deviceId', deviceId);
			}}
			button={
				<DevicePickerButton
					secondary={secondary || chevron}
					danger={danger}
					chevron={chevron}
					tiny={!chevron && !secondary}
					level={micLevel}
					micMuted={Boolean(sessionState?.muted)}
				/>
			}
		/>
	);
};

export default DevicePicker;
