import { subjectCategories } from './backgroundBlurProcessor';

// What the multiclass model reports. Five of its six categories are parts of a person, so anything that treats one
// category as "the subject" keeps only the hair sharp.
it('takes every category that is not the background as the person', () => {
	const subject = subjectCategories(['background', 'hair', 'body-skin', 'face-skin', 'clothes', 'others']);

	expect(subject[0]).toBe(0);
	[1, 2, 3, 4, 5].forEach((category) => expect(subject[category]).toBe(255));
});

// The landscape model reports one label and paints everything else 255, so its *marked* pixels are the person and
// the unnamed ones are the room. Read the other way round, it blurs the face and leaves the room sharp.
it('takes the only label there is as the person, and what it never names as background', () => {
	const subject = subjectCategories(['selfie']);

	expect(subject[0]).toBe(255);
	expect(subject[255]).toBe(0);
});

// Better a blurred background on a model nobody has met than a blurred face.
it('falls back to the first category where nothing is named', () => {
	expect(subjectCategories([])[0]).toBe(255);
});

it('answers for every category a mask could hold', () => {
	expect(subjectCategories(['background', 'hair'])).toHaveLength(256);
});
