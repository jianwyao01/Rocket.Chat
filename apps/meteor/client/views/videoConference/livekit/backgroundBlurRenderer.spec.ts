import { backgroundBlurPlan } from './backgroundBlurRenderer';

it('keeps the number of compact passes bounded at the supported strengths and common camera sizes', () => {
	const radii = [6, 12, 17, 23, 35, 46, 69, 104, 138, 207];

	for (const radius of radii) {
		const plan = backgroundBlurPlan(radius);
		expect(plan.passes).toBeGreaterThanOrEqual(1);
		expect(plan.passes).toBeLessThanOrEqual(8);
	}
});

it('uses progressive passes and more downsampling only as the requested blur grows', () => {
	// Light / medium / strong at 720p.
	expect(backgroundBlurPlan(12)).toEqual({ scale: 2, passes: 2 });
	expect(backgroundBlurPlan(23)).toEqual({ scale: 2, passes: 5 });
	expect(backgroundBlurPlan(46)).toEqual({ scale: 4, passes: 5 });

	// Light / medium / strong at 1080p.
	expect(backgroundBlurPlan(17)).toEqual({ scale: 2, passes: 3 });
	expect(backgroundBlurPlan(35)).toEqual({ scale: 4, passes: 3 });
	expect(backgroundBlurPlan(69)).toEqual({ scale: 8, passes: 3 });
});
